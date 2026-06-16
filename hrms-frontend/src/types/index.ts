export type UserRole = "Employee" | "Manager" | "HR Admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  designation?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  type: "leave" | "attendance" | "system" | "performance";
}

export interface KPIWidget {
  title: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  iconName: string;
}

export interface EmployeeDoc {
  id: string;
  name: string;
  category: string;
  uploadedAt: string;
  size: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  type: "joining" | "promotion" | "transfer" | "award" | "other";
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department: string;
  designation: string;
  joiningDate: string;
  status: "Active" | "Inactive";
  phone: string;
  location: string;
  bankName?: string;
  accountNo?: string;
  ifscCode?: string;
  documents: EmployeeDoc[];
  timeline: TimelineEvent[];
}

export interface LeaveRequest {
  _id?: string;
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: "Casual Leave" | "Sick Leave" | "Annual Leave" | "Loss of Pay";
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  appliedAt: string;
}

export interface Payslip {
  id: string;
  month: string;
  year: number;
  netPay: number;
  basic: number;
  hra: number;
  allowance: number;
  pf: number;
  tax: number;
}

export interface Attendance {
  _id?: string;
  employeeId: string;
  dateStr: string;
  checkIn: string;
  checkOut: string;
  hours: string;
  status: "Present" | "Late" | "Leave" | "Absent" | "Weekend";
}

export interface RegularizationRequest {
  _id: string;
  employeeId: string;
  employeeName: string;
  dateStr: string;
  checkIn: string;
  checkOut: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAt?: string;
}

