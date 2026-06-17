import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { useHrmsData } from "@/hooks/useHrmsData";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { ArrowLeft, UserPlus, Save, ChevronDown, User } from "lucide-react";

// Schema for form validation using Zod
const employeeFormSchema = zod.object({
  name: zod.string().min(1, "Full name is required"),
  email: zod.string().min(1, "Email is required").email("Please enter a valid email address"),
  phone: zod.string().min(1, "Phone number is required"),
  role: zod.enum(["Employee", "Manager", "HR Admin"]),
  department: zod.string().min(1, "Department is required"),
  designation: zod.string().min(1, "Designation is required"),
  joiningDate: zod.string().min(1, "Joining date is required"),
  location: zod.string().min(1, "Location is required"),
  status: zod.enum(["Active", "Inactive"]),
  bankName: zod.string().optional(),
  accountNo: zod.string().optional(),
  ifscCode: zod.string().optional(),
  reportsTo: zod.string().optional(),
});

type EmployeeFormValues = zod.infer<typeof employeeFormSchema>;

export function EmployeeForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  
  const { employees, addEmployee, updateEmployee } = useHrmsData();
  const employee = employees.find((e) => e.id === id);

  // Build manager options (exclude self)
  const managerOptions = [
    { value: "", label: "No Manager (Reports to CEO / Top Leader)" },
    ...employees
      .filter((e) => e.id !== id)
      .map((e) => ({
        value: e.id,
        label: `${e.name} (${e.designation} - ${e.department})`,
      })),
  ];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "Employee",
      department: "",
      designation: "",
      joiningDate: new Date().toISOString().split("T")[0],
      location: "",
      status: "Active",
      bankName: "",
      accountNo: "",
      ifscCode: "",
      reportsTo: "",
    },
  });
  const [isManagerDropdownOpen, setIsManagerDropdownOpen] = useState(false);
  const currentManagerId = watch("reportsTo");
  const currentManager = employees.find((e) => e.id === currentManagerId);
  // Load employee data if editing
  useEffect(() => {
    if (isEditMode && employee) {
      reset({
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
        department: employee.department,
        designation: employee.designation,
        joiningDate: employee.joiningDate,
        location: employee.location,
        status: employee.status,
        bankName: employee.bankName || "",
        accountNo: employee.accountNo || "",
        ifscCode: employee.ifscCode || "",
        reportsTo: employee.reportsTo || "",
      });
    }
  }, [isEditMode, employee, reset]);

  const onSubmit = async (data: EmployeeFormValues) => {
    try {
      if (isEditMode && id) {
        await updateEmployee(id, data);
      } else {
        await addEmployee(data);
      }
      navigate("/employees");
    } catch (err) {
      console.error("Employee registration/update failed:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      
      {/* Header controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-9 p-0 rounded-full"
          onClick={() => navigate("/employees")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-extrabold tracking-tight m-0 text-foreground">
            {isEditMode ? "Edit Employee Records" : "Register New Employee"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isEditMode ? `Updating data for ${employee?.name || "Employee"}` : "Create a new personnel profile in the HR database"}
          </p>
        </div>
      </div>

      {/* Main form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Step 1: Personal & Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal & Contact Information</CardTitle>
            <CardDescription>Primary identification details</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="e.g. John Doe"
              error={errors.name?.message}
              {...register("name")}
            />
            <Input
              label="Work Email Address"
              type="email"
              placeholder="name@company.com"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Phone Number"
              placeholder="+1 (555) 000-0000"
              error={errors.phone?.message}
              {...register("phone")}
            />
            <Select
              label="Employment Status"
              value={isEditMode ? undefined : "Active"} // react hook form binds it
              error={errors.status?.message}
              options={[
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
              ]}
              {...register("status")}
            />
          </CardContent>
        </Card>

        {/* Step 2: Employment details */}
        <Card className="overflow-visible">
          <CardHeader>
            <CardTitle>Employment & Role Assignment</CardTitle>
            <CardDescription>Role, department, and work placement details</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Designation / Title"
              placeholder="e.g. Senior Software Engineer"
              error={errors.designation?.message}
              {...register("designation")}
            />
            <Input
              label="Department"
              placeholder="e.g. Engineering"
              error={errors.department?.message}
              {...register("department")}
            />
            <Select
              label="User Access Role"
              error={errors.role?.message}
              options={[
                { value: "Employee", label: "Employee" },
                { value: "Manager", label: "Manager" },
                { value: "HR Admin", label: "HR Admin" },
              ]}
              {...register("role")}
            />
            <Input
              label="Joining Date"
              type="date"
              error={errors.joiningDate?.message}
              {...register("joiningDate")}
            />
            <Input
              label="Work Location"
              placeholder="e.g. Chicago HQ or Remote"
              error={errors.location?.message}
              {...register("location")}
            />
            <div className="relative w-full flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground/80 font-heading">
                Reporting Manager
              </label>
              
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsManagerDropdownOpen(!isManagerDropdownOpen)}
                  className="flex h-14 w-full items-center justify-between rounded-lg border border-input bg-card px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150 cursor-pointer text-left"
                >
                  {currentManager ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={currentManager.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentManager.email}`}
                        alt={currentManager.name}
                        className="h-8 w-8 rounded-full border border-border object-cover"
                      />
                      <div>
                        <p className="font-semibold text-foreground text-xs leading-normal">{currentManager.name}</p>
                        <p className="text-[10px] text-muted-foreground leading-none">{currentManager.designation} ({currentManager.department})</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border border-border">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-xs leading-normal">No Manager</p>
                        <p className="text-[10px] text-muted-foreground leading-none">Reports directly to CEO / Top Leader</p>
                      </div>
                    </div>
                  )}
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                </button>

                {/* Dropdown Menu */}
                {isManagerDropdownOpen && (
                  <>
                    {/* Backdrop to close dropdown on click outside */}
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsManagerDropdownOpen(false)}
                    />
                    
                    <div className="absolute left-0 right-0 mt-1.5 max-h-60 overflow-y-auto rounded-lg border border-border/80 bg-card p-1 shadow-lg z-40 animate-fade-in scrollbar-thin">
                      
                      {/* Option: No Manager */}
                      <button
                        type="button"
                        onClick={() => {
                          setValue("reportsTo", "");
                          setIsManagerDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-xs rounded-md text-left transition-colors cursor-pointer hover:bg-muted/60 ${
                          !currentManagerId ? "bg-primary/10 text-primary font-semibold" : "text-foreground"
                        }`}
                      >
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border border-border">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-bold text-xs leading-normal">No Manager</p>
                          <p className="text-[9px] text-muted-foreground leading-none">Reports directly to CEO / Top Leader</p>
                        </div>
                      </button>

                      {/* Dynamic Options: Employees list */}
                      {employees
                        .filter((e) => e.id !== id) // Exclude self if editing
                        .map((emp) => (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => {
                              setValue("reportsTo", emp.id);
                              setIsManagerDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-xs rounded-md text-left mt-0.5 transition-colors cursor-pointer hover:bg-muted/60 ${
                              currentManagerId === emp.id ? "bg-primary/10 text-primary font-semibold" : "text-foreground"
                            }`}
                          >
                            <img
                              src={emp.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${emp.email}`}
                              alt={emp.name}
                              className="h-8 w-8 rounded-full border border-border object-cover"
                            />
                            <div>
                              <p className="font-bold text-xs leading-normal">{emp.name}</p>
                              <p className="text-[9px] text-muted-foreground leading-none">{emp.designation} — {emp.department}</p>
                            </div>
                          </button>
                        ))}
                    </div>
                  </>
                )}
              </div>
              
              <input type="hidden" {...register("reportsTo")} />
              {errors.reportsTo?.message && (
                <p className="text-xs text-destructive font-medium animate-fade-in">{errors.reportsTo.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Bank Details */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Details & Payment Information</CardTitle>
            <CardDescription>Details for automated payroll disbursements</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Bank Name"
              placeholder="e.g. Wells Fargo"
              error={errors.bankName?.message}
              {...register("bankName")}
            />
            <Input
              label="Account Number"
              placeholder="e.g. 1234567890"
              error={errors.accountNo?.message}
              {...register("accountNo")}
            />
            <Input
              label="IFSC / Routing Code"
              placeholder="e.g. WFLGUS66XX"
              error={errors.ifscCode?.message}
              {...register("ifscCode")}
            />
          </CardContent>
        </Card>

        {/* Action button bar */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/employees")}
            className="h-11 px-6 rounded-lg font-semibold border-border"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="h-11 px-6 rounded-lg font-semibold flex items-center gap-2"
            isLoading={isSubmitting}
          >
            {isEditMode ? (
              <>
                <Save className="h-4.5 w-4.5" />
                Save Changes
              </>
            ) : (
              <>
                <UserPlus className="h-4.5 w-4.5" />
                Register Employee
              </>
            )}
          </Button>
        </div>

      </form>
    </div>
  );
}
