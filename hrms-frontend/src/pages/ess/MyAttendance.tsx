import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog";
import { Calendar as CalendarIcon, Clock, AlertTriangle, CheckCircle, HelpCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/utils/api";
import type { Attendance } from "@/types";

// Generate mock attendance days for June 2026
const DAYS_IN_JUNE = 30;
const MOCK_ATTENDANCE_LOGS = Array.from({ length: DAYS_IN_JUNE }, (_, idx) => {
  const day = idx + 1;
  const dateStr = `2026-06-${String(day).padStart(2, "0")}`;
  const dayOfWeek = new Date(dateStr).getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Default status
  let status: "Present" | "Late" | "Leave" | "Absent" | "Weekend" = "Absent";
  let checkIn = "-- : --";
  let checkOut = "-- : --";
  let hours = "0h";

  if (isWeekend) {
    status = "Weekend";
  }

  return { day, dateStr, isWeekend, status, checkIn, checkOut, hours };
});

export function MyAttendance() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [isRegOpen, setIsRegOpen] = useState(false);
  
  // Regularization Form State
  const [regDate, setRegDate] = useState("2026-06-09");
  const [regCheckIn, setRegCheckIn] = useState("09:00 AM");
  const [regCheckOut, setRegCheckOut] = useState("06:00 PM");
  const [regReason, setRegReason] = useState("");

  const fetchLogs = async () => {
    try {
      const dbLogs = await api.get<Attendance[]>("/attendance");
      
      // Merge with MOCK_ATTENDANCE_LOGS
      const merged = MOCK_ATTENDANCE_LOGS.map((dayLog) => {
        const match = dbLogs.find(l => l.dateStr === dayLog.dateStr);
        if (match) {
          return {
            ...dayLog,
            status: match.status,
            checkIn: match.checkIn,
            checkOut: match.checkOut,
            hours: match.hours,
          };
        }
        return dayLog;
      });
      setLogs(merged);
    } catch (err) {
      console.error("Error fetching attendance logs:", err);
      setLogs(MOCK_ATTENDANCE_LOGS);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleRegularizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regReason.trim()) return;

    try {
      await api.post("/attendance/regularize", {
        dateStr: regDate,
        checkIn: regCheckIn,
        checkOut: regCheckOut,
        reason: regReason,
      });
      alert(`Regularization request submitted to your manager for Date: ${regDate}.`);
      setIsRegOpen(false);
      setRegReason("");
      fetchLogs();
    } catch (err) {
      console.error("Error submitting regularization:", err);
      alert("Failed to submit regularization request.");
    }
  };

  // Calculations for summary card
  const activeDays = logs.filter(l => !l.isWeekend && l.day <= 11);
  const presentCount = activeDays.filter(d => d.status === "Present" || d.status === "Late").length;
  const onTimeCount = activeDays.filter(d => d.status === "Present").length;
  const onTimeRate = activeDays.length ? Math.round((onTimeCount / activeDays.length) * 100) : 100;
  const attendanceRate = activeDays.length ? Math.round((presentCount / activeDays.length) * 100) : 100;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight m-0 text-foreground">
            My Attendance logs
          </h1>
          <p className="text-sm text-muted-foreground">
            Review monthly time clock stamps, shifts, and regularization corrections.
          </p>
        </div>
        <Button
          onClick={() => setIsRegOpen(true)}
          className="flex items-center gap-2 h-10 px-4 rounded-lg font-semibold"
        >
          <HelpCircle className="h-4.5 w-4.5" />
          Regularize Attendance
        </Button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardContent className="pt-6">
            <span className="text-[10px] font-bold text-muted-foreground uppercase font-heading block">Monthly Attendance Rate</span>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-2xl font-bold font-heading">{attendanceRate}%</span>
              <Badge variant="success" className="text-[9px] py-0 px-1">{presentCount} / {activeDays.length} Active Days</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="pt-6">
            <span className="text-[10px] font-bold text-muted-foreground uppercase font-heading block">On-Time Punch Ratio</span>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-2xl font-bold font-heading">{onTimeRate}%</span>
              <span className="text-xs text-muted-foreground">{onTimeCount} Days On-Time</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardContent className="pt-6">
            <span className="text-[10px] font-bold text-muted-foreground uppercase font-heading block">Active Shifts</span>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-2xl font-bold font-heading">General Shift</span>
              <span className="text-xs text-muted-foreground">09:00 AM - 06:00 PM</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Calendar Grid */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Attendance Log Calendar - June 2026</CardTitle>
          <CardDescription>Visual tracker of clockings across the current month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {logs.map((dayLog) => {
              const isP = dayLog.status === "Present";
              const isL = dayLog.status === "Late";
              const isLv = dayLog.status === "Leave";
              const isW = dayLog.status === "Weekend";
              
              return (
                <div
                  key={dayLog.day}
                  className={`p-3 border rounded-xl flex flex-col justify-between min-h-[92px] transition-all hover:shadow-sm ${
                    isP ? "bg-emerald-500/5 border-emerald-500/10" :
                    isL ? "bg-amber-500/5 border-amber-500/15" :
                    isLv ? "bg-sky-500/5 border-sky-500/10" :
                    isW ? "bg-muted/20 border-border/40 text-muted-foreground/60" :
                    "bg-destructive/5 border-destructive/10 text-muted-foreground"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold font-heading">{dayLog.day}</span>
                    <Badge variant={
                      isP ? "success" :
                      isL ? "warning" :
                      isLv ? "info" :
                      isW ? "outline" : "destructive"
                    } className="text-[8px] py-0 px-1 border-0 leading-tight">
                      {dayLog.status}
                    </Badge>
                  </div>

                  <div className="mt-3 text-[10px] space-y-0.5">
                    <div className="flex items-center gap-1 font-mono text-foreground/80">
                      <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
                      <span>{dayLog.checkIn}</span>
                    </div>
                    {dayLog.status !== "Weekend" && dayLog.status !== "Leave" && dayLog.status !== "Absent" && (
                      <div className="text-muted-foreground">Hours: <span className="font-semibold text-foreground/90 font-mono">{dayLog.hours}</span></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Regularization Dialog */}
      <Dialog isOpen={isRegOpen} onClose={() => setIsRegOpen(false)}>
        <DialogHeader>
          <DialogTitle>Attendance Regularization Request</DialogTitle>
          <DialogDescription>Submit adjustments for missing punch-in or punch-out events</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleRegularizeSubmit} className="space-y-4 mt-4">
          <Input
            label="Correction Date"
            type="date"
            value={regDate}
            onChange={(e) => setRegDate(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Corrected Punch-In"
              placeholder="e.g. 09:00 AM"
              value={regCheckIn}
              onChange={(e) => setRegCheckIn(e.target.value)}
              required
            />
            <Input
              label="Corrected Punch-Out"
              placeholder="e.g. 06:00 PM"
              value={regCheckOut}
              onChange={(e) => setRegCheckOut(e.target.value)}
              required
            />
          </div>
          <Input
            label="Reason for Regularization"
            placeholder="e.g. Biometric device issue, client meeting"
            value={regReason}
            onChange={(e) => setRegReason(e.target.value)}
            required
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsRegOpen(false)}>Cancel</Button>
            <Button type="submit">Submit Correction</Button>
          </DialogFooter>
        </form>
      </Dialog>

    </div>
  );
}
