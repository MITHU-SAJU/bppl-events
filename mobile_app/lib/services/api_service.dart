import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/models.dart';

class ApiService {
  static const String baseUrl = 'https://bppl-events.onrender.com';

  static Future<List<Employee>> getEmployees() async {
    final response = await http.get(Uri.parse('$baseUrl/employees'));
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => Employee.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load employees');
    }
  }

  static Future<List<Particular>> getParticulars() async {
    final response = await http.get(Uri.parse('$baseUrl/particulars'));
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => Particular.fromJson(json)).toList();
    } else {
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
