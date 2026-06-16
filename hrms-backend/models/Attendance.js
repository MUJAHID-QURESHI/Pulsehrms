import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
    },
    dateStr: {
      type: String,
      required: true,
    },
    checkIn: {
      type: String,
      required: true,
    },
    checkOut: {
      type: String,
      required: true,
    },
    hours: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Present", "Late", "Leave", "Absent", "Weekend"],
      required: true,
    },
  },
  { timestamps: true }
);

// Compound index to ensure one attendance record per employee per day
attendanceSchema.index({ employeeId: 1, dateStr: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;
