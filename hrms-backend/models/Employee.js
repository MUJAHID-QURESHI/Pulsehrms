import mongoose from "mongoose";

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
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["Employee", "Manager", "HR Admin"],
      default: "Employee",
    },
    avatar: {
      type: String,
    },
    department: {
      type: String,
      required: true,
    },
    designation: {
      type: String,
      required: true,
    },
    joiningDate: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    phone: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    bankName: {
      type: String,
    },
    accountNo: {
      type: String,
    },
    ifscCode: {
      type: String,
    },
    reportsTo: {
      type: String,
      default: "",
    },
    documents: [docSchema],
    timeline: [timelineSchema],
  },
  { timestamps: true }
);

const Employee = mongoose.model("Employee", employeeSchema);
export default Employee;
