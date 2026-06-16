import React, { useState } from "react";
import { useHrmsData } from "@/hooks/useHrmsData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { CheckCircle2, XCircle, Clock, Calendar, MessageSquare, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function Approvals() {
  const { leaveRequests, approveLeave, rejectLeave } = useHrmsData();
  const { user } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState("pending");

  if (!user) return null;

  // Filter requests
  // For simplicity, HR Admin sees all requests, Managers see department/team requests
  // Sarah (HR Admin), Marcus (Manager)
  const isHr = user.role === "HR Admin";
  
  const relevantRequests = isHr
    ? leaveRequests
    : leaveRequests.filter((lr) => lr.employeeId !== "EMP-002"); // Managers see all reportee requests

  const pendingRequests = relevantRequests.filter((lr) => lr.status === "Pending");
  const completedRequests = relevantRequests.filter((lr) => lr.status !== "Pending");

  const handleApprove = (id: string, name: string) => {
    approveLeave(id);
    alert(`Approved leave request for ${name}.`);
  };

  const handleReject = (id: string, name: string) => {
    rejectLeave(id);
    alert(`Rejected leave request for ${name}.`);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-heading font-extrabold tracking-tight m-0 text-foreground">
          Workflow Approvals Portal
        </h1>
        <p className="text-sm text-muted-foreground">
          Approve or reject time off request streams and clock regularization logs.
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        
        <TabsList className="bg-card/60 backdrop-blur-md p-1 border border-border/40 rounded-xl max-w-sm">
          <TabsTrigger value="pending" className="flex items-center gap-1.5 text-xs">
            <Clock className="h-4 w-4" /> Pending Approvals ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1.5 text-xs">
            <CheckCircle2 className="h-4 w-4" /> Approval History ({completedRequests.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Pending Approvals */}
        <TabsContent value="pending" className="mt-6">
          {pendingRequests.length === 0 ? (
            <Card className="text-center py-16 max-w-md mx-auto border border-border/40 shadow-sm space-y-4">
              <div className="h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg">All caught up!</h3>
                <p className="text-xs text-muted-foreground mt-1">No pending team leave or regularization requests require your review.</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((req) => (
                <Card key={req._id || req.id} className="relative hover:border-primary/25 transition-all">
                  <CardContent className="pt-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    
                    <div className="space-y-3 flex-1">
                      {/* Requester name & leave badge */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-heading font-bold text-base text-foreground">{req.employeeName}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">({req.employeeId})</span>
                        <Badge variant="info" className="py-0 px-2 text-[9px] border-0 leading-tight">
                          {req.leaveType}
                        </Badge>
                      </div>

                      {/* Date details and duration */}
                      <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-primary shrink-0" />
                          <span>Period: <span className="font-semibold text-foreground/90">{req.startDate}</span> to <span className="font-semibold text-foreground/90">{req.endDate}</span></span>
                        </span>
                        <span className="font-semibold">Duration: <Badge variant="secondary" className="font-bold py-0 px-1 border-0">{req.days} Days</Badge></span>
                      </div>

                      {/* Reason remarks */}
                      <div className="bg-muted/30 p-2.5 rounded-lg border border-border/30 text-xs flex items-start gap-2 max-w-2xl text-foreground/90">
                        <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span>Remarks: <span className="italic">"{req.reason}"</span></span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2.5 shrink-0 self-end md:self-auto pt-2 border-t md:border-t-0 border-border/40">
                      <Button
                        variant="outline"
                        onClick={() => handleReject(req._id || req.id, req.employeeName)}
                        className="h-10 text-xs text-destructive hover:bg-destructive/5 border-destructive/20 hover:border-destructive rounded-lg font-semibold"
                      >
                        Reject Request
                      </Button>
                      <Button
                        onClick={() => handleApprove(req._id || req.id, req.employeeName)}
                        className="h-10 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold border-0 shadow-sm"
                      >
                        Approve Leave
                      </Button>
                    </div>

                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Approval History */}
        <TabsContent value="history" className="mt-6">
          {completedRequests.length === 0 ? (
            <Card className="text-center py-12 max-w-sm mx-auto border border-border/40 shadow-sm text-muted-foreground">
              <span className="text-xs">No completed approvals in the historical logs.</span>
            </Card>
          ) : (
            <div className="space-y-4">
              {completedRequests.map((req) => {
                const isApproved = req.status === "Approved";
                
                return (
                  <Card key={req._id || req.id} className="opacity-80">
                    <CardContent className="pt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-foreground">{req.employeeName}</span>
                          <Badge variant="outline" className="text-[9px] py-0 px-1.5 font-semibold">{req.leaveType}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Period: {req.startDate} to {req.endDate} ({req.days} Days) • Applied: {req.appliedAt}
                        </p>
                      </div>

                      {/* Status indicator */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isApproved ? (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-500/10 py-1.5 px-3 rounded-full border border-emerald-500/15">
                            <CheckCircle2 className="h-4 w-4" />
                            Approved
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-destructive font-semibold bg-destructive/10 py-1.5 px-3 rounded-full border border-destructive/15">
                            <XCircle className="h-4 w-4" />
                            Rejected
                          </div>
                        )}
                      </div>

                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

      </Tabs>

    </div>
  );
}
