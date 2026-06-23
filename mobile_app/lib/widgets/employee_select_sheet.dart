import 'package:flutter/material.dart';
import '../models/models.dart';

class EmployeeSelectSheet extends StatefulWidget {
  final List<Employee> employees;

  const EmployeeSelectSheet({Key? key, required this.employees}) : super(key: key);

  @override
  State<EmployeeSelectSheet> createState() => _EmployeeSelectSheetState();
}

class _EmployeeSelectSheetState extends State<EmployeeSelectSheet> {
  String searchQuery = '';
  late List<Employee> filteredEmployees;

  @override
  void initState() {
    super.initState();
    filteredEmployees = widget.employees;
  }

  void _filter(String query) {
    setState(() {
      searchQuery = query;
      filteredEmployees = widget.employees.where((e) {
        return e.name.toLowerCase().contains(query.toLowerCase()) || 
               e.employeeId.toLowerCase().contains(query.toLowerCase());
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Select Employee',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.indigo),
              ),
              IconButton(
                icon: const Icon(Icons.close, color: Colors.grey),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            decoration: InputDecoration(
              hintText: 'Search by name or ID...',
              prefixIcon: const Icon(Icons.search, color: Colors.indigo),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide.none,
              ),
              filled: true,
              fillColor: Colors.grey[100],
              contentPadding: const EdgeInsets.symmetric(vertical: 0),
            ),
            onChanged: _filter,
          ),
          const SizedBox(height: 16),
          ConstrainedBox(
            constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.4),
            child: filteredEmployees.isEmpty
                ? const Center(child: Padding(
                  padding: EdgeInsets.all(20.0),
                  child: Text('No employees found', style: TextStyle(color: Colors.grey)),
                ))
                : ListView.separated(
                    shrinkWrap: true,
                    itemCount: filteredEmployees.length,
                    separatorBuilder: (context, index) => Divider(height: 1, color: Colors.grey[200]),
                    itemBuilder: (context, index) {
                      final employee = filteredEmployees[index];
                      return ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text(employee.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Text(employee.employeeId, style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                        trailing: const Icon(Icons.chevron_right, color: Colors.grey, size: 20),
                        onTap: () => Navigator.pop(context, employee),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
