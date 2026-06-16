import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true }, // employee ID (e.g. EMP-001) or "all" for global broadcast
    title: { type: String, required: true },
    message: { type: String, required: true },
    category: { type: String, enum: ["leave", "attendance", "system"], default: "system" },
    isRead: { type: Boolean, default: false },
    time: { type: String, required: true }, // e.g. "Just now", "2 hours ago" or readable date string
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
