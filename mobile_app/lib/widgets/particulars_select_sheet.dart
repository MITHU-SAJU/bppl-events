import 'package:flutter/material.dart';
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
  // Category dropdown state
  String? _selectedCategory;

  @override
  void initState() {
    super.initState();
    selectedNames = List.from(widget.initialSelected);
    filteredParticulars = widget.particulars;
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

  // Add new particular with dropdown category
  Future<void> _addNewParticular() async {
    if (_nameController.text.isEmpty || _selectedCategory == null) return;
    try {
      // Create on backend
      await ApiService.createParticular(_nameController.text, _selectedCategory!);
      // Update local lists to reflect instantly
      final newParticular = Particular(id: '', name: _nameController.text, category: _selectedCategory!);
      // Add to filtered list and selected names
      setState(() {
        filteredParticulars.add(newParticular);
        selectedNames.add(_nameController.text);
        _nameController.clear();
        _selectedCategory = null;
      });
      // Refresh parent data (optional)
      widget.onRefresh();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Particular added successfully')));
        // Keep the sheet open; updated lists will show new item
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to add: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    // Unique categories for dropdown (using widget.particulars to avoid search filters hiding categories)
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
   return SafeArea(
  child: SingleChildScrollView(
    child: Container(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 12,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(30),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [

          /// Drag Handle
          Center(
            child: Container(
              width: 50,
              height: 5,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),

          const SizedBox(height: 20),

          /// Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                "Select Services",
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: Colors.indigo,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),

          const SizedBox(height: 15),

          /// Search
          TextField(
            decoration: InputDecoration(
              hintText: "Search services...",
              prefixIcon: const Icon(
                Icons.search,
                color: Colors.indigo,
              ),
              filled: true,
              fillColor: Colors.grey.shade100,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(15),
                borderSide: BorderSide.none,
              ),
            ),
            onChanged: _filter,
          ),

          const SizedBox(height: 20),

          /// Services List
          ConstrainedBox(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.45,
            ),
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: grouped.length,
              itemBuilder: (context, index) {
                final category = grouped.keys.elementAt(index);
                final items = grouped[category]!;

                return Card(
                  elevation: 2,
                  margin: const EdgeInsets.only(bottom: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(10),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [

                        /// Category
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.indigo.shade50,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            category,
                            style: const TextStyle(
                              color: Colors.indigo,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),

                        const SizedBox(height: 8),

                        ...items.map(
                          (p) => CheckboxListTile(
                            contentPadding: EdgeInsets.zero,
                            dense: true,
                            activeColor: Colors.indigo,
                            title: Text(
                              p.name,
                              style: const TextStyle(fontSize: 15),
                            ),
                            value: selectedNames.contains(p.name),
                            onChanged: (_) =>
                                _toggleSelection(p.name),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          const SizedBox(height: 20),

          /// Admin Section
          Card(
            color: Colors.indigo.shade50,
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            child: Padding(
              padding: const EdgeInsets.all(15),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [

                  const Row(
                    children: [
                      Icon(
                        Icons.add_circle_outline,
                        color: Colors.indigo,
                      ),
                      SizedBox(width: 8),
                      Text(
                        "Add New Service",
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 15),

                  TextField(
                    controller: _nameController,
                    decoration: InputDecoration(
                      labelText: "Service Name",
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),

                  const SizedBox(height: 12),

                  DropdownButtonFormField<String>(
                    value: _selectedCategory,
                    isExpanded: true,
                    decoration: InputDecoration(
                      labelText: "Category",
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    items: categories
                        .map(
                          (c) => DropdownMenuItem(
                            value: c,
                            child: Text(c),
                          ),
                        )
                        .toList(),
                    onChanged: (val) =>
                        setState(() => _selectedCategory = val),
                  ),

                  const SizedBox(height: 12),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.add),
                      label: const Text("Add Service"),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.indigo,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          vertical: 14,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius:
                              BorderRadius.circular(12),
                        ),
                      ),
                      onPressed: _addNewParticular,
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 20),

          /// Done Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () =>
                  Navigator.pop(context, selectedNames),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.indigo,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  vertical: 16,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: const Text(
                "Done",
                style: TextStyle(
                  fontSize: 16,
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
