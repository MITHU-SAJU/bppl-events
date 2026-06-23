class Employee {
  final String id;
  final String employeeId;
  final String name;

  Employee({
    required this.id,
    required this.employeeId,
    required this.name,
  });

  factory Employee.fromJson(Map<String, dynamic> json) {
    return Employee(
      id: json['_id'] ?? json['id'] ?? '',
      employeeId: json['employeeId'] ?? '',
      name: json['name'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'employeeId': employeeId,
      'name': name,
    };
  }
}

class Particular {
  final String id;
  final String name;
  final String category;

  Particular({
    required this.id,
    required this.name,
    required this.category,
  });

  factory Particular.fromJson(Map<String, dynamic> json) {
    return Particular(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      category: json['category'] ?? 'Other',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'category': category,
    };
  }
}

class EventSubmission {
  final String employeeId;
  final String employeeName;
  final String startDate;
  final String endDate;
  final String eventName;
  final String eventPlace;
  final String particulars;

  EventSubmission({
    required this.employeeId,
    required this.employeeName,
    required this.startDate,
    required this.endDate,
    required this.eventName,
    required this.eventPlace,
    required this.particulars,
  });

  Map<String, dynamic> toJson() {
    return {
      'employeeId': employeeId,
      'employeeName': employeeName,
      'startDate': startDate,
      'endDate': endDate,
      'eventName': eventName,
      'eventPlace': eventPlace,
      'particulars': particulars,
    };
  }
}
