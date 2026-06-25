import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../models/models.dart';

class ApiService {
  static String get baseUrl {
    if (kDebugMode) {
      if (defaultTargetPlatform == TargetPlatform.android) {
        return 'https://bppl-events.onrender.com';
      }
      return 'http://127.0.0.1:8000';
    }
    return 'https://bppl-events.onrender.com';
  }

  static Future<List<Employee>>? _employeesFuture;
  static Future<List<Particular>>? _particularsFuture;

  static Future<List<Employee>> getEmployees({bool forceRefresh = false}) {
    if (forceRefresh || _employeesFuture == null) {
      _employeesFuture = _fetchEmployees();
    }
    return _employeesFuture!;
  }

  static Future<List<Employee>> _fetchEmployees() async {
    final response = await http.get(Uri.parse('$baseUrl/employees'));
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => Employee.fromJson(json)).toList();
    } else {
      _employeesFuture = null; // Clear on error so future attempts retry
      throw Exception('Failed to load employees');
    }
  }

  static Future<List<Particular>> getParticulars({bool forceRefresh = false}) {
    if (forceRefresh || _particularsFuture == null) {
      _particularsFuture = _fetchParticulars();
    }
    return _particularsFuture!;
  }

  static Future<List<Particular>> _fetchParticulars() async {
    final response = await http.get(Uri.parse('$baseUrl/particulars'));
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => Particular.fromJson(json)).toList();
    } else {
      _particularsFuture = null; // Clear on error so future attempts retry
      throw Exception('Failed to load particulars');
    }
  }

  static Future<Particular> createParticular(String name, String category) async {
    final response = await http.post(
      Uri.parse('$baseUrl/particulars'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'name': name, 'category': category}),
    );
    
    if (response.statusCode == 200 || response.statusCode == 201) {
      return Particular.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to create particular');
    }
  }

  static Future<void> createEvent(EventSubmission submission) async {
    final response = await http.post(
      Uri.parse('$baseUrl/events'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(submission.toJson()),
    );

    if (response.statusCode != 200 && response.statusCode != 201) {
      throw Exception('Failed to create event: ${response.body}');
    }
  }
}
