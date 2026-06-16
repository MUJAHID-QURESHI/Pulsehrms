import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useHrmsData } from "@/hooks/useHrmsData";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Users,
  Clock,
  Plane,
  Mail,
  Phone,
  MapPin,
  Eye,
  MessageSquare
} from "lucide-react";

export function TeamDirectory() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { employees, leaveRequests } = useHrmsData();

  if (!currentUser) return null;

  // Filter employees belonging to the manager's department
  // If leader/CEO, show all. If employee, show colleagues. If manager, show team.
  // Marcus Sterling (Manager) has "Engineering" department.
  const isLeaderOrAdmin = currentUser.role === "HR Admin";
  
  const teamMembers = isLeaderOrAdmin
    ? employees.filter((e) => e.email !== currentUser.email) // CEO/Admin sees everyone else
    : employees.filter((e) => e.department === currentUser.department && e.email !== currentUser.email);

  // Today's attendance based on approved leaves
  const todayStr = new Date().toISOString().split("T")[0];
  const leavesToday = leaveRequests.filter(req => 
    req.status === "Approved" && todayStr >= req.startDate && todayStr <= req.endDate
  );
  const leaveEmployeeIds = new Set(leavesToday.map(req => req.employeeId));

  const activeLeaveCount = teamMembers.filter((t) => leaveEmployeeIds.has(t.id)).length;
  const clockedInCount = teamMembers.length - activeLeaveCount;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-heading font-extrabold tracking-tight m-0 text-foreground">
          {currentUser.role === "Manager" ? "My Direct Team" : "Organization Directory"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {currentUser.role === "Manager" 
            ? "Monitor work statuses, check-in stamps, and coordinates of your direct reportees."
            : "Review employees list, department deployments, and active statuses."}
        </p>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardContent className="pt-6">
            <span className="text-[10px] font-bold text-muted-foreground uppercase font-heading block">Team Size</span>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-2xl font-bold font-heading">{teamMembers.length} Employees</span>
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Users className="h-4.5 w-4.5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="pt-6">
            <span className="text-[10px] font-bold text-muted-foreground uppercase font-heading block">Clocked In Today</span>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-2xl font-bold font-heading">{clockedInCount} / {teamMembers.length}</span>
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Clock className="h-4.5 w-4.5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardContent className="pt-6">
            <span className="text-[10px] font-bold text-muted-foreground uppercase font-heading block">Active Leaves Today</span>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-2xl font-bold font-heading">{activeLeaveCount} Out of Office</span>
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Plane className="h-4.5 w-4.5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid listing team cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers.map((member) => {
          const isOnLeave = leaveEmployeeIds.has(member.id);
          
          return (
            <Card key={member.id} className="relative hover:border-primary/20 transition-all">
              <CardContent className="pt-6 flex flex-col justify-between h-full gap-4">
                
                {/* Avatar and Info Header */}
                <div className="flex gap-3 items-center">
                  <img
                    src={member.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.email}`}
                    alt={member.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-heading font-semibold text-sm leading-none text-foreground mb-1">{member.name}</h3>
                    <span className="text-xs text-muted-foreground">{member.designation}</span>
                  </div>
                </div>

                {/* Info block */}
                <div className="space-y-2 border-y border-border/40 py-3 text-xs text-foreground/80">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Clock-in Timing</span>
                    <Badge variant={isOnLeave ? "warning" : "success"} className="text-[9px] py-0 px-1.5 border-0">
                      {isOnLeave ? "On Leave" : "09:00 AM"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Work Location</span>
                    <span className="font-medium text-foreground">{member.location}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email Contact</span>
                    <span className="font-mono text-[10px] truncate max-w-[140px]">{member.email}</span>
                  </div>
                </div>

                {/* Actions footer */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-8.5 font-semibold"
                    onClick={() => navigate(`/employees/${member.id}`)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" /> View Profile
                  </Button>
                  <a
                    href={`mailto:${member.email}`}
                    className="h-8.5 w-8.5 rounded border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors bg-background"
                    title="Send Email"
                  >
                    <Mail className="h-4 w-4" />
                  </a>
                </div>

              </CardContent>
            </Card>
          );
        })}
      </div>

    </div>
  );
}
