import express from "express";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const employees = await Employee.find({});
    res.json(employees);
  } catch (error) {
    console.error("Fetch employees error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @desc    Get employee by ID
// @route   GET /api/employees/:id
// @access  Private
router.get("/:id", protect, async (req, res) => {
  try {
    const employee = await Employee.findOne({ id: req.params.id });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json(employee);
  } catch (error) {
    console.error("Fetch employee error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @desc    Create a new employee & user account
// @route   POST /api/employees
// @access  Private (HR Admin)
router.post("/", protect, authorize("HR Admin"), async (req, res) => {
  const {
    name,
    email,
    role,
    avatar,
    department,
    designation,
    joiningDate,
    status,
    phone,
    location,
    bankName,
    accountNo,
    ifscCode,
  } = req.body;

  try {
    const employeeExists = await Employee.findOne({ email });
    if (employeeExists) {
      return res.status(400).json({ message: "Employee with this email already exists" });
    }

    // Auto-generate employee ID
    const count = await Employee.countDocuments({});
    const newId = `EMP-${String(count + 1).padStart(3, "0")}`;

    const employee = new Employee({
      id: newId,
      name,
      email,
      role: role || "Employee",
      avatar: avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${email}`,
      department,
      designation,
      joiningDate,
      status: status || "Active",
      phone,
      location,
      bankName,
      accountNo,
      ifscCode,
      documents: [],
      timeline: [
        {
          title: "Joined the organization",
          description: `Onboarded as a ${designation}`,
          date: joiningDate,
          type: "joining",
        },
      ],
    });

    const savedEmployee = await employee.save();

    // Create corresponding user login
    const user = new User({
      name,
      email,
      password: "password123", // Default password
      role: role || "Employee",
      department,
      designation,
      avatar: avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${email}`,
    });
    await user.save();

    res.status(201).json(savedEmployee);
  } catch (error) {
    console.error("Create employee error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @desc    Update employee details
// @route   PUT /api/employees/:id
// @access  Private
router.put("/:id", protect, async (req, res) => {
  const { id } = req.params;

  try {
    const employee = await Employee.findOne({ id });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Authorization check: User can update own details, or HR Admins, or Managers
    if (
      req.user.role !== "HR Admin" &&
      req.user.role !== "Manager" &&
      req.user.email !== employee.email
    ) {
      return res.status(403).json({ message: "Not authorized to update this profile" });
    }

    // Track timeline if designation changes
    const updatedData = { ...req.body };
    if (updatedData.designation && updatedData.designation !== employee.designation) {
      employee.timeline.push({
        title: "Title Changed",
        description: `Promoted/Transferred to ${updatedData.designation}`,
        date: new Date().toISOString().split("T")[0],
        type: "promotion",
      });
    }

    // Update Employee document
    const updatedEmployee = await Employee.findOneAndUpdate(
      { id },
      { $set: updatedData, timeline: employee.timeline },
      { new: true, runValidators: true }
    );

    // Sync changes to User document if name, role, department, designation, or email changes
    await User.findOneAndUpdate(
      { email: employee.email },
      {
        $set: {
          name: updatedEmployee.name,
          email: updatedEmployee.email,
          role: updatedEmployee.role,
          department: updatedEmployee.department,
          designation: updatedEmployee.designation,
          avatar: updatedEmployee.avatar,
        },
      }
    );

    res.json(updatedEmployee);
  } catch (error) {
    console.error("Update employee error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @desc    Delete employee & user
// @route   DELETE /api/employees/:id
// @access  Private (HR Admin)
router.delete("/:id", protect, authorize("HR Admin"), async (req, res) => {
  try {
    const employee = await Employee.findOne({ id: req.params.id });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    await User.findOneAndDelete({ email: employee.email });
    await Employee.findOneAndDelete({ id: req.params.id });

    res.json({ message: "Employee and associated user deleted successfully" });
  } catch (error) {
    console.error("Delete employee error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @desc    Upload employee document
// @route   POST /api/employees/:id/documents
// @access  Private
router.post("/:id/documents", protect, async (req, res) => {
  const { id } = req.params;
  const { name, category, size } = req.body;

  try {
    const employee = await Employee.findOne({ id });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Auth check
    if (req.user.role !== "HR Admin" && req.user.email !== employee.email) {
      return res.status(403).json({ message: "Not authorized to upload files" });
    }

    const newDoc = {
      name,
      category,
      uploadedAt: new Date().toISOString().split("T")[0],
      size,
    };

    employee.documents.push(newDoc);
    employee.timeline.push({
      title: "Document Uploaded",
      description: `Uploaded document: ${name} (${category})`,
      date: new Date().toISOString().split("T")[0],
      type: "other",
    });

    await employee.save();
    res.status(201).json(employee);
  } catch (error) {
    console.error("Upload document error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @desc    Delete employee document
// @route   DELETE /api/employees/:id/documents/:docId
// @access  Private
router.delete("/:id/documents/:docId", protect, async (req, res) => {
  const { id, docId } = req.params;

  try {
    const employee = await Employee.findOne({ id });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Auth check
    if (req.user.role !== "HR Admin" && req.user.email !== employee.email) {
      return res.status(403).json({ message: "Not authorized to delete files" });
    }

    const doc = employee.documents.id(docId);
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    employee.documents.pull(docId);
    employee.timeline.push({
      title: "Document Deleted",
      description: `Removed document: ${doc.name}`,
      date: new Date().toISOString().split("T")[0],
      type: "other",
    });

    await employee.save();
    res.json(employee);
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
