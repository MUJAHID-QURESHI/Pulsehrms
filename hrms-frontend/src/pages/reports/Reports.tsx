import React, { useState, useMemo } from "react";
import { useHrmsData } from "@/hooks/useHrmsData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import {
  FileBarChart2,
  Users,
  CalendarCheck,
  Clock,
  Download,
  Filter,
  RefreshCw,
  MapPin,
  Briefcase
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6"];

export function Reports() {
  const { employees, leaveRequests, refreshData, isLoading } = useHrmsData();
  const [activeReportTab, setActiveReportTab] = useState("headcount");

  // Filters State
  const [deptFilter, setDeptFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const todayStr = new Date().toISOString().split("T")[0];

  // Distinct Filter options
  const departments = useMemo(() => ["All", ...Array.from(new Set(employees.map(e => e.department)))], [employees]);
  const locations = useMemo(() => ["All", ...Array.from(new Set(employees.map(e => e.location)))], [employees]);

  // Derived Headcount Metrics
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchDept = deptFilter === "All" || emp.department === deptFilter;
      const matchLoc = locationFilter === "All" || emp.location === locationFilter;
      const matchStat = statusFilter === "All" || emp.status === statusFilter;
      return matchDept && matchLoc && matchStat;
    });
  }, [employees, deptFilter, locationFilter, statusFilter]);

  // Headcount breakdown for charts
  const deptChartData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    employees.forEach(e => {
      counts[e.department] = (counts[e.department] || 0) + 1;
    });
    return Object.keys(counts).map(dept => ({ name: dept, Headcount: counts[dept] }));
  }, [employees]);

  const locationChartData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    employees.forEach(e => {
      counts[e.location] = (counts[e.location] || 0) + 1;
    });
    return Object.keys(counts).map(loc => ({ name: loc, value: counts[loc] }));
  }, [employees]);

  // Leave Metrics
  const leaveSummaryData = useMemo(() => {
    const summary: { [key: string]: { casual: number, sick: number, annual: number, total: number } } = {};
    
    // Initialize for all employees
    employees.forEach(e => {
      summary[e.name] = { casual: 0, sick: 0, annual: 0, total: 0 };
    });

    leaveRequests.filter(req => req.status === "Approved").forEach(req => {
      if (summary[req.employeeName]) {
        const type = req.leaveType.toLowerCase();
        if (type.includes("casual")) summary[req.employeeName].casual += req.days;
        else if (type.includes("sick")) summary[req.employeeName].sick += req.days;
        else summary[req.employeeName].annual += req.days;
        summary[req.employeeName].total += req.days;
      }
    });

    return Object.keys(summary).map(name => {
      const emp = employees.find(e => e.name === name);
      return {
        name,
        department: emp?.department || "N/A",
        casual: summary[name].casual,
        sick: summary[name].sick,
        annual: summary[name].annual,
        total: summary[name].total
      };
    });
  }, [employees, leaveRequests]);

  const filteredLeaveSummary = useMemo(() => {
    return leaveSummaryData.filter(item => {
      const emp = employees.find(e => e.name === item.name);
      if (!emp) return false;
      const matchDept = deptFilter === "All" || emp.department === deptFilter;
      const matchLoc = locationFilter === "All" || emp.location === locationFilter;
      return matchDept && matchLoc;
    });
  }, [leaveSummaryData, employees, deptFilter, locationFilter]);

  // Attendance Metrics Mock details
  const attendanceTrendData = [
    { day: "Mon", ClockedIn: 100, Late: 10 },
    { day: "Tue", ClockedIn: 100, Late: 5 },
    { day: "Wed", ClockedIn: 88, Late: 12 },
    { day: "Thu", ClockedIn: 100, Late: 0 },
    { day: "Fri", ClockedIn: 92, Late: 8 },
  ];

  // CSV Export Engine
  const exportToCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let fileName = `PulseHRMS_${activeReportTab}_Report.csv`;

    if (activeReportTab === "headcount") {
      headers = ["ID", "Name", "Email", "Role", "Department", "Designation", "Joining Date", "Status", "Phone", "Location"];
      rows = filteredEmployees.map(emp => [
        emp.id,
        emp.name,
        emp.email,
        emp.role,
        emp.department,
        emp.designation,
        emp.joiningDate,
        emp.status,
        emp.phone,
        emp.location
      ]);
    } else if (activeReportTab === "leaves") {
      headers = ["Employee Name", "Department", "Casual Leaves Taken", "Sick Leaves Taken", "Annual Leaves Taken", "Total Leave Days"];
      rows = filteredLeaveSummary.map(item => [
        item.name,
        item.department,
        item.casual.toString(),
        item.sick.toString(),
        item.annual.toString(),
        item.total.toString()
      ]);
    } else if (activeReportTab === "attendance") {
      headers = ["Day", "Clocked-In Percentage", "Late Punch-In Percentage"];
      rows = attendanceTrendData.map(item => [
        item.day,
        `${item.ClockedIn}%`,
        `${item.Late}%`
      ]);
    }

    // Compile CSV Content
    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(val => `"${val.replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    // Browser Download trigger
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetFilters = () => {
    setDeptFilter("All");
    setLocationFilter("All");
    setStatusFilter("All");
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight m-0 text-foreground flex items-center gap-2.5">
            <FileBarChart2 className="h-8 w-8 text-primary" />
            HR Analytics & Reports
          </h1>
          <p className="text-sm text-muted-foreground">
            Generate workforce metrics, check attendance analytics, and export CSV spreadsheets.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={refreshData}
            disabled={isLoading}
            className="flex items-center gap-1.5 h-10 px-3 rounded-lg border-border"
            title="Refresh database records"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading && "animate-spin"}`} />
            Sync
          </Button>

          <Button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 h-10 px-4 rounded-lg font-semibold bg-primary text-white"
          >
            <Download className="h-4.5 w-4.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Analytics Cards Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-primary shadow-sm bg-card/70">
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-heading">Total Personnel</p>
              <h3 className="text-2xl font-extrabold font-heading mt-1">{employees.length}</h3>
              <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1 font-semibold">
                <Users className="h-3.5 w-3.5 text-primary" /> Active staff members
              </span>
            </div>
            <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Users className="h-5.5 w-5.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm bg-card/70">
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-heading">Leaves Active Today</p>
              <h3 className="text-2xl font-extrabold font-heading mt-1">
                {leaveRequests.filter(l => l.status === "Approved" && todayStr >= l.startDate && todayStr <= l.endDate).length}
              </h3>
              <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1 font-semibold">
                <CalendarCheck className="h-3.5 w-3.5 text-emerald-500" /> Out-of-office logs
              </span>
            </div>
            <div className="h-11 w-11 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CalendarCheck className="h-5.5 w-5.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm bg-card/70">
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-heading">Pending Approvals</p>
              <h3 className="text-2xl font-extrabold font-heading mt-1">
                {leaveRequests.filter(l => l.status === "Pending").length}
              </h3>
              <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1 font-semibold">
                <Clock className="h-3.5 w-3.5 text-amber-500" /> Workflow items
              </span>
            </div>
            <div className="h-11 w-11 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Clock className="h-5.5 w-5.5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Control Board */}
      <Card className="shadow-sm">
        <CardContent className="pt-4 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
            <span className="text-xs font-bold font-heading uppercase text-muted-foreground">Filter Reports</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 max-w-3xl">
            <Select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              options={departments.map(d => ({ value: d, label: d === "All" ? "All Departments" : d }))}
              className="h-9.5 text-xs"
            />
            <Select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              options={locations.map(l => ({ value: l, label: l === "All" ? "All Locations" : l }))}
              className="h-9.5 text-xs"
            />
            {activeReportTab === "headcount" && (
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: "All", label: "All Statuses" },
                  { value: "Active", label: "Active Only" },
                  { value: "Inactive", label: "Inactive Only" },
                ]}
                className="h-9.5 text-xs"
              />
            )}
          </div>

          <Button variant="ghost" size="sm" onClick={handleResetFilters} className="text-xs font-semibold h-9.5">
            Reset
          </Button>
        </CardContent>
      </Card>

      {/* Main Report Selector Tabs */}
      <Tabs defaultValue="headcount" onValueChange={setActiveReportTab} className="w-full overflow-hidden">
        
        <TabsList className="bg-card/60 backdrop-blur-md p-1 border border-border/40 rounded-xl w-full flex overflow-x-auto whitespace-nowrap scrollbar-none max-w-full justify-start md:justify-center md:max-w-md shrink-0 gap-1">
          <TabsTrigger value="headcount" className="text-xs flex items-center gap-1 shrink-0"><Users className="h-3.5 w-3.5" /> Headcount</TabsTrigger>
          <TabsTrigger value="attendance" className="text-xs flex items-center gap-1 shrink-0"><Clock className="h-3.5 w-3.5" /> Attendance</TabsTrigger>
          <TabsTrigger value="leaves" className="text-xs flex items-center gap-1 shrink-0"><CalendarCheck className="h-3.5 w-3.5" /> Leaves</TabsTrigger>
        </TabsList>

        {/* Headcount tab panel */}
        <TabsContent value="headcount" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Visual breakdown bar chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Department Headcount Distribution</CardTitle>
                <CardDescription>Number of active FTE employee profiles by department</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
                    <XAxis dataKey="name" className="text-[10px] font-semibold text-muted-foreground" tickLine={false} />
                    <YAxis className="text-[10px] font-semibold text-muted-foreground" tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="Headcount" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={35} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Donut Location Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Location Metrics</CardTitle>
                <CardDescription>Headcount breakdown by active site</CardDescription>
              </CardHeader>
              <CardContent className="h-72 flex flex-col justify-between">
                <div className="h-44 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={locationChartData}
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {locationChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-bold">{employees.length}</span>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">FTEs</span>
                  </div>
                </div>
                {/* Legend list */}
                <div className="space-y-1.5 text-[10px] font-semibold">
                  {locationChartData.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="truncate">{item.name}</span>
                      </div>
                      <span className="text-muted-foreground">{item.value} ({Math.round((item.value / employees.length) * 100)}%)</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Detailed data view table */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Headcount Report Directory</CardTitle>
              <CardDescription>Filtered list showing employee details ({filteredEmployees.length} profiles)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Role/Designation</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No employees found matching the filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <TableRow key={emp.id} className="hover:bg-muted/10">
                        <TableCell className="font-mono text-xs">{emp.id}</TableCell>
                        <TableCell className="font-semibold">{emp.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{emp.department}</TableCell>
                        <TableCell className="text-xs">{emp.designation}</TableCell>
                        <TableCell className="text-xs flex items-center gap-1 mt-2"><MapPin className="h-3 w-3 text-muted-foreground" />{emp.location}</TableCell>
                        <TableCell className="text-xs">{emp.joiningDate}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={emp.status === "Active" ? "success" : "secondary"} className="text-[9px] py-0">
                            {emp.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance tab panel */}
        <TabsContent value="attendance" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance & Punctuality rate trends</CardTitle>
              <CardDescription>Daily clock-in rate vs late punch percentages recorded over the past week</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceTrendData}>
                  <defs>
                    <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
                  <XAxis dataKey="day" className="text-[10px] font-semibold text-muted-foreground" tickLine={false} />
                  <YAxis className="text-[10px] font-semibold text-muted-foreground" tickLine={false} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="ClockedIn" name="Clocked-in %" stroke="#10b981" fillOpacity={1} fill="url(#colorIn)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Late" name="Late %" stroke="#f59e0b" fillOpacity={1} fill="url(#colorLate)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Attendance Trends Matrix</CardTitle>
              <CardDescription>Consolidated statistics on daily presence rate</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day</TableHead>
                    <TableHead>Average Presence Rate</TableHead>
                    <TableHead>Average Late Punch rate</TableHead>
                    <TableHead className="text-right">Shift Compliance Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceTrendData.map((item) => (
                    <TableRow key={item.day}>
                      <TableCell className="font-bold">{item.day}</TableCell>
                      <TableCell className="font-mono text-xs">{item.ClockedIn}%</TableCell>
                      <TableCell className="font-mono text-xs text-amber-600 font-semibold">{item.Late}%</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={item.ClockedIn >= 90 ? "success" : "warning"} className="text-[9px] py-0">
                          {item.ClockedIn >= 90 ? "Compliant" : "Warning"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaves tab panel */}
        <TabsContent value="leaves" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Leave Days Consumption Matrix</CardTitle>
              <CardDescription>Approved leave days summary per personnel profile by filter criteria</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Casual Leaves</TableHead>
                    <TableHead>Sick Leaves</TableHead>
                    <TableHead>Annual Leaves</TableHead>
                    <TableHead className="text-right">Total Leave Days</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeaveSummary.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No leave metrics logged for matched filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeaveSummary.map((item) => (
                      <TableRow key={item.name} className="hover:bg-muted/10">
                        <TableCell className="font-semibold">{item.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{item.department}</TableCell>
                        <TableCell className="font-mono text-xs">{item.casual} days</TableCell>
                        <TableCell className="font-mono text-xs">{item.sick} days</TableCell>
                        <TableCell className="font-mono text-xs">{item.annual} days</TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold text-foreground">
                          {item.total} days
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

    </div>
  );
}
