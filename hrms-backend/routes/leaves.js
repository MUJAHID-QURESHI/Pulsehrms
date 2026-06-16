import express from "express";
import LeaveRequest from "../models/LeaveRequest.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// @desc    Get all leave requests
// @route   GET /api/leaves
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    let query = {};
    
    // Employees can only view their own leave requests
    if (req.user.role === "Employee") {
      if (!req.employee) {
        return res.json([]); // No employee profile linked
      }
      query = { employeeId: req.employee.id };
    }
    
    const leaves = await LeaveRequest.find(query).sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    console.error("Fetch leaves error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @desc    Apply for a leave
// @route   POST /api/leaves
// @access  Private
router.post("/", protect, async (req, res) => {
  const { leaveType, startDate, endDate, days, reason } = req.body;

  try {
    if (!req.employee) {
      return res.status(400).json({ message: "No employee profile associated with this user" });
    }

    const leave = new LeaveRequest({
      employeeId: req.employee.id,
      employeeName: req.employee.name,
      leaveType,
      startDate,
      endDate,
      days,
      reason,
      status: "Pending",
      appliedAt: new Date().toISOString().split("T")[0],
    });

    const savedLeave = await leave.save();
    res.status(201).json(savedLeave);
  } catch (error) {
    console.error("Apply leave error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @desc    Approve or Reject a leave request
// @route   PUT /api/leaves/:id/status
// @access  Private (Manager or HR Admin)
router.put("/:id/status", protect, authorize("Manager", "HR Admin"), async (req, res) => {
  const { status } = req.body; // "Approved" or "Rejected"

  if (!["Approved", "Rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status value. Must be Approved or Rejected" });
  }

  try {
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    leave.status = status;
    const updatedLeave = await leave.save();
    res.json(updatedLeave);
  } catch (error) {
    console.error("Update leave status error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
