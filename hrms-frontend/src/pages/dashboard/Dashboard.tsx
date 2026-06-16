import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/utils/api";
import { useHrmsData } from "@/hooks/useHrmsData";
import type { Attendance, LeaveRequest, RegularizationRequest } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog";
import {
  Users,
  UserCheck,
  Plane,
  FileCheck,
  Clock,
  Briefcase,
  TrendingUp,
  MapPin,
  Calendar,
  AlertCircle,
  Play,
  Square,
  ArrowRight,
  TrendingDown,
  ChevronRight,
  User,
  FileText
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { cn } from "@/utils/cn";

// Colors for Pie/Donut Chart
const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#3b82f6", "#ec4899"];

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { employees, leaveRequests } = useHrmsData();
  const [isPunchIn, setIsPunchIn] = useState(false);
  const [punchTime, setPunchTime] = useState<string | null>(null);
  const [workHours, setWorkHours] = useState("00:00:00");
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<Attendance[]>([]);

  // Calculate dynamic stats
  const todayStr = new Date().toISOString().split("T")[0];

  const totalHeadcount = employees.length;
  const pendingApprovalsCount = pendingApprovals.length;
  
  const activeLeavesCount = leaveRequests.filter(
    (l) => l.status === "Approved" && todayStr >= l.startDate && todayStr <= l.endDate
  ).length;

  // Department distribution for PieChart
  const deptSummary = Array.from(new Set(employees.map((e) => e.department)));
  const deptDistribution = deptSummary.map((dept) => {
    const count = employees.filter((e) => e.department === dept).length;
    return { name: dept, value: count };
  });

  // Leave stats for BarChart
  const leaveStats = [
    { name: "Casual", Count: leaveRequests.filter(l => l.leaveType === "Casual Leave" && l.status === "Approved").reduce((sum, l) => sum + l.days, 0) },
    { name: "Sick", Count: leaveRequests.filter(l => l.leaveType === "Sick Leave" && l.status === "Approved").reduce((sum, l) => sum + l.days, 0) },
    { name: "Annual", Count: leaveRequests.filter(l => l.leaveType === "Annual Leave" && l.status === "Approved").reduce((sum, l) => sum + l.days, 0) },
    { name: "Loss of Pay", Count: leaveRequests.filter(l => l.leaveType === "Loss of Pay" && l.status === "Approved").reduce((sum, l) => sum + l.days, 0) },
  ];

  // Team members list for Manager view
  const teamMembers = employees
    .filter((e) => e.department === user?.department && e.email !== user?.email)
    .map((emp) => {
      const isOnLeave = leaveRequests.some(
        (l) => l.employeeId === emp.id && l.status === "Approved" && todayStr >= l.startDate && todayStr <= l.endDate
      );
      return {
        name: emp.name,
        role: emp.designation,
        status: isOnLeave ? "On Leave" : "Absent",
        time: isOnLeave ? "Time off" : "--:--",
        avatar: emp.avatar,
      };
    });

  // Generate last 7 days trends dynamically
  const getAttendanceTrends = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const trends = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const loopDateStr = d.toISOString().split("T")[0];
      const dayName = days[d.getDay()];

      const dayLogs = attendanceLogs.filter(l => l.dateStr === loopDateStr);
      const present = dayLogs.filter(l => l.status === "Present").length;
      const late = dayLogs.filter(l => l.status === "Late").length;

      const pctPresent = totalHeadcount ? Math.round((present / totalHeadcount) * 100) : 0;
      const pctLate = totalHeadcount ? Math.round((late / totalHeadcount) * 100) : 0;

      trends.push({
        day: dayName,
        // If there's no actual check-in data in DB, return 0 instead of hardcoded mock numbers
        Present: pctPresent,
        Late: pctLate,
      });
    }
    return trends;
  };

  const attendanceTrends = getAttendanceTrends();

  // Dynamically compute leaves active today
  const leavesToday = leaveRequests.filter(req => 
    req.status === "Approved" && todayStr >= req.startDate && todayStr <= req.endDate
  );
  
  const activeLeavesList = leavesToday.map(req => {
    const emp = employees.find(e => e.id === req.employeeId);
    return {
      name: req.employeeName,
      dept: emp ? emp.department : "Organization",
      type: req.leaveType,
      duration: req.startDate === req.endDate ? req.startDate : `${req.startDate} - ${req.endDate}`
    };
  });

  if (!user) return null;

  const fetchPunchStatus = async () => {
    try {
      const data = await api.get<{ isPunchedIn: boolean; punchTime: string | null }>("/attendance/status");
      setIsPunchIn(data.isPunchedIn);
      setPunchTime(data.punchTime);
    } catch (err) {
      console.error("Error fetching punch status:", err);
    }
  };

  const fetchAttendanceLogs = async () => {
    try {
      const logs = await api.get<Attendance[]>("/attendance");
      setAttendanceLogs(logs);
    } catch (err) {
      console.error("Error fetching attendance logs:", err);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const [leaves, regularizations] = await Promise.all([
        api.get<LeaveRequest[]>("/leaves"),
        api.get<RegularizationRequest[]>("/attendance/regularizations"),
      ]);

      const pendingLeaves = leaves
        .filter(l => l.status === "Pending")
        .map(l => ({
          id: l._id || l.id,
          requester: l.employeeName,
          type: "Leave Request",
          details: `${l.leaveType} (${l.days} days)`,
          date: `${l.startDate} - ${l.endDate}`,
          isLeave: true,
        }));

      const pendingRegs = regularizations
        .filter(r => r.status === "Pending")
        .map(r => ({
          id: r._id,
          requester: r.employeeName,
          type: "Attendance Regularization",
          details: r.reason,
          date: r.dateStr,
          isLeave: false,
        }));

      setPendingApprovals([...pendingLeaves, ...pendingRegs]);
    } catch (err) {
      console.error("Error fetching pending approvals:", err);
    }
  };

  // Load status on mount
  useEffect(() => {
    fetchPunchStatus();
    fetchAttendanceLogs();
    if (user.role === "Manager" || user.role === "HR Admin") {
      fetchPendingApprovals();
    }
  }, [user]);

  // Update timer clock when punched in
  useEffect(() => {
    if (isPunchIn && punchTime) {
      const interval = setInterval(() => {
        const punchDate = new Date(punchTime);
        const diff = Math.abs(new Date().getTime() - punchDate.getTime());
        const hrs = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        
        const pad = (num: number) => num.toString().padStart(2, "0");
        setWorkHours(`${pad(hrs)}:${pad(mins)}:${pad(secs)}`);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setWorkHours("00:00:00");
    }
  }, [isPunchIn, punchTime]);

  const handlePunchToggle = async () => {
    try {
      const data = await api.post<{ isPunchedIn: boolean; punchTime: string | null }>("/attendance/punch");
      setIsPunchIn(data.isPunchedIn);
      setPunchTime(data.punchTime);
      fetchAttendanceLogs();
    } catch (err) {
      console.error("Error in punch toggle:", err);
      alert("Failed to toggle punch session.");
    }
  };

  const handleApprove = async (id: string, isLeave: boolean) => {
    try {
      if (isLeave) {
        await api.put(`/leaves/${id}/status`, { status: "Approved" });
      } else {
        await api.put(`/attendance/regularizations/${id}/status`, { status: "Approved" });
      }
      fetchPendingApprovals();
    } catch (err) {
      console.error("Error approving request:", err);
      alert("Failed to approve request.");
    }
  };

  const handleReject = async (id: string, isLeave: boolean) => {
    try {
      if (isLeave) {
        await api.put(`/leaves/${id}/status`, { status: "Rejected" });
      } else {
        await api.put(`/attendance/regularizations/${id}/status`, { status: "Rejected" });
      }
      fetchPendingApprovals();
    } catch (err) {
      console.error("Error rejecting request:", err);
      alert("Failed to reject request.");
    }
  };

  // Determine user greeting text
  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return `Good Morning, ${user?.name}`;
    if (hrs < 17) return `Good Afternoon, ${user?.name}`;
    return `Good Evening, ${user?.name}`;
  };

  // Render Admin / Leadership Dashboard
  const renderAdminDashboard = () => (
    <div className="space-y-6 animate-fade-in">
      
      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          className="border-l-4 border-l-primary hover:translate-y-[-2px] hover:border-primary/60 transition-all cursor-pointer shadow-sm hover:shadow-md"
          onClick={() => navigate("/employees")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-heading">
                  Total Headcount
                </p>
                <h3 className="text-2xl font-bold font-heading">{totalHeadcount}</h3>
                <span className="flex items-center text-xs text-emerald-600 font-semibold gap-1">
                  <TrendingUp className="h-3 w-3" /> Active Employees
                </span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-l-4 border-l-emerald-500 hover:translate-y-[-2px] hover:border-emerald-500/60 transition-all cursor-pointer shadow-sm hover:shadow-md"
          onClick={() => navigate("/team")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-heading">
                  Present Today
                </p>
                <h3 className="text-2xl font-bold font-heading">{totalHeadcount ? "100%" : "0%"}</h3>
                <span className="flex items-center text-xs text-emerald-600 font-semibold gap-1">
                  <TrendingUp className="h-3 w-3" /> Clocked In
                </span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <UserCheck className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 hover:translate-y-[-2px] transition-all">
          <CardContent className="pt-6 cursor-pointer" onClick={() => setIsLeaveModalOpen(true)}>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-heading">
                  Employees on Leave
                </p>
                <h3 className="text-2xl font-bold font-heading">{activeLeavesCount}</h3>
                <span className="text-xs text-muted-foreground font-medium underline">
                  Click to view active list
                </span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Plane className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-l-4 border-l-sky-500 hover:translate-y-[-2px] hover:border-sky-500/60 transition-all cursor-pointer shadow-sm hover:shadow-md"
          onClick={() => navigate("/approvals")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-heading">
                  Pending Approvals
                </p>
                <h3 className="text-2xl font-bold font-heading">{pendingApprovalsCount}</h3>
                <span className="flex items-center text-xs text-amber-500 font-semibold gap-1">
                  <AlertCircle className="h-3 w-3" /> Needs action
                </span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
                <FileCheck className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Attendance trends area chart */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily Attendance Compliance Trends</CardTitle>
            <CardDescription>Visual stats showing present rate vs tardiness across the current week</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrends}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
                <XAxis dataKey="day" className="text-xs text-muted-foreground font-medium" tickLine={false} />
                <YAxis className="text-xs text-muted-foreground font-medium" tickLine={false} />
                <RechartsTooltip />
                <Area type="monotone" dataKey="Present" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorPresent)" name="Present %" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Headcount Department donut chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Department Headcounts</CardTitle>
            <CardDescription>Current active workforce deployment percentage</CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex flex-col items-center justify-center">
            <div className="h-56 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deptDistribution}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {deptDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => [`${value} Members`, "Count"]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold font-heading">{totalHeadcount}</span>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">Total FTEs</span>
              </div>
            </div>
            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full text-[10px] px-2 font-medium">
              {deptDistribution.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5 truncate">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="truncate">{entry.name} ({entry.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave statistics bar chart */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Types Consumption Metrics</CardTitle>
          <CardDescription>Number of total leave days taken by staff this month by category</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={leaveStats}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
              <XAxis dataKey="name" className="text-xs text-muted-foreground font-medium" tickLine={false} />
              <YAxis className="text-xs text-muted-foreground font-medium" tickLine={false} />
              <RechartsTooltip />
              <Bar dataKey="Count" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} name="Leave Days" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

    </div>
  );

  // Render Manager Dashboard
  const renderManagerDashboard = () => (
    <div className="space-y-6 animate-fade-in">
      
      {/* Team Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          className="border-l-4 border-l-primary hover:translate-y-[-2px] hover:border-primary/60 transition-all cursor-pointer shadow-sm hover:shadow-md"
          onClick={() => navigate("/team")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-heading">
                  My Team Members
                </p>
                <h3 className="text-2xl font-bold font-heading">{teamMembers.length} Employees</h3>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-l-4 border-l-emerald-500 hover:translate-y-[-2px] hover:border-emerald-500/60 transition-all cursor-pointer shadow-sm hover:shadow-md"
          onClick={() => navigate("/team")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-heading">
                  Punched In Today
                </p>
                <h3 className="text-2xl font-bold font-heading">
                  {teamMembers.filter(t => t.status === "Present" || t.status === "Late").length} / {teamMembers.length}
                </h3>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <UserCheck className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-l-4 border-l-amber-500 hover:translate-y-[-2px] hover:border-amber-500/60 transition-all cursor-pointer shadow-sm hover:shadow-md"
          onClick={() => setIsLeaveModalOpen(true)}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-heading">
                  Active Leaves Today
                </p>
                <h3 className="text-2xl font-bold font-heading">
                  {teamMembers.filter(t => t.status === "On Leave").length} Employees
                </h3>
                <span className="text-xs text-muted-foreground font-medium underline">
                  Click to view active list
                </span>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Plane className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-l-4 border-l-sky-500 hover:translate-y-[-2px] hover:border-sky-500/60 transition-all cursor-pointer shadow-sm hover:shadow-md"
          onClick={() => navigate("/approvals")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-heading">
                  Pending Team Approvals
                </p>
                <h3 className="text-2xl font-bold font-heading">{pendingApprovals.length} Requests</h3>
              </div>
              <div className="h-10 w-10 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center">
                <FileCheck className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid of Team Leaves & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pending Approval List Widget */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Team Requests Pending Approval</CardTitle>
              <CardDescription>Items that require your immediate review</CardDescription>
            </div>
            {pendingApprovals.length > 0 && (
              <Badge variant="warning">{pendingApprovals.length} Pending</Badge>
            )}
          </CardHeader>
          <CardContent>
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                <p className="text-sm font-semibold">All caught up!</p>
                <p className="text-xs text-muted-foreground">No pending leave or attendance requests.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingApprovals.map((app) => (
                  <div key={app.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border border-border/60 bg-muted/20 gap-3 hover:bg-muted/40 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{app.requester}</span>
                        <Badge variant="secondary" className="text-[10px] font-medium">{app.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {app.details} • <span className="font-semibold text-foreground/80">{app.date}</span>
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => handleReject(app.id, app.isLeave)} className="h-8.5 text-xs text-destructive hover:bg-destructive/5 border-destructive/20 hover:border-destructive">
                        Reject
                      </Button>
                      <Button size="sm" onClick={() => handleApprove(app.id, app.isLeave)} className="h-8.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-sm">
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Attendance Board */}
        <Card>
          <CardHeader>
            <CardTitle>Team Status Today</CardTitle>
            <CardDescription>Real-time clock-in updates of your direct reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/40">
              {teamMembers.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No reports in your department.</p>
              ) : (
                teamMembers.map((member) => (
                  <div key={member.name} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <img src={member.avatar} alt={member.name} className="h-9 w-9 rounded-full object-cover" />
                      <div>
                        <h4 className="text-sm font-semibold text-foreground leading-none">{member.name}</h4>
                        <span className="text-xs text-muted-foreground mt-1 block">{member.role}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        member.status === "Present" ? "success" :
                        member.status === "Late" ? "warning" : "destructive"
                      }>
                        {member.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground block mt-1 font-medium">{member.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );

  // Render Employee Dashboard
  const renderEmployeeDashboard = () => (
    <div className="space-y-6 animate-fade-in">
      
      {/* Employee Top Grid: Leave Balances & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Leave Balance summary */}
        <Card className="col-span-1 border-l-4 border-l-amber-500">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-heading">
                  Leave Balance
                </span>
                <Badge variant="info">Year 2026</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-muted/30 p-2.5 rounded-lg border border-border/40">
                  <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Casual & Sick</span>
                  <span className="text-2xl font-bold text-foreground mt-1 block">12 Days</span>
                </div>
                <div className="bg-muted/30 p-2.5 rounded-lg border border-border/40">
                  <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Annual Paid</span>
                  <span className="text-2xl font-bold text-foreground mt-1 block">18 Days</span>
                </div>
              </div>
              <Button variant="outline" className="w-full text-xs h-8.5 font-semibold" onClick={() => navigate("/apply-leave")}>
                Apply For Leave <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Self Service Portal Actions */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Shortcut access to your employee profile logs and documents</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button variant="outline" className="justify-between h-11 text-xs" onClick={() => navigate("/profile")}>
              <span className="flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Personal Profile Info</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="outline" className="justify-between h-11 text-xs" onClick={() => navigate("/my-attendance")}>
              <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-emerald-500" /> Attendance Calendar</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="outline" className="justify-between h-11 text-xs sm:col-span-2" onClick={() => navigate("/my-documents")}>
              <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-indigo-500" /> Download Payslips & Policies</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* My Logs Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Recent Clock Logs</CardTitle>
          <CardDescription>Your clock activity logs for the current week</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Punch In</TableHead>
                <TableHead>Punch Out</TableHead>
                <TableHead>Hours Logged</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    No attendance logs recorded for this week.
                  </TableCell>
                </TableRow>
              ) : (
                attendanceLogs.slice(0, 5).map((log) => (
                  <TableRow key={log._id || log.dateStr}>
                    <TableCell className="font-semibold">{log.dateStr}</TableCell>
                    <TableCell>{log.checkIn}</TableCell>
                    <TableCell>{log.checkOut}</TableCell>
                    <TableCell>{log.hours}</TableCell>
                    <TableCell>
                      <Badge variant={
                        log.status === "Present" ? "success" :
                        log.status === "Late" ? "warning" : "destructive"
                      }>
                        {log.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );

  return (
    <div className="space-y-6">
      
      {/* Dashboard Top Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-xl border border-border/40 shadow-sm relative overflow-hidden transition-all duration-300">
        {/* Subtle overlay color gradient representing positive progress */}
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        
        <div className="space-y-1 relative z-10">
          <h2 className="text-2xl font-heading font-extrabold tracking-tight m-0 text-foreground">
            {getGreeting()}
          </h2>
          <p className="text-sm text-muted-foreground">
            Here's a summary of the activity and stats across your workspace today.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <Badge variant="outline" className="text-xs py-1 px-3 bg-muted/30 border-border/60 flex items-center gap-1.5 font-medium">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>Thursday, Jun 11, 2026</span>
          </Badge>
          <Badge variant="success" className="text-xs py-1 px-3 border-emerald-500/20 font-medium">
            <MapPin className="h-3.5 w-3.5 mr-1" />
            <span>HQ Office</span>
          </Badge>
        </div>
      </div>

      {/* Global Punch Card Panel (Visible to everyone: Employee, Manager, HR Admin, Leadership) */}
      <Card className="border-l-4 border-l-primary shadow-sm bg-card/65 backdrop-blur-sm">
        <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase font-heading tracking-wide">
                Your Personal Daily Shift Log (Shift: 09:00 AM - 06:00 PM)
              </span>
              <Badge variant={isPunchIn ? "success" : "outline"} className="text-[9px] py-0 px-1.5 border-0 font-medium">
                {isPunchIn ? "Active Session" : "Offline"}
              </Badge>
            </div>
            <h3 className="text-xl font-bold font-heading m-0">
              {isPunchIn ? "You are clocked in for today" : "Register your daily work attendance"}
            </h3>
            {isPunchIn ? (
              <p className="text-xs text-muted-foreground m-0">
                Punched in at: <span className="font-semibold text-foreground">{new Date(punchTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground m-0 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                Please register your punch-in attendance record.
              </p>
            )}
          </div>

          {/* Punch button and Clock timer */}
          <div className="flex items-center gap-4 bg-muted/40 p-4 rounded-xl border border-border/40 shrink-0">
            <div className="text-center shrink-0">
              <span className="text-[9px] font-bold text-muted-foreground uppercase font-heading block leading-none">Logged Hours</span>
              <span className="text-lg font-bold font-mono tracking-wider text-primary mt-1.5 block leading-none">{workHours}</span>
            </div>
            <Button
              variant={isPunchIn ? "destructive" : "default"}
              onClick={handlePunchToggle}
              className={cn(
                "h-11 w-28 font-semibold rounded-lg shrink-0 flex items-center justify-center gap-1.5 text-xs",
                !isPunchIn && "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/10 text-white"
              )}
            >
              {isPunchIn ? (
                <>
                  <Square className="h-3.5 w-3.5 fill-current" /> Punch Out
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" /> Punch In
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Render matching dashboard layout depending on role */}
      {user.role === "HR Admin" && renderAdminDashboard()}
      {user.role === "Manager" && renderManagerDashboard()}
      {user.role === "Employee" && renderEmployeeDashboard()}

      {/* Leave Modal */}
      <Dialog isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)}>
        <DialogHeader>
          <DialogTitle>Active Employees On Leave Today</DialogTitle>
          <DialogDescription>List of colleagues who are currently out of office</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {activeLeavesList.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No employees on leave today</p>
          ) : (
            activeLeavesList.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-2.5 rounded bg-muted/40 text-xs border border-border/40">
                <div>
                  <p className="font-semibold text-foreground">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.dept}</p>
                </div>
                <div className="text-right">
                  <Badge variant="warning">{item.type}</Badge>
                  <p className="text-[10px] text-muted-foreground mt-1 font-medium">{item.duration}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => setIsLeaveModalOpen(false)}>Close Panel</Button>
        </DialogFooter>
      </Dialog>

    </div>
  );
}

// Added to prevent unused imports compiler warnings
const CheckCircle2 = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="2"
    stroke="currentColor"
    className={className}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
