import express from "express";
import Attendance from "../models/Attendance.js";
import RegularizationRequest from "../models/RegularizationRequest.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Helper: Format date to friendly YYYY-MM-DD local format
const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper: Format Date object to friendly 12h time string (e.g., "09:05 AM")
const formatTime12h = (date) => {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const hoursStr = String(hours).padStart(2, "0");
  const minutesStr = String(minutes).padStart(2, "0");
  return `${hoursStr}:${minutesStr} ${ampm}`;
};

// Helper: Reconstruct ISO string from dateStr & timeStr
const reconstructISO = (dateStr, timeStr) => {
  if (!timeStr || timeStr === "-- : --") return null;
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (modifier === "PM" && hours < 12) {
    hours += 12;
  }
  if (modifier === "AM" && hours === 12) {
    hours = 0;
  }
  const hoursStr = String(hours).padStart(2, "0");
  const minutesStr = String(minutes).padStart(2, "0");
  
  // Construct date object using local components
  const localDate = new Date();
  const [y, m, d] = dateStr.split("-").map(Number);
  localDate.setFullYear(y);
  localDate.setMonth(m - 1);
  localDate.setDate(d);
  localDate.setHours(hoursStr, minutesStr, 0, 0);
  return localDate.toISOString();
};

// Helper: Calculate elapsed hours between two ISO strings
const calculateHours = (startISO, endISO) => {
  const diffMs = new Date(endISO) - new Date(startISO);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const hrs = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `${hrs}h ${mins}m`;
};

// @desc    Get all attendance logs
// @route   GET /api/attendance
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    let query = {};
    
    // Employees can only view their own attendance logs
    if (req.user.role === "Employee") {
      if (!req.employee) {
        return res.json([]);
      }
      query = { employeeId: req.employee.id };
    } else if (req.query.employeeId) {
      // Admins/Managers can filter by employeeId
      query = { employeeId: req.query.employeeId };
    }

    const logs = await Attendance.find(query).sort({ dateStr: -1 });
    res.json(logs);
  } catch (error) {
    console.error("Fetch attendance logs error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @desc    Get current punch status
// @route   GET /api/attendance/status
// @access  Private
router.get("/status", protect, async (req, res) => {
  try {
    if (!req.employee) {
      return res.json({ isPunchedIn: false, punchTime: null });
    }

    // Look for an open attendance session (checkOut is "-- : --")
    const activeSession = await Attendance.findOne({
      employeeId: req.employee.id,
      checkOut: "-- : --",
    });

    if (activeSession) {
      const punchTimeISO = reconstructISO(activeSession.dateStr, activeSession.checkIn);
      res.json({
        isPunchedIn: true,
        punchTime: punchTimeISO,
      });
    } else {
      res.json({
        isPunchedIn: false,
        punchTime: null,
      });
    }
  } catch (error) {
    console.error("Get punch status error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @desc    Punch In / Punch Out toggle
// @route   POST /api/attendance/punch
// @access  Private
router.post("/punch", protect, async (req, res) => {
  try {
    if (!req.employee) {
      return res.status(400).json({ message: "No employee profile linked to user" });
    }

    const employeeId = req.employee.id;
    const todayStr = getLocalDateString();
    const now = new Date();
    const timeStr = formatTime12h(now);

    // Look for an open session
    let session = await Attendance.findOne({
      employeeId,
      checkOut: "-- : --",
    });

    if (!session) {
      // PUNCH IN
      // Check if user already has a completed attendance for today
      const completedToday = await Attendance.findOne({ employeeId, dateStr: todayStr });
      if (completedToday) {
        return res.status(400).json({ message: "You have already completed your punch out shift for today." });
      }

      // Determine status (Late if check-in is after 09:15 AM)
      let status = "Present";
      const limitTime = new Date();
      limitTime.setHours(9, 15, 0, 0);
      if (now > limitTime) {
        status = "Late";
      }

      session = new Attendance({
        employeeId,
        dateStr: todayStr,
        checkIn: timeStr,
        checkOut: "-- : --",
        hours: "0h",
        status,
      });

      await session.save();

      res.json({
        isPunchedIn: true,
        punchTime: now.toISOString(),
        attendance: session,
      });
    } else {
      // PUNCH OUT
      const checkInISO = reconstructISO(session.dateStr, session.checkIn);
      const hoursStr = calculateHours(checkInISO, now.toISOString());

      session.checkOut = timeStr;
      session.hours = hoursStr;

      await session.save();

      res.json({
        isPunchedIn: false,
        punchTime: null,
        attendance: session,
      });
    }
  } catch (error) {
    console.error("Punch action error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @desc    Submit attendance regularization request
// @route   POST /api/attendance/regularize
// @access  Private
router.post("/regularize", protect, async (req, res) => {
  const { dateStr, checkIn, checkOut, reason } = req.body;

  try {
    if (!req.employee) {
      return res.status(400).json({ message: "No employee profile linked to user" });
    }

    const request = new RegularizationRequest({
      employeeId: req.employee.id,
      employeeName: req.employee.name,
      dateStr,
      checkIn,
      checkOut,
      reason,
      status: "Pending",
    });

    const savedRequest = await request.save();
    res.status(201).json(savedRequest);
  } catch (error) {
    console.error("Submit regularization error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @desc    Get all regularization requests
// @route   GET /api/attendance/regularizations
// @access  Private
router.get("/regularizations", protect, async (req, res) => {
  try {
    let query = {};
    
    // Employees can only view their own regularization requests
    if (req.user.role === "Employee") {
      if (!req.employee) {
        return res.json([]);
      }
      query = { employeeId: req.employee.id };
    }

    const requests = await RegularizationRequest.find(query).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error("Fetch regularizations error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @desc    Approve/Reject regularization request
// @route   PUT /api/attendance/regularizations/:id/status
// @access  Private (Manager or HR Admin)
router.put("/regularizations/:id/status", protect, authorize("Manager", "HR Admin"), async (req, res) => {
  const { status } = req.body; // "Approved" or "Rejected"

  if (!["Approved", "Rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  try {
    const request = await RegularizationRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Regularization request not found" });
    }

    request.status = status;
    await request.save();

    if (status === "Approved") {
      const checkInISO = reconstructISO(request.dateStr, request.checkIn);
      const checkOutISO = reconstructISO(request.dateStr, request.checkOut);
      const hoursStr = calculateHours(checkInISO, checkOutISO);

      // Determine status based on check-in time
      let attStatus = "Present";
      if (checkInISO) {
        const checkInDate = new Date(checkInISO);
        const limitTime = new Date(checkInDate);
        limitTime.setHours(9, 15, 0, 0);
        if (checkInDate > limitTime) {
          attStatus = "Late";
        }
      }

      // Upsert attendance record for that date
      await Attendance.findOneAndUpdate(
        { employeeId: request.employeeId, dateStr: request.dateStr },
        {
          $set: {
            checkIn: request.checkIn,
            checkOut: request.checkOut,
            hours: hoursStr,
            status: attStatus,
          },
        },
        { upsert: true, new: true }
      );
    }

    res.json(request);
  } catch (error) {
    console.error("Update regularization request error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
