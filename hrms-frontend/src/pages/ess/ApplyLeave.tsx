import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { useAuth } from "@/context/AuthContext";
import { useHrmsData } from "@/hooks/useHrmsData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog";
import { Calendar, FileText, CheckCircle, Clock } from "lucide-react";


// Form validation schema
const leaveSchema = zod
  .object({
    leaveType: zod.enum(["Casual Leave", "Sick Leave", "Annual Leave", "Loss of Pay"]),
    startDate: zod.string().min(1, "Start date is required"),
    endDate: zod.string().min(1, "End date is required"),
    reason: zod.string().min(1, "Reason is required").max(100, "Keep reason brief"),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return start <= end;
    },
    {
      message: "End date must be after or on start date",
      path: ["endDate"],
    }
  );

type LeaveFormValues = zod.infer<typeof leaveSchema>;

export function ApplyLeave() {
  const { user } = useAuth();
  const { employees, leaveRequests, applyLeave } = useHrmsData();

  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [lastSubmittedDetails, setLastSubmittedDetails] = useState<any>(null);

  if (!user) return null;

  // Find employee profile matching this user's email
  const empProfile = employees.find((e) => e.email.toLowerCase() === user.email.toLowerCase());
  const empId = empProfile?.id || "";

  const myLeaves = empId ? leaveRequests.filter((lr) => lr.employeeId === empId) : [];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      leaveType: "Casual Leave",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      reason: "",
    },
  });

  // Calculate number of leave days dynamically
  const watchStart = watch("startDate");
  const watchEnd = watch("endDate");

  const calculateDays = () => {
    if (!watchStart || !watchEnd) return 0;
    const start = new Date(watchStart);
    const end = new Date(watchEnd);
    if (start > end) return 0;
    const diff = Math.abs(end.getTime() - start.getTime());
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const onSubmit = async (data: LeaveFormValues) => {
    try {
      const leaveDays = calculateDays();
      await applyLeave(
        {
          leaveType: data.leaveType,
          startDate: data.startDate,
          endDate: data.endDate,
          days: leaveDays,
          reason: data.reason,
        },
        empId,
        user.name
      );

      setLastSubmittedDetails({
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        days: leaveDays,
        reason: data.reason,
      });

      reset();
      setIsSuccessOpen(true);
    } catch (err) {
      console.error("Apply leave submission failed:", err);
    }
  };

  // Mock leave counters
  const casualBalance = 6;
  const sickBalance = 6;
  const paidBalance = 18;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-heading font-extrabold tracking-tight m-0 text-foreground">
          Leave Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Apply for time off, view balances, and check status of leave applications.
        </p>
      </div>

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardContent className="pt-6">
            <span className="text-[10px] font-bold text-muted-foreground uppercase font-heading block">Casual Leaves</span>
            <span className="text-2xl font-bold font-heading mt-1 block">{casualBalance} Days</span>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="pt-6">
            <span className="text-[10px] font-bold text-muted-foreground uppercase font-heading block">Sick Leaves</span>
            <span className="text-2xl font-bold font-heading mt-1 block">{sickBalance} Days</span>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardContent className="pt-6">
            <span className="text-[10px] font-bold text-muted-foreground uppercase font-heading block">Annual Paid Leaves</span>
            <span className="text-2xl font-bold font-heading mt-1 block">{paidBalance} Days</span>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-sky-500 shadow-sm">
          <CardContent className="pt-6">
            <span className="text-[10px] font-bold text-muted-foreground uppercase font-heading block">Loss of Pay (LOP)</span>
            <span className="text-2xl font-bold font-heading mt-1 block">0 Days Used</span>
          </CardContent>
        </Card>
      </div>

      {/* Split grid: Application Form on Left, History Logs on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Leave application form */}
        <div className="lg:col-span-5">
          <Card className="shadow-sm h-full">
            <CardHeader>
              <CardTitle>Apply for Leave</CardTitle>
              <CardDescription>Register dates and category details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                
                <Select
                  label="Leave Category Type"
                  options={[
                    { value: "Casual Leave", label: "Casual Leave" },
                    { value: "Sick Leave", label: "Sick Leave" },
                    { value: "Annual Leave", label: "Annual Leave (Paid)" },
                    { value: "Loss of Pay", label: "Loss of Pay (Unpaid)" },
                  ]}
                  error={errors.leaveType?.message}
                  {...register("leaveType")}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Start Date"
                    type="date"
                    error={errors.startDate?.message}
                    {...register("startDate")}
                  />
                  <Input
                    label="End Date"
                    type="date"
                    error={errors.endDate?.message}
                    {...register("endDate")}
                  />
                </div>

                {/* Day calculation helper */}
                {calculateDays() > 0 && (
                  <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 flex items-center justify-between text-xs">
                    <span className="font-semibold text-primary">Total Calendar Days Calculated:</span>
                    <Badge variant="default" className="font-extrabold">{calculateDays()} Days</Badge>
                  </div>
                )}

                <Input
                  label="Reason / Remarks"
                  placeholder="e.g. Personal emergency, family function"
                  error={errors.reason?.message}
                  {...register("reason")}
                />

                <Button
                  type="submit"
                  className="w-full h-10 font-semibold rounded-lg flex items-center justify-center gap-1.5"
                  isLoading={isSubmitting}
                >
                  <Calendar className="h-4 w-4" /> Submit Leave Request
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Leave history logs */}
        <div className="lg:col-span-7">
          <Card className="shadow-sm h-full overflow-hidden">
            <CardHeader>
              <CardTitle>My Leave History</CardTitle>
              <CardDescription>Track status updates of time off requests</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {myLeaves.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground space-y-2.5">
                  <FileText className="h-9 w-9 text-muted-foreground/60 mx-auto" />
                  <p className="text-sm font-semibold">No Leave History Found</p>
                  <p className="text-xs">Any leave application you submit will appear here.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myLeaves.map((lr) => (
                      <TableRow key={lr._id || lr.id}>
                        <TableCell className="font-semibold">{lr.leaveType}</TableCell>
                        <TableCell className="text-xs">
                          <span className="block">{lr.startDate}</span>
                          <span className="text-muted-foreground">to {lr.endDate}</span>
                        </TableCell>
                        <TableCell className="font-bold text-center">{lr.days}</TableCell>
                        <TableCell className="text-xs text-muted-foreground truncate max-w-[120px]" title={lr.reason}>
                          {lr.reason}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            lr.status === "Approved" ? "success" :
                            lr.status === "Rejected" ? "destructive" : "warning"
                          } className="py-0 px-2 text-[9px] border-0">
                            {lr.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Success Dialog */}
      <Dialog isOpen={isSuccessOpen} onClose={() => setIsSuccessOpen(false)}>
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-4 animate-bounce">
            <CheckCircle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl font-bold font-heading">
            Leave Request Submitted
          </DialogTitle>
          <DialogDescription className="text-center text-sm mt-2">
            Your application for <span className="font-semibold text-foreground">{lastSubmittedDetails?.leaveType}</span> has been successfully registered in MongoDB.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-muted/40 p-4 rounded-xl border border-border/40 text-xs text-muted-foreground mt-4 space-y-2 font-sans">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-foreground">• Duration:</span>
            <span>{lastSubmittedDetails?.startDate} to {lastSubmittedDetails?.endDate} ({lastSubmittedDetails?.days} days)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-semibold text-foreground">• Status:</span>
            <Badge variant="warning" className="ml-1 border-0 py-0.5 px-2 text-[10px]">Pending Approval</Badge>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-semibold text-foreground">• Reason:</span>
            <span>{lastSubmittedDetails?.reason}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-semibold text-foreground">• Notice:</span>
            <span>Your manager (Marcus Sterling) and HR have been notified.</span>
          </div>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button onClick={() => setIsSuccessOpen(false)} className="w-full sm:w-auto px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
            Done
          </Button>
        </DialogFooter>
      </Dialog>

    </div>
  );
}
