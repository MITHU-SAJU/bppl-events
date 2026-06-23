import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/models.dart';
import '../services/api_service.dart';
import '../widgets/employee_select_sheet.dart';
import '../widgets/particulars_select_sheet.dart';

class EmployeeFormScreen extends StatefulWidget {
  const EmployeeFormScreen({Key? key}) : super(key: key);

  @override
  State<EmployeeFormScreen> createState() => _EmployeeFormScreenState();
}

class _EmployeeFormScreenState extends State<EmployeeFormScreen> {
  // Data lists
  List<Employee> _employees = [];
  List<Particular> _particulars = [];

  // Form values
  Employee? _selectedEmployee;
  List<String> _selectedParticulars = [];
  DateTime? _startDate;
  DateTime? _endDate;
  final TextEditingController _eventNameCtrl = TextEditingController();
  final TextEditingController _eventPlaceCtrl = TextEditingController();

  // UI state
  bool _isLoading = false;
  bool _showSuccess = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  // Load initial data (employees and particulars)
  Future<void> _loadInitialData() async {
    setState(() => _isLoading = true);
    try {
      final employees = await ApiService.getEmployees();
      final particulars = await ApiService.getParticulars();
      setState(() {
        _employees = employees;
        _particulars = particulars;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to load reference data';
        _isLoading = false;
      });
    }
  }

  // Refresh particulars list from backend
  Future<void> _refreshParticulars() async {
    setState(() => _isLoading = true);
    try {
      final particulars = await ApiService.getParticulars();
      setState(() {
        _particulars = particulars;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to refresh services';
        _isLoading = false;
      });
    }
  }


  int _calculateDays() {
    if (_startDate == null || _endDate == null) return 0;
    final diff = _endDate!.difference(_startDate!).inDays + 1;
    return diff > 0 ? diff : 0;
  }

  Future<void> _submit() async {
    if (_selectedEmployee == null || _startDate == null || _endDate == null || _eventNameCtrl.text.isEmpty || _eventPlaceCtrl.text.isEmpty) {
      setState(() => _errorMessage = 'Please fill all required fields');
      return;
    }
    final submission = EventSubmission(
      employeeId: _selectedEmployee!.employeeId,
      employeeName: _selectedEmployee!.name,
      startDate: DateFormat('yyyy-MM-dd').format(_startDate!),
      endDate: DateFormat('yyyy-MM-dd').format(_endDate!),
      eventName: _eventNameCtrl.text,
      eventPlace: _eventPlaceCtrl.text,
      particulars: _selectedParticulars.join(', '),
    );
    setState(() => _isLoading = true);
    try {
      await ApiService.createEvent(submission);
      setState(() {
        _showSuccess = true;
        _isLoading = false;
        // reset form
        _selectedEmployee = null;
        _selectedParticulars = [];
        _startDate = null;
        _endDate = null;
        _eventNameCtrl.clear();
        _eventPlaceCtrl.clear();
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Submission failed: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  Future<void> _pickDate({required bool isStart}) async {
    final initial = isStart ? _startDate ?? DateTime.now() : _endDate ?? DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (picked != null) {
      setState(() {
        if (isStart) {
          _startDate = picked;
          // ensure end date is not before start
          if (_endDate != null && _endDate!.isBefore(picked)) _endDate = null;
        } else {
          _endDate = picked;
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      appBar: AppBar(
        title: const Text('bppl events'),
        backgroundColor: Colors.indigo,
      ),
      body: _isLoading && _employees.isEmpty && _particulars.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (_errorMessage != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text(_errorMessage!, style: const TextStyle(color: Colors.red)),
                    ),
                  // Employee Name selector
                  const Text('Employee Name', style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  OutlinedButton(
                    onPressed: () async {
                      final result = await showModalBottomSheet<Employee>(
                        context: context,
                        isScrollControlled: true,
                        builder: (_) => EmployeeSelectSheet(employees: _employees),
                      );
                      if (result != null) {
                        setState(() => _selectedEmployee = result);
                      }
                    },
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        _selectedEmployee?.name ?? 'Select Employee',
                        style: TextStyle(color: _selectedEmployee == null ? Colors.grey[600] : Colors.black),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Particulars / Services
                  const Text('Particulars / Services Selected', style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  OutlinedButton(
                    onPressed: () async {
                      final result = await showModalBottomSheet<List<String>>(
                        context: context,
                        isScrollControlled: true,
                        builder: (_) => ParticularsSelectSheet(
                          particulars: _particulars,
                          initialSelected: _selectedParticulars,
                          onRefresh: _refreshParticulars,
                        ),
                      );
                      if (result != null) {
                        setState(() => _selectedParticulars = result);
                      }
                    },
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        _selectedParticulars.isEmpty ? 'Select Particulars / Services' : _selectedParticulars.join(', '),
                        style: TextStyle(color: _selectedParticulars.isEmpty ? Colors.grey[600] : Colors.black),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Align(
                    alignment: Alignment.centerRight,
                    child: Text('▼', style: TextStyle(fontSize: 18, color: Colors.indigo)),
                  ),
                  const SizedBox(height: 16),
                  // Start Date
                  const Text('Start Date', style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  OutlinedButton(
                    onPressed: () => _pickDate(isStart: true),
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        _startDate == null ? 'dd-mm-yyyy' : DateFormat('dd-MM-yyyy').format(_startDate!),
                        style: TextStyle(color: _startDate == null ? Colors.grey[600] : Colors.black),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  // End Date
                  const Text('End Date', style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  OutlinedButton(
                    onPressed: () => _pickDate(isStart: false),
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        _endDate == null ? 'dd-mm-yyyy' : DateFormat('dd-MM-yyyy').format(_endDate!),
                        style: TextStyle(color: _endDate == null ? Colors.grey[600] : Colors.black),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  if (_calculateDays() > 0)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.indigo.withAlpha(25), // approx 10% opacity
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'Duration: ${_calculateDays()} ${_calculateDays() == 1 ? 'day' : 'days'}',
                          style: const TextStyle(color: Colors.indigo, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ),
                  const SizedBox(height: 16),
                  // Event Name
                  const Text('Event Name', style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  TextField(
                    controller: _eventNameCtrl,
                    decoration: const InputDecoration(
                      hintText: 'e.g. Annual Tech Symposium',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Event Place
                  const Text('Event Place', style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  TextField(
                    controller: _eventPlaceCtrl,
                    decoration: const InputDecoration(
                      hintText: 'e.g. Bangalore',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.indigo, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                    onPressed: _isLoading ? null : () async {
                      await _submit();
                      if (_showSuccess) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Success!'), backgroundColor: Colors.green, duration: Duration(seconds: 3)),
                        );
                        setState(() => _showSuccess = false);
                      }
                    },
                    child: _isLoading
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Text('Submit Event Details', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
      floatingActionButton: null,
    );
  }

  @override
  void didUpdateWidget(covariant EmployeeFormScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    // No modal needed; snackbar handled in submit.
  }
}
