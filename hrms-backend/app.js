import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "PulseHrmsSuperSecretKey123";

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));

// -------------------------------------------------------------
// DATABASE SCHEMAS & MODELS
// -------------------------------------------------------------

// User Model
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["Employee", "Manager", "HR Admin"], default: "Employee" },
    avatar: { type: String },
    department: { type: String },
    designation: { type: String },
  },
  { timestamps: true }
);

// Hash password before saving to DB
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Helper method to compare password in login
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

// Employee Model
const docSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  uploadedAt: { type: String, required: true },
  size: { type: String, required: true },
});

const timelineSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: String, required: true },
  type: {
    type: String,
    enum: ["joining", "promotion", "transfer", "award", "other"],
    default: "other",
  },
});

const employeeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, enum: ["Employee", "Manager", "HR Admin"], default: "Employee" },
    avatar: { type: String },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    joiningDate: { type: String, required: true },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    phone: { type: String, required: true },
    location: { type: String, required: true },
    bankName: { type: String },
    accountNo: { type: String },
    ifscCode: { type: String },
    documents: [docSchema],
    timeline: [timelineSchema],
  },
  { timestamps: true }
);

const Employee = mongoose.model("Employee", employeeSchema);

// Attendance Model
const attendanceSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    dateStr: { type: String, required: true },
    checkIn: { type: String, required: true },
    checkOut: { type: String, required: true },
    hours: { type: String, required: true },
    status: { type: String, enum: ["Present", "Late", "Leave", "Absent", "Weekend"], required: true },
  },
  { timestamps: true }
);
attendanceSchema.index({ employeeId: 1, dateStr: 1 }, { unique: true });
const Attendance = mongoose.model("Attendance", attendanceSchema);

// LeaveRequest Model
const leaveRequestSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    leaveType: { type: String, enum: ["Casual Leave", "Sick Leave", "Annual Leave", "Loss of Pay"], required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    days: { type: Number, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    appliedAt: { type: String, required: true },
  },
  { timestamps: true }
);
const LeaveRequest = mongoose.model("LeaveRequest", leaveRequestSchema);

// RegularizationRequest Model
const regularizationRequestSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    dateStr: { type: String, required: true },
    checkIn: { type: String, required: true },
    checkOut: { type: String, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  },
  { timestamps: true }
);
const RegularizationRequest = mongoose.model("RegularizationRequest", regularizationRequestSchema);

// Notification Model
const notificationSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    category: { type: String, enum: ["leave", "attendance", "system"], default: "system" },
    isRead: { type: Boolean, default: false },
    time: { type: String, required: true },
  },
  { timestamps: true }
);
const Notification = mongoose.model("Notification", notificationSchema);

// -------------------------------------------------------------
// MIDDLEWARE
// -------------------------------------------------------------

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        return res.status(401).json({ message: "Not authorized, user not found" });
      }
      const employee = await Employee.findOne({ email: req.user.email });
      if (employee) {
        req.employee = employee;
      }
      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role '${req.user?.role || "Guest"}' is not authorized to access this resource`,
      });
    }
    next();
  };
};

// -------------------------------------------------------------
// ROUTES / APIS
// -------------------------------------------------------------

// --- Auth Routes ---
const authRouter = express.Router();

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password))) {
      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "30d" });
      const employee = await Employee.findOne({ email: user.email });
      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          designation: user.designation,
          avatar: user.avatar,
        },
        employeeId: employee ? employee.id : null,
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

authRouter.get("/me", protect, async (req, res) => {
  try {
    res.json({
      user: req.user,
      employee: req.employee || null,
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// --- Employee Routes ---
const employeeRouter = express.Router();

employeeRouter.get("/", protect, async (req, res) => {
  try {
    const employees = await Employee.find({});
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

employeeRouter.get("/:id", protect, async (req, res) => {
  try {
    const employee = await Employee.findOne({ id: req.params.id });
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

employeeRouter.post("/", protect, authorize("HR Admin"), async (req, res) => {
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
    if (employeeExists) return res.status(400).json({ message: "Employee with this email already exists" });

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

    const user = new User({
      name,
      email,
      password: "password123",
      role: role || "Employee",
      department,
      designation,
      avatar: avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${email}`,
    });
    await user.save();

    res.status(201).json(savedEmployee);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

employeeRouter.put("/:id", protect, async (req, res) => {
  try {
    const employee = await Employee.findOne({ id: req.params.id });
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    if (
      req.user.role !== "HR Admin" &&
      req.user.role !== "Manager" &&
      req.user.email !== employee.email
    ) {
      return res.status(403).json({ message: "Not authorized to update this profile" });
    }

    const updatedData = { ...req.body };
    if (updatedData.designation && updatedData.designation !== employee.designation) {
      employee.timeline.push({
        title: "Title Changed",
        description: `Promoted/Transferred to ${updatedData.designation}`,
        date: new Date().toISOString().split("T")[0],
        type: "promotion",
      });
    }

    const updatedEmployee = await Employee.findOneAndUpdate(
      { id: req.params.id },
      { $set: updatedData, timeline: employee.timeline },
      { new: true, runValidators: true }
    );

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
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

employeeRouter.delete("/:id", protect, authorize("HR Admin"), async (req, res) => {
  try {
    const employee = await Employee.findOne({ id: req.params.id });
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    await User.findOneAndDelete({ email: employee.email });
    await Employee.findOneAndDelete({ id: req.params.id });
    res.json({ message: "Employee and associated user deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

employeeRouter.post("/:id/documents", protect, async (req, res) => {
  const { name, category, size } = req.body;
  try {
    const employee = await Employee.findOne({ id: req.params.id });
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    if (req.user.role !== "HR Admin" && req.user.email !== employee.email) {
      return res.status(403).json({ message: "Not authorized to upload files" });
    }

    const newDoc = { name, category, uploadedAt: new Date().toISOString().split("T")[0], size };
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
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

employeeRouter.delete("/:id/documents/:docId", protect, async (req, res) => {
  try {
    const employee = await Employee.findOne({ id: req.params.id });
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    if (req.user.role !== "HR Admin" && req.user.email !== employee.email) {
      return res.status(403).json({ message: "Not authorized to delete files" });
    }

    const doc = employee.documents.id(req.params.docId);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    employee.documents.pull(req.params.docId);
    employee.timeline.push({
      title: "Document Deleted",
      description: `Removed document: ${doc.name}`,
      date: new Date().toISOString().split("T")[0],
      type: "other",
    });

    await employee.save();
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// --- Leaves Routes ---
const leaveRouter = express.Router();

leaveRouter.get("/", protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "Employee") {
      if (!req.employee) return res.json([]);
      query = { employeeId: req.employee.id };
    }
    const leaves = await LeaveRequest.find(query).sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

leaveRouter.post("/", protect, async (req, res) => {
  const { leaveType, startDate, endDate, days, reason } = req.body;
  try {
    if (!req.employee) return res.status(400).json({ message: "No employee profile associated with this user" });

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

    // Create notifications for managers/HR
    const notif = new Notification({
      employeeId: "all",
      title: "New Leave Application",
      message: `${req.employee.name} applied for ${leaveType} (${days} days) starting ${startDate}`,
      category: "leave",
      time: "Just now"
    });
    await notif.save().catch(e => console.error("Notification save failed:", e));

    res.status(201).json(savedLeave);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

leaveRouter.put("/:id/status", protect, authorize("Manager", "HR Admin"), async (req, res) => {
  const { status } = req.body;
  if (!["Approved", "Rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }
  try {
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Leave request not found" });

    leave.status = status;
    await leave.save();

    // Create notifications for employee
    const notif = new Notification({
      employeeId: leave.employeeId,
      title: `Leave Request ${status}`,
      message: `Your request for ${leave.leaveType} has been ${status.toLowerCase()}`,
      category: "leave",
      time: "Just now"
    });
    await notif.save().catch(e => console.error("Notification save failed:", e));

    res.json(leave);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Helpers for Attendance
const getLocalDateString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const formatTime12h = (date) => {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${ampm}`;
};

const reconstructISO = (dateStr, timeStr) => {
  if (!timeStr || timeStr === "-- : --") return null;
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  
  const localDate = new Date();
  const [y, m, d] = dateStr.split("-").map(Number);
  localDate.setFullYear(y);
  localDate.setMonth(m - 1);
  localDate.setDate(d);
  localDate.setHours(hours, minutes, 0, 0);
  return localDate.toISOString();
};

const calculateHours = (startISO, endISO) => {
  const diffMs = new Date(endISO) - new Date(startISO);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
};

// --- Attendance Routes ---
const attendanceRouter = express.Router();

attendanceRouter.get("/", protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "Employee") {
      if (!req.employee) return res.json([]);
      query = { employeeId: req.employee.id };
    } else if (req.query.employeeId) {
      query = { employeeId: req.query.employeeId };
    }
    const logs = await Attendance.find(query).sort({ dateStr: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

attendanceRouter.get("/status", protect, async (req, res) => {
  try {
    if (!req.employee) return res.json({ isPunchedIn: false, punchTime: null });
    const activeSession = await Attendance.findOne({ employeeId: req.employee.id, checkOut: "-- : --" });
    if (activeSession) {
      res.json({ isPunchedIn: true, punchTime: reconstructISO(activeSession.dateStr, activeSession.checkIn) });
    } else {
      res.json({ isPunchedIn: false, punchTime: null });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

attendanceRouter.post("/punch", protect, async (req, res) => {
  try {
    if (!req.employee) return res.status(400).json({ message: "No employee profile linked to user" });
    const todayStr = getLocalDateString();
    const now = new Date();
    const timeStr = formatTime12h(now);

    let session = await Attendance.findOne({ employeeId: req.employee.id, checkOut: "-- : --" });
    if (!session) {
      const completedToday = await Attendance.findOne({ employeeId: req.employee.id, dateStr: todayStr });
      if (completedToday) return res.status(400).json({ message: "You have already completed your punch out shift for today." });

      let status = "Present";
      const limitTime = new Date();
      limitTime.setHours(9, 15, 0, 0);
      if (now > limitTime) status = "Late";

      session = new Attendance({
        employeeId: req.employee.id,
        dateStr: todayStr,
        checkIn: timeStr,
        checkOut: "-- : --",
        hours: "0h",
        status,
      });
      await session.save();

      // Create notification for employee
      const notif = new Notification({
        employeeId: req.employee.id,
        title: status === "Late" ? "Late Punch Recorded" : "Clock-in Successful",
        message: status === "Late" 
          ? `You clocked in late today at ${timeStr}. Shift starts before 9:15 AM.` 
          : `You successfully clocked in for today at ${timeStr}.`,
        category: "attendance",
        time: "Just now"
      });
      await notif.save().catch(e => console.error("Notification save failed:", e));

      res.json({ isPunchedIn: true, punchTime: now.toISOString(), attendance: session });
    } else {
      const hoursStr = calculateHours(reconstructISO(session.dateStr, session.checkIn), now.toISOString());
      session.checkOut = timeStr;
      session.hours = hoursStr;
      await session.save();

      // Create notification for employee
      const notif = new Notification({
        employeeId: req.employee.id,
        title: "Clock-out Successful",
        message: `Clocked out at ${timeStr}. Shift hours logged: ${hoursStr}.`,
        category: "attendance",
        time: "Just now"
      });
      await notif.save().catch(e => console.error("Notification save failed:", e));

      res.json({ isPunchedIn: false, punchTime: null, attendance: session });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

attendanceRouter.post("/regularize", protect, async (req, res) => {
  const { dateStr, checkIn, checkOut, reason } = req.body;
  try {
    if (!req.employee) return res.status(400).json({ message: "No employee profile linked to user" });
    const request = new RegularizationRequest({
      employeeId: req.employee.id,
      employeeName: req.employee.name,
      dateStr,
      checkIn,
      checkOut,
      reason,
      status: "Pending",
    });
    await request.save();

    // Create notification for managers/HR
    const notif = new Notification({
      employeeId: "all",
      title: "Regularization Requested",
      message: `${req.employee.name} requested shift regularization for ${dateStr}`,
      category: "attendance",
      time: "Just now"
    });
    await notif.save().catch(e => console.error("Notification save failed:", e));

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

attendanceRouter.get("/regularizations", protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "Employee") {
      if (!req.employee) return res.json([]);
      query = { employeeId: req.employee.id };
    }
    const requests = await RegularizationRequest.find(query).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

attendanceRouter.put("/regularizations/:id/status", protect, authorize("Manager", "HR Admin"), async (req, res) => {
  const { status } = req.body;
  if (!["Approved", "Rejected"].includes(status)) return res.status(400).json({ message: "Invalid status value" });

  try {
    const request = await RegularizationRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Regularization request not found" });

    request.status = status;
    await request.save();

    if (status === "Approved") {
      const checkInISO = reconstructISO(request.dateStr, request.checkIn);
      const checkOutISO = reconstructISO(request.dateStr, request.checkOut);
      const hoursStr = calculateHours(checkInISO, checkOutISO);

      let attStatus = "Present";
      if (checkInISO) {
        const checkInDate = new Date(checkInISO);
        const limitTime = new Date(checkInDate);
        limitTime.setHours(9, 15, 0, 0);
        if (checkInDate > limitTime) attStatus = "Late";
      }

      await Attendance.findOneAndUpdate(
        { employeeId: request.employeeId, dateStr: request.dateStr },
        { $set: { checkIn: request.checkIn, checkOut: request.checkOut, hours: hoursStr, status: attStatus } },
        { upsert: true, new: true }
      );
    }

    // Create notification for employee
    const notif = new Notification({
      employeeId: request.employeeId,
      title: `Regularization Request ${status}`,
      message: `Your regularization request for ${request.dateStr} was ${status.toLowerCase()}`,
      category: "attendance",
      time: "Just now"
    });
    await notif.save().catch(e => console.error("Notification save failed:", e));

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// --- Notifications Routes ---
const notificationRouter = express.Router();

notificationRouter.get("/", protect, async (req, res) => {
  try {
    if (!req.employee) return res.json([]);
    const notifications = await Notification.find({
      $or: [
        { employeeId: req.employee.id },
        { employeeId: "all" }
      ]
    }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

notificationRouter.put("/:id/read", protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    notification.isRead = true;
    await notification.save();
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

notificationRouter.put("/read-all", protect, async (req, res) => {
  try {
    if (!req.employee) return res.status(400).json({ message: "No employee profile linked to user" });
    await Notification.updateMany(
      {
        $or: [
          { employeeId: req.employee.id },
          { employeeId: "all" }
        ],
        isRead: false
      },
      { $set: { isRead: true } }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// --- AI Copilot Routes ---
const aiRouter = express.Router();

aiRouter.post("/chat", protect, async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ message: "Message query is required" });
  }

  try {
    const employees = await Employee.find({ status: "Active" }).select("id name email role department designation joiningDate location status");
    const activeLeaves = await LeaveRequest.find({ status: "Approved" });
    const attendanceLogs = await Attendance.find({});

    const totalHeadcount = employees.length;
    const departments = Array.from(new Set(employees.map(e => e.department)));
    const deptDistribution = departments.map(d => `${d}: ${employees.filter(e => e.department === d).length}`).join(", ");

    const todayStr = new Date().toISOString().split("T")[0];
    const leavesToday = activeLeaves.filter(l => todayStr >= l.startDate && todayStr <= l.endDate);
    const leavesList = leavesToday.map(l => `${l.employeeName} (${l.leaveType})`).join(", ") || "None";

    const clockedInToday = attendanceLogs.filter(a => a.dateStr === todayStr);
    const presentList = clockedInToday.map(a => {
      const emp = employees.find(e => e.id === a.employeeId);
      return emp ? emp.name : "Unknown";
    }).join(", ") || "None";

    const employeeSummaryList = employees.map(e => `- ${e.name} (${e.designation} in ${e.department}) - Location: ${e.location}, Joined: ${e.joiningDate}`).join("\n");

    const systemPrompt = `You are PulseHRMS AI Copilot, a helpful database-aware HR assistant.
You have direct, live access to the organization's database:
- Total headcount: ${totalHeadcount} employees
- Departments: ${deptDistribution}
- Employees currently on leave today: ${leavesList}
- Clocked-in today: ${presentList}
- Active employee directory:
${employeeSummaryList}

Answer the employee's query based on this database context. Keep answers concise, accurate, and professional. Avoid markdown blocks that are too long.

Operational Guidelines for User Queries:
1. If the user asks how to apply for leave (e.g. "how to apply leave", "how i can apply leave"), provide these exact steps:
   - Navigate to the **Apply Leave** page in the left sidebar under the "My Pulse" section.
   - Select your **Leave Type** (Casual, Sick, Annual Leave, or Loss of Pay).
   - Choose your **Start Date** and **End Date**, and input the total number of days.
   - Enter a brief **Reason** explaining your time-off request.
   - Click **Apply Leave**. Your manager will be notified instantly to review and approve it.
2. If the user mentions workload, stress, pressure, burnout, or emotional struggle (e.g. "workload", "stress", "stressed", "work load"), give them warm, supportive emotional comfort and offer these practical solutions:
   - **Prioritize Tasks**: Focus on the top 2-3 critical tasks first (urgent vs. important).
   - **Break it down**: Turn large tasks into small, manageable checklists.
   - **Talk to your manager**: Schedule a quick 1-on-1 with your manager (Marcus Sterling) to align on priorities and see if tasks can be deprioritized or delegated.
   - **Take breaks**: Step away for a 5-minute walk, stretch, or deep breathing. Protecting your mental health is a priority.
   - Direct them to Sarah Jenkins in HR for emotional support or wellness resources.`;

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    { text: systemPrompt },
                    { text: `User message: ${message}` }
                  ],
                },
              ],
            }),
          }
        );

        if (response.ok) {
          const responseData = await response.json();
          const aiResponseText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (aiResponseText) {
            return res.json({ reply: aiResponseText.trim() });
          }
        } else {
          const errorText = await response.text();
          console.error("Gemini API error details:", errorText);
        }
      } catch (e) {
        console.error("Error calling Gemini API:", e);
      }
    }

    // Fallback if API key is not present or failed
    const msgLower = message.toLowerCase();
    let reply = "";

    if (msgLower.includes("apply leave") || msgLower.includes("how to apply") || msgLower.includes("apply for leave") || msgLower.includes("take leave") || msgLower.includes("request leave") || msgLower.includes("how i can apply")) {
      reply = `To apply for leave in PulseHRMS, follow these simple steps:
1. Navigate to the **Apply Leave** page in the left sidebar under the "My Pulse" section.
2. Select your **Leave Type** (Casual, Sick, Annual Leave, or Loss of Pay).
3. Choose your **Start Date** and **End Date**, and input the total number of days.
4. Enter a brief **Reason** explaining your time-off request.
5. Click **Apply Leave**. Your manager will be notified instantly to review and approve it.`;
    } else if (msgLower.includes("workload") || msgLower.includes("work load") || msgLower.includes("stress") || msgLower.includes("solve") || msgLower.includes("pressure") || msgLower.includes("exhausted") || msgLower.includes("tension") || msgLower.includes("burnout")) {
      reply = `It sounds like you are carrying a lot right now. Managing a heavy workload can be really stressful, but please know you're not alone. Here are a few ways to help manage it:

1. **Prioritize Tasks**: Focus on the top 2-3 critical tasks first. Use the Eisenhower Matrix (urgent vs. important).
2. **Break it down**: Turn large tasks into small, manageable checklists.
3. **Talk to your manager**: Schedule a quick 1-on-1 with your manager (Marcus Sterling) to align on priorities and see if tasks can be deprioritized or delegated.
4. **Take breaks**: Step away for a 5-minute walk, stretch, or deep breathing. Protecting your mental health is a priority.

Remember, we are here to support you! Don't hesitate to reach out to Sarah Jenkins in HR for emotional support or wellness resources.`;
    } else if (msgLower.includes("headcount") || msgLower.includes("how many employees") || msgLower.includes("total staff") || msgLower.includes("total employee")) {
      reply = `PulseHRMS currently has a total headcount of **${totalHeadcount}** active employees. Here is the department breakdown: ${deptDistribution}.`;
    } else if (msgLower.includes("leave") || msgLower.includes("absent") || msgLower.includes("who is on leave") || msgLower.includes("time off")) {
      reply = `Today there are **${leavesToday.length}** employees on leave: ${leavesList}.`;
    } else if (msgLower.includes("present") || msgLower.includes("clocked") || msgLower.includes("who is in") || msgLower.includes("attendance")) {
      reply = `Today we have **${clockedInToday.length}** employees clocked in: ${presentList}.`;
    } else if (msgLower.includes("department") || msgLower.includes("engineering") || msgLower.includes("hr") || msgLower.includes("resources")) {
      let deptQuery = "";
      if (msgLower.includes("engineering")) deptQuery = "Engineering";
      else if (msgLower.includes("human") || msgLower.includes("hr")) deptQuery = "Human Resources";

      if (deptQuery) {
        const deptEmps = employees.filter(e => e.department.toLowerCase().includes(deptQuery.toLowerCase()));
        const deptNames = deptEmps.map(e => `${e.name} (${e.designation})`).join(", ");
        reply = `There are **${deptEmps.length}** employees in the **${deptQuery}** department: ${deptNames}.`;
      } else {
        reply = `We have the following departments active: ${deptDistribution}.`;
      }
    } else if (msgLower.includes("where") || msgLower.includes("location") || msgLower.includes("remote")) {
      const remoteCount = employees.filter(e => e.location.toLowerCase() === "remote").length;
      const hqCount = employees.filter(e => e.location.toLowerCase().includes("hq") || e.location.toLowerCase().includes("chicago")).length;
      reply = `Our team is distributed as follows: **${remoteCount}** Remote, and **${hqCount}** working from Chicago HQ.`;
    } else if (msgLower.includes("who is") || msgLower.includes("tell me about") || msgLower.includes("role of")) {
      const matched = employees.find(e => msgLower.includes(e.name.toLowerCase()) || msgLower.includes(e.name.split(" ")[0].toLowerCase()));
      if (matched) {
        reply = `**${matched.name}** works as a **${matched.designation}** in the **${matched.department}** department. Location: ${matched.location}, Joined: ${matched.joiningDate}.`;
      } else {
        reply = `I couldn't find a specific employee matching that name. Let me know if you meant Sarah, Marcus, or David.`;
      }
    } else {
      reply = `Hello! I am your PulseHRMS AI Assistant. I can help you query database metrics. Try asking:
- "What is the total headcount?"
- "Who is on leave today?"
- "Who has clocked in today?"
- "List employees in the Engineering department."
- "Tell me about David Vance."`;
    }

    return res.json({ reply });

  } catch (error) {
    console.error("AI Chatbot endpoint error:", error);
    res.status(500).json({ message: "Failed to process chat query", error: error.message });
  }
});

// Mount routers
app.use("/api/auth", authRouter);
app.use("/api/employees", employeeRouter);
app.use("/api/leaves", leaveRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/ai", aiRouter);

// -------------------------------------------------------------
// DATABASE INITIALIZATION & SEED FUNCTION
// -------------------------------------------------------------

const SEED_USERS = [
  {
    name: "Sarah Jenkins",
    email: "admin@company.com",
    password: "password123",
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

const autoSeedDB = async () => {
  try {
    const userCount = await User.countDocuments({});
    if (userCount === 0) {
      console.log("No users found in database. Running auto-seeding routine...");
      await Employee.deleteMany({});
      await LeaveRequest.deleteMany({});
      await Attendance.deleteMany({});
      await RegularizationRequest.deleteMany({});

      for (const u of SEED_USERS) {
        await new User(u).save();
      }
      await Employee.insertMany(SEED_EMPLOYEES);
      console.log("Auto-seeding completed successfully!");
    } else {
      console.log("Database already initialized. Skipping auto-seed.");
    }
  } catch (error) {
    console.error("Auto-seeding error:", error);
  }
};

// Expose system manual reseed route
app.post("/api/system/reseed", protect, authorize("HR Admin"), async (req, res) => {
  try {
    await User.deleteMany({});
    await Employee.deleteMany({});
    await LeaveRequest.deleteMany({});
    await Attendance.deleteMany({});
    await RegularizationRequest.deleteMany({});

    for (const u of SEED_USERS) {
      await new User(u).save();
    }
    await Employee.insertMany(SEED_EMPLOYEES);
    res.json({ message: "Database reset & clean seeded successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Reset failed", error: error.message });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date() });
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "An internal server error occurred.", error: err.message });
});

// Serve Static Frontend Assets in Production
if (process.env.NODE_ENV === "production") {
  // Serve frontend build folder
  app.use(express.static(path.join(__dirname, "../hrms-frontend/dist")));
  
  // Handle SPA routing - send index.html for any non-API routes
  app.get("*", (req, res, next) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(__dirname, "../hrms-frontend/dist/index.html"));
    } else {
      next();
    }
  });
}

// Database Connection & Server Listener
let mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/pulse-hrms";
if (mongoUri.includes("****") || mongoUri.includes("<password>")) {
  console.log("Remote MONGO_URI contains a placeholder password. Falling back to local MongoDB.");
  mongoUri = "mongodb://localhost:27017/pulse-hrms";
}

mongoose
  .connect(mongoUri)
  .then(async () => {
    console.log("Connected to MongoDB successfully at:", mongoUri);
    await autoSeedDB();

    app.listen(PORT, () => {
      console.log(`PulseHRMS Unified Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err);
    process.exit(1);
  });
