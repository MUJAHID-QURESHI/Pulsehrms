import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import {
  Settings as SettingsIcon,
  Building,
  Users,
  ShieldAlert,
  Save,
  Check,
  UserPlus
} from "lucide-react";
import { useHrmsData } from "@/hooks/useHrmsData";

// Initial permissions matrix
const INITIAL_PERMISSIONS = [
  { module: "Employees", Employee: { r: true, c: false, u: false, d: false }, Manager: { r: true, c: false, u: true, d: false }, HRAdmin: { r: true, c: true, u: true, d: true } },
  { module: "Leaves", Employee: { r: true, c: true, u: false, d: false }, Manager: { r: true, c: true, u: true, d: false }, HRAdmin: { r: true, c: true, u: true, d: true } },
  { module: "Attendance", Employee: { r: true, c: true, u: false, d: false }, Manager: { r: true, c: true, u: true, d: false }, HRAdmin: { r: true, c: true, u: true, d: true } },
  { module: "Settings", Employee: { r: false, c: false, u: false, d: false }, Manager: { r: false, c: false, u: false, d: false }, HRAdmin: { r: true, c: true, u: true, d: true } },
];

export function Settings() {
  const navigate = useNavigate();
  const { employees } = useHrmsData();

  // Company Form state
  const [compName, setCompName] = useState("PulseHRMS Inc.");
  const [compDomain, setCompDomain] = useState("company.com");
  const [compIndustry, setCompIndustry] = useState("Information Technology");
  const [compCurrency, setCompCurrency] = useState("USD");
  const [compTimezone, setCompTimezone] = useState("GMT-5 (EST)");

  // Permissions state
  const [permissions, setPermissions] = useState(INITIAL_PERMISSIONS);

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Company profile updated successfully.");
  };

  const handlePermissionToggle = (moduleName: string, roleName: "Employee" | "Manager" | "HRAdmin", action: "r" | "c" | "u" | "d") => {
    setPermissions((prev) =>
      prev.map((row) => {
        if (row.module === moduleName) {
          const roleData = row[roleName] as { r: boolean; c: boolean; u: boolean; d: boolean };
          return {
            ...row,
            [roleName]: {
              ...roleData,
              [action]: !roleData[action],
            },
          };
        }
        return row;
      })
    );
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-heading font-extrabold tracking-tight m-0 text-foreground">
          System Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure organization profiles, check system user accounts, and manage permissions matrices.
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="company" className="w-full">
        
        <TabsList className="bg-card/60 backdrop-blur-md p-1 border border-border/40 rounded-xl max-w-md">
          <TabsTrigger value="company" className="flex items-center gap-1.5 text-xs">
            <Building className="h-4 w-4 text-primary" /> Company Profile
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-1.5 text-xs">
            <Users className="h-4 w-4 text-emerald-500" /> User Accounts
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-1.5 text-xs">
            <ShieldAlert className="h-4 w-4 text-amber-500" /> Roles & Permissions
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Company Profile */}
        <TabsContent value="company" className="mt-6">
          <Card className="max-w-3xl shadow-sm">
            <CardHeader>
              <CardTitle>Company Metadata Setup</CardTitle>
              <CardDescription>Primary profile data used across payroll invoices and contracts</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveCompany} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Company Name"
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    required
                  />
                  <Input
                    label="Work Domain"
                    value={compDomain}
                    onChange={(e) => setCompDomain(e.target.value)}
                    required
                  />
                  <Select
                    label="Business Industry"
                    value={compIndustry}
                    onChange={(e) => setCompIndustry(e.target.value)}
                    options={[
                      { value: "Information Technology", label: "Information Technology" },
                      { value: "Finance & Banking", label: "Finance & Banking" },
                      { value: "Healthcare", label: "Healthcare" },
                      { value: "Consulting", label: "Consulting" },
                    ]}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      label="Currency"
                      value={compCurrency}
                      onChange={(e) => setCompCurrency(e.target.value)}
                      options={[
                        { value: "USD", label: "USD ($)" },
                        { value: "EUR", label: "EUR (€)" },
                        { value: "INR", label: "INR (₹)" },
                      ]}
                    />
                    <Select
                      label="Timezone"
                      value={compTimezone}
                      onChange={(e) => setCompTimezone(e.target.value)}
                      options={[
                        { value: "GMT-5 (EST)", label: "EST (GMT-5)" },
                        { value: "GMT-8 (PST)", label: "PST (GMT-8)" },
                        { value: "GMT+5:30 (IST)", label: "IST (GMT+5:30)" },
                      ]}
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-3">
                  <Button type="submit" className="flex items-center gap-1.5 font-semibold">
                    <Save className="h-4.5 w-4.5" /> Save Company Profile
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: User Accounts */}
        <TabsContent value="users" className="mt-6">
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>System Accounts</CardTitle>
                <CardDescription>Employee logins with portal permissions</CardDescription>
              </div>
              <Button 
                size="sm" 
                className="flex items-center gap-1.5 text-xs h-8.5 font-semibold border-0"
                onClick={() => navigate("/employees/add")}
              >
                <UserPlus className="h-4 w-4" /> Add User Account
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Legal Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>System Access Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-mono text-xs font-semibold">{emp.id}</TableCell>
                      <TableCell className="font-semibold">{emp.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{emp.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-bold py-0.5 px-2 text-[10px]">
                          {emp.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={emp.status === "Active" ? "success" : "secondary"} className="py-0 px-2 text-[9px]">
                          {emp.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Roles & Permissions */}
        <TabsContent value="roles" className="mt-6">
          <Card className="shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle>Security Permissions Matrix</CardTitle>
              <CardDescription>Configure granular CRUD access roles for dashboard components</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/4">Workspace Module</TableHead>
                    <TableHead className="text-center w-1/4">Employee Role</TableHead>
                    <TableHead className="text-center w-1/4">Manager Role</TableHead>
                    <TableHead className="text-center w-1/4">HR Admin Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((row) => (
                    <TableRow key={row.module}>
                      <TableCell className="font-bold text-foreground/80">{row.module}</TableCell>
                      
                      {/* Employee Column */}
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2 text-[10px]">
                          {["r", "c", "u", "d"].map((action) => {
                            const isGranted = (row.Employee as any)[action];
                            return (
                              <button
                                key={action}
                                type="button"
                                onClick={() => handlePermissionToggle(row.module, "Employee", action as any)}
                                className={`h-6 w-6 rounded font-bold uppercase transition-colors border cursor-pointer ${
                                  isGranted ? "bg-primary text-white border-primary" : "bg-transparent text-muted-foreground border-border/60 hover:bg-muted/50"
                                }`}
                                title={`Toggle Employee ${action === "r" ? "Read" : action === "c" ? "Create" : action === "u" ? "Update" : "Delete"}`}
                              >
                                {action}
                              </button>
                            );
                          })}
                        </div>
                      </TableCell>

                      {/* Manager Column */}
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2 text-[10px]">
                          {["r", "c", "u", "d"].map((action) => {
                            const isGranted = (row.Manager as any)[action];
                            return (
                              <button
                                key={action}
                                type="button"
                                onClick={() => handlePermissionToggle(row.module, "Manager", action as any)}
                                className={`h-6 w-6 rounded font-bold uppercase transition-colors border cursor-pointer ${
                                  isGranted ? "bg-emerald-600 text-white border-emerald-600" : "bg-transparent text-muted-foreground border-border/60 hover:bg-muted/50"
                                }`}
                                title={`Toggle Manager ${action === "r" ? "Read" : action === "c" ? "Create" : action === "u" ? "Update" : "Delete"}`}
                              >
                                {action}
                              </button>
                            );
                          })}
                        </div>
                      </TableCell>

                      {/* HR Admin Column */}
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2 text-[10px]">
                          {["r", "c", "u", "d"].map((action) => {
                            const isGranted = (row.HRAdmin as any)[action];
                            return (
                              <button
                                key={action}
                                type="button"
                                onClick={() => handlePermissionToggle(row.module, "HRAdmin", action as any)}
                                className={`h-6 w-6 rounded font-bold uppercase transition-colors border cursor-pointer ${
                                  isGranted ? "bg-amber-600 text-white border-amber-600" : "bg-transparent text-muted-foreground border-border/60 hover:bg-muted/50"
                                }`}
                                title={`Toggle HR Admin ${action === "r" ? "Read" : action === "c" ? "Create" : action === "u" ? "Update" : "Delete"}`}
                              >
                                {action}
                              </button>
                            );
                          })}
                        </div>
                      </TableCell>


                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

    </div>
  );
}
