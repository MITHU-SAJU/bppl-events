import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class ParticularsSelectSheet extends StatefulWidget {
  final List<Particular> particulars;
  final List<String> initialSelected;
  final VoidCallback onRefresh;

  const ParticularsSelectSheet({
    Key? key,
    required this.particulars,
    required this.initialSelected,
    required this.onRefresh,
  }) : super(key: key);

  @override
  State<ParticularsSelectSheet> createState() => _ParticularsSelectSheetState();
}

class _ParticularsSelectSheetState extends State<ParticularsSelectSheet> {
  String searchQuery = '';
  late List<Particular> filteredParticulars;
  late List<String> selectedNames;

  final _nameController = TextEditingController();
  final _searchCtrl = TextEditingController();
  String? _selectedCategory;

  @override
  void initState() {
    super.initState();
    selectedNames = List.from(widget.initialSelected);
    filteredParticulars = widget.particulars;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _searchCtrl.dispose();
    super.dispose();
  }

  void _filter(String query) {
    setState(() {
      searchQuery = query;
      filteredParticulars = widget.particulars.where((p) {
        return p.name.toLowerCase().contains(query.toLowerCase()) ||
            p.category.toLowerCase().contains(query.toLowerCase());
      }).toList();
    });
  }

  void _toggleSelection(String name) {
    setState(() {
      if (selectedNames.contains(name)) {
        selectedNames.remove(name);
      } else {
        selectedNames.add(name);
      }
    });
  }

  Future<void> _addNewParticular() async {
    if (_nameController.text.trim().isEmpty || _selectedCategory == null) return;
    final serviceName = _nameController.text.trim();
    try {
      await ApiService.createParticular(serviceName, _selectedCategory!);
      final newParticular = Particular(id: '', name: serviceName, category: _selectedCategory!);
      setState(() {
        filteredParticulars.add(newParticular);
        selectedNames.add(serviceName);
        _nameController.clear();
        _selectedCategory = null;
      });
      widget.onRefresh();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Service added successfully'),
            backgroundColor: Color(0xFF10B981),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to add service: $e'),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final defaultCategories = [
      "Photo Booths",
      "Games",
      "Drones 500grm",
      "Robots",
      "Hologram fan",
      "Sensors Activities & IOT devices",
      "Web Applications SDK",
      "Workshop & Fun",
      "Printers",
      "Casting",
      "Projection",
      "Other"
    ];
    final categoriesSet = widget.particulars.map((p) => p.category).toSet();
    categoriesSet.addAll(defaultCategories);
    final categories = categoriesSet.toList();

    final Map<String, List<Particular>> grouped = {};
    for (var p in filteredParticulars) {
      grouped.putIfAbsent(p.category, () => []).add(p);
    }

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
      ),
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 14,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Drag Handle
              Center(
                child: Container(
                  width: 48,
                  height: 5,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(height: 18),

              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    "Select Services",
                    style: GoogleFonts.inter(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF111827),
                    ),
                  ),
                  IconButton(
                    style: IconButton.styleFrom(
                      backgroundColor: const Color(0xFFF1F5F9),
                      padding: const EdgeInsets.all(8),
                    ),
                    icon: const Icon(Icons.close, color: Color(0xFF64748B), size: 18),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Search box
              TextField(
                controller: _searchCtrl,
                decoration: InputDecoration(
                  hintText: "Search services...",
                  hintStyle: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 14),
                  prefixIcon: const Icon(Icons.search, color: Color(0xFF4F46E5), size: 20),
                  suffixIcon: searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, color: Color(0xFF94A3B8), size: 18),
                          onPressed: () {
                            _searchCtrl.clear();
                            _filter('');
                          },
                        )
                      : null,
                  filled: true,
                  fillColor: const Color(0xFFF8FAFC),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(vertical: 14),
                ),
                style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF111827)),
                onChanged: _filter,
              ),
              const SizedBox(height: 20),

              // List of services
              ConstrainedBox(
                constraints: BoxConstraints(
                  maxHeight: MediaQuery.of(context).size.height * 0.4,
                ),
                child: grouped.isEmpty
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 36),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.design_services_outlined, size: 48, color: Color(0xFFCBD5E1)),
                              const SizedBox(height: 12),
                              Text(
                                'No services found',
                                style: GoogleFonts.inter(
                                  color: const Color(0xFF6B7280),
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      )
                    : ListView.builder(
                        shrinkWrap: true,
                        itemCount: grouped.length,
                        itemBuilder: (context, index) {
                          final category = grouped.keys.elementAt(index);
                          final items = grouped[category]!;

                          return Card(
                            elevation: 0,
                            margin: const EdgeInsets.only(bottom: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                              side: const BorderSide(color: Color(0xFFF1F5F9)),
                            ),
                            color: Colors.white,
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFEEF2FF),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Text(
                                      category,
                                      style: GoogleFonts.inter(
                                        color: const Color(0xFF4F46E5),
                                        fontWeight: FontWeight.bold,
                                        fontSize: 11,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 10),
                                  ...items.map(
                                    (p) {
                                      final isChecked = selectedNames.contains(p.name);
                                      return InkWell(
                                        onTap: () => _toggleSelection(p.name),
                                        borderRadius: BorderRadius.circular(10),
                                        child: Padding(
                                          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                                          child: Row(
                                            children: [
                                              Expanded(
                                                child: Text(
                                                  p.name,
                                                  style: GoogleFonts.inter(
                                                    fontSize: 14,
                                                    fontWeight: isChecked ? FontWeight.bold : FontWeight.w500,
                                                    color: isChecked ? const Color(0xFF111827) : const Color(0xFF475569),
                                                  ),
                                                ),
                                              ),
                                              SizedBox(
                                                width: 24,
                                                height: 24,
                                                child: Checkbox(
                                                  activeColor: const Color(0xFF4F46E5),
                                                  shape: RoundedRectangleBorder(
                                                    borderRadius: BorderRadius.circular(6),
                                                  ),
                                                  side: const BorderSide(color: Color(0xFFCBD5E1), width: 1.5),
                                                  value: isChecked,
                                                  onChanged: (_) => _toggleSelection(p.name),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
              ),
              const SizedBox(height: 12),

              // Add Service Section (Accessible to all)
              Card(
                color: const Color(0xFFEEF2FF).withOpacity(0.5),
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(color: const Color(0xFF4F46E5).withOpacity(0.15)),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(
                            Icons.add_circle_outline_rounded,
                            color: Color(0xFF4F46E5),
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            "Add New Service",
                            style: GoogleFonts.inter(
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                              color: const Color(0xFF111827),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      TextField(
                        controller: _nameController,
                        decoration: InputDecoration(
                          labelText: "Service Name",
                          hintText: "e.g. Interactive AI Mirror",
                          hintStyle: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 13.5),
                          filled: true,
                          fillColor: Colors.white,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: Color(0xFF4F46E5), width: 1.5),
                          ),
                          labelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500),
                          contentPadding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                        ),
                        style: GoogleFonts.inter(fontSize: 13.5),
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        value: _selectedCategory,
                        isExpanded: true,
                        decoration: InputDecoration(
                          labelText: "Category",
                          hintText: "Select a Category",
                          filled: true,
                          fillColor: Colors.white,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: Color(0xFF4F46E5), width: 1.5),
                          ),
                          labelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500),
                          contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
                        ),
                        style: GoogleFonts.inter(fontSize: 13.5, color: const Color(0xFF111827)),
                        items: categories
                            .map(
                              (c) => DropdownMenuItem(
                                value: c,
                                child: Text(c, style: GoogleFonts.inter(fontSize: 13.5)),
                              ),
                            )
                            .toList(),
                        onChanged: (val) => setState(() => _selectedCategory = val),
                      ),
                      const SizedBox(height: 14),
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton.icon(
                          icon: const Icon(Icons.add, size: 18),
                          label: Text(
                            "Add Service",
                            style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF4F46E5),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            elevation: 0,
                          ),
                          onPressed: _addNewParticular,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Done Button
              SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context, selectedNames),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF4F46E5),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 0,
                  ),
                  child: Text(
                    "Done",
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
