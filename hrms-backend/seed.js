import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import Employee from "./models/Employee.js";
import LeaveRequest from "./models/LeaveRequest.js";
import Attendance from "./models/Attendance.js";
import RegularizationRequest from "./models/RegularizationRequest.js";
import Notification from "./models/Notification.js";

dotenv.config();

const SEED_USERS = [
  {
    name: "Sarah Jenkins",
    email: "admin@company.com",
    password: "password123", // Will be hashed via pre-save hook
    role: "HR Admin",
    department: "Human Resources",
    designation: "HR Director",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120",
  },
  {
    name: "Marcus Sterling",
    email: "manager@company.com",
    password: "password123",
    role: "Manager",
    department: "Engineering",
    designation: "Engineering Manager",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120",
  },
  {
    name: "David Vance",
    email: "employee@company.com",
    password: "password123",
    role: "Employee",
    department: "Engineering",
    designation: "Software Engineer",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120",
  },
];

const SEED_EMPLOYEES = [
  {
    id: "EMP-001",
    name: "Sarah Jenkins",
    email: "admin@company.com",
    role: "HR Admin",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120",
    department: "Human Resources",
    designation: "HR Director",
    joiningDate: "2022-01-15",
    status: "Active",
    phone: "+1 (555) 019-2834",
    location: "Chicago HQ",
    bankName: "Chase Bank",
    accountNo: "4820192834",
    ifscCode: "CHASUS33XX",
    documents: [],
    timeline: [],
  },
  {
    id: "EMP-002",
    name: "Marcus Sterling",
    email: "manager@company.com",
    role: "Manager",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120",
    department: "Engineering",
    designation: "Engineering Manager",
    joiningDate: "2021-03-10",
    status: "Active",
    phone: "+1 (555) 014-9988",
    location: "Chicago HQ",
    bankName: "Wells Fargo",
    accountNo: "9988112234",
    ifscCode: "WFLGUS66XX",
    documents: [],
    timeline: [],
  },
  {
    id: "EMP-003",
    name: "David Vance",
    email: "employee@company.com",
    role: "Employee",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120",
    department: "Engineering",
    designation: "Software Engineer",
    joiningDate: "2023-11-01",
    status: "Active",
    phone: "+1 (555) 018-7241",
    location: "Remote",
    bankName: "Bank of America",
    accountNo: "1122334455",
    ifscCode: "BOFAUS33XX",
    documents: [],
    timeline: [],
  },
];

const SEED_NOTIFICATIONS = [
  {
    employeeId: "EMP-003",
    title: "Welcome to PulseHRMS!",
    message: "Your employee dashboard and workspace profile are fully set up. Click around to explore features.",
    category: "system",
    isRead: false,
    time: "1 day ago"
  },
  {
    employeeId: "EMP-003",
    title: "Attendance Clock-in Policy",
    message: "Reminder: Regular shift clock-in starts daily before 9:15 AM to avoid being marked late.",
    category: "attendance",
    isRead: false,
    time: "2 hours ago"
  },
  {
    employeeId: "EMP-002",
    title: "Leave Request Submitted",
    message: "David Vance has submitted a new Sick Leave request for review.",
    category: "leave",
    isRead: false,
    time: "4 hours ago"
  }
];

const seedDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/pulse-hrms";
    if (mongoUri.includes("****") || mongoUri.includes("<password>")) {
      console.log("Remote MONGO_URI contains a placeholder password. Falling back to local MongoDB.");
      mongoUri = "mongodb://localhost:27017/pulse-hrms";
    }
    console.log("Connecting to MongoDB at:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    // Delete existing records from all collections
    await User.deleteMany({});
    await Employee.deleteMany({});
    await LeaveRequest.deleteMany({});
    await Attendance.deleteMany({});
    await RegularizationRequest.deleteMany({});
    await Notification.deleteMany({});
    console.log("Cleared existing collections.");

    // Insert Users
    for (const u of SEED_USERS) {
      await new User(u).save();
    }
    console.log("Seeded clean users successfully.");

    // Insert Employees
    await Employee.insertMany(SEED_EMPLOYEES);
    console.log("Seeded clean employees successfully.");

    // Insert Notifications
    await Notification.insertMany(SEED_NOTIFICATIONS);
    console.log("Seeded clean notifications successfully.");

    console.log("Database Seed/Clean Successful!");
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Database Seeding Failed:", error);
    process.exit(1);
  }
};

seedDB();
