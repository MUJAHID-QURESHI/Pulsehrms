import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHrmsData } from "@/hooks/useHrmsData";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import {
  Search,
  Plus,
  LayoutGrid,
  List as ListIcon,
  MapPin,
  Mail,
  Phone,
  Eye,
  Edit2,
  Trash2,
  Building2,
  UserX
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog";

export function EmployeeList() {
  const navigate = useNavigate();
  const { employees, deleteEmployee } = useHrmsData();
  const { user: currentUser } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [empToDelete, setEmpToDelete] = useState<{ id: string; name: string } | null>(null);

  // Get distinct departments
  const departments = ["All", ...Array.from(new Set(employees.map((e) => e.department)))];

  // Filtering Logic
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = deptFilter === "All" || emp.department === deptFilter;
    const matchesStatus = statusFilter === "All" || emp.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleDelete = (id: string, name: string) => {
    setEmpToDelete({ id, name });
    setIsDeleteOpen(true);
  };

  const isHrOrLeader = currentUser?.role === "HR Admin";

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight m-0 text-foreground">
            Employee Directory
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your organization's workforce, view roles, and track personnel files.
          </p>
        </div>
        
        {isHrOrLeader && (
          <Button
            onClick={() => navigate("/employees/add")}
            className="flex items-center gap-2 h-10 px-4 rounded-lg font-semibold"
          >
            <Plus className="h-4.5 w-4.5" />
            Add Employee
          </Button>
        )}
      </div>

      {/* Filter and View Toggler Control Panel */}
      <div className="bg-card p-4 rounded-xl border border-border/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 max-w-3xl">
          {/* Search bar */}
          <Input
            placeholder="Search by name, email, role..."
            leftIcon={<Search className="h-4 w-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9.5"
          />

          {/* Department Filter */}
          <Select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            options={departments.map((d) => ({ value: d, label: d === "All" ? "All Departments" : d }))}
            className="h-9.5"
          />

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: "All", label: "All Statuses" },
              { value: "Active", label: "Active" },
              { value: "Inactive", label: "Inactive" },
            ]}
            className="h-9.5"
          />
        </div>

        {/* View mode toggle switcher */}
        <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-lg border border-border/40 shrink-0 self-start md:self-auto">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="h-8.5 w-8.5 p-0"
            title="Grid Card View"
          >
            <LayoutGrid className="h-4.5 w-4.5" />
          </Button>
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
            className="h-8.5 w-8.5 p-0"
            title="Table List View"
          >
            <ListIcon className="h-4.5 w-4.5" />
          </Button>
        </div>
      </div>

      {/* Empty State check */}
      {filteredEmployees.length === 0 ? (
        <div className="bg-card p-12 text-center rounded-xl border border-border/40 shadow-sm max-w-md mx-auto space-y-4">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <UserX className="h-7 w-7" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg">No Employees Found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              We couldn't find any employees matching your current search parameters.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setSearchQuery(""); setDeptFilter("All"); setStatusFilter("All"); }}>
            Clear Filters
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        
        /* Grid Card View Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEmployees.map((emp) => (
            <Card key={emp.id} className="relative hover:border-primary/30 transition-all group">
              <CardContent className="pt-6 flex flex-col justify-between h-full gap-4">
                
                {/* Employee Main ID and Badge Header */}
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 items-center">
                    <img
                      src={emp.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${emp.email}`}
                      alt={emp.name}
                      className="h-14 w-14 rounded-full object-cover border-2 border-border/60"
                    />
                    <div>
                      <h3 className="font-heading font-semibold text-base leading-none text-foreground mb-1">
                        {emp.name}
                      </h3>
                      <span className="text-xs font-medium text-muted-foreground">{emp.designation}</span>
                    </div>
                  </div>
                  <Badge variant={emp.status === "Active" ? "success" : "secondary"}>
                    {emp.status}
                  </Badge>
                </div>

                {/* Sub-Details grid */}
                <div className="space-y-2 border-y border-border/40 py-3 text-xs text-foreground/80">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{emp.department} • <span className="text-muted-foreground font-mono">{emp.id}</span></span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{emp.location}</span>
                  </div>
                </div>

                {/* Actions bottom footer */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-8.5 font-semibold"
                    onClick={() => navigate(`/employees/${emp.id}`)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" /> Profile
                  </Button>
                  
                  {isHrOrLeader && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8.5 w-8.5 p-0 border-border"
                        onClick={() => navigate(`/employees/edit/${emp.id}`)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8.5 w-8.5 p-0 text-destructive border-destructive/20 hover:border-destructive hover:bg-destructive/5"
                        onClick={() => handleDelete(emp.id, emp.name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>

              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        
        /* Table List View Layout */
        <Card className="overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-mono text-xs font-semibold">{emp.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <img
                        src={emp.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${emp.email}`}
                        alt={emp.name}
                        className="h-7.5 w-7.5 rounded-full object-cover"
                      />
                      <span className="font-semibold">{emp.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{emp.department}</TableCell>
                  <TableCell className="text-muted-foreground">{emp.designation}</TableCell>
                  <TableCell className="text-muted-foreground">{emp.location}</TableCell>
                  <TableCell>
                    <Badge variant={emp.status === "Active" ? "success" : "secondary"} className="py-0 px-2 text-[10px]">
                      {emp.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => navigate(`/employees/${emp.id}`)}
                        title="View Profile"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {isHrOrLeader && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => navigate(`/employees/edit/${emp.id}`)}
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/5"
                            onClick={() => handleDelete(emp.id, emp.name)}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Pagination text helper */}
      <div className="flex items-center justify-between text-xs text-muted-foreground mt-4">
        <span>Showing {filteredEmployees.length} of {employees.length} entries</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-7.5 text-[10px] py-0 px-2.5" disabled>Previous</Button>
          <Button variant="outline" size="sm" className="h-7.5 text-[10px] py-0 px-2.5" disabled>Next</Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog isOpen={isDeleteOpen} onClose={() => { setIsDeleteOpen(false); setEmpToDelete(null); }}>
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
            <UserX className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl font-bold font-heading text-destructive">
            Remove Employee
          </DialogTitle>
          <DialogDescription className="text-center text-sm mt-2">
            Are you sure you want to remove <span className="font-semibold text-foreground">{empToDelete?.name}</span> from the system? This will delete their profile and user account permanently.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => { setIsDeleteOpen(false); setEmpToDelete(null); }}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              if (empToDelete) {
                deleteEmployee(empToDelete.id);
              }
              setIsDeleteOpen(false);
              setEmpToDelete(null);
            }} 
            className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 text-white font-semibold border-0"
          >
            Yes, Remove
          </Button>
        </DialogFooter>
      </Dialog>

    </div>
  );
}
