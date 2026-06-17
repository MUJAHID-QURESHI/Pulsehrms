import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import {
  Building2,
  MapPin,
  GitMerge,
  ChevronDown,
  User,
  Activity,
  ArrowRight
} from "lucide-react";
import { useHrmsData } from "@/hooks/useHrmsData";

export function Organization() {
  const { employees } = useHrmsData();

  // Find top leader (e.g. CEO or first HR Admin in database)
  const topLeader = employees.find(e => 
    e.designation.toLowerCase().includes("ceo") || 
    e.designation.toLowerCase().includes("chief") || 
    e.designation.toLowerCase().includes("president")
  ) || employees.find(e => e.role === "HR Admin") || employees[0];

  // Find level 2 reportees (who report directly to CEO, or have no manager assigned, excluding CEO self)
  const level2Reportees = employees.filter(e => 
    e.id !== topLeader?.id && 
    (e.reportsTo === topLeader?.id || !e.reportsTo || e.reportsTo === "")
  );

  // Aggregate department counts for Departments tab
  const deptSummary = Array.from(new Set(employees.map((e) => e.department))).map((dept) => {
    const members = employees.filter((e) => e.department === dept);
    const lead = employees.find((e) => e.department === dept && (e.role === "Manager" || e.role === "HR Admin"));
    return { name: dept, count: members.length, lead: lead ? lead.name : "N/A" };
  });

  // Aggregate location counts for Locations tab
  const locSummary = Array.from(new Set(employees.map((e) => e.location))).map((loc) => {
    const members = employees.filter((e) => e.location === loc);
    return { name: loc, count: members.length };
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-heading font-extrabold tracking-tight m-0 text-foreground">
          Organization Structure
        </h1>
        <p className="text-sm text-muted-foreground">
          Review business divisions, physical branches, and the organizational hierarchy chart.
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="chart" className="w-full overflow-hidden">
        
        <TabsList className="bg-card/60 backdrop-blur-md p-1 border border-border/40 rounded-xl w-full flex overflow-x-auto whitespace-nowrap scrollbar-none max-w-full justify-start md:justify-center md:max-w-md shrink-0 gap-1">
          <TabsTrigger value="chart" className="flex items-center gap-1.5 text-xs shrink-0">
            <GitMerge className="h-4 w-4 text-primary" /> Visual Org Chart
          </TabsTrigger>
          <TabsTrigger value="depts" className="flex items-center gap-1.5 text-xs shrink-0">
            <Building2 className="h-4 w-4 text-emerald-500" /> Departments
          </TabsTrigger>
          <TabsTrigger value="locs" className="flex items-center gap-1.5 text-xs shrink-0">
            <MapPin className="h-4 w-4 text-amber-500" /> Locations
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Visual Org Chart */}
        <TabsContent value="chart" className="mt-6">
          <Card className="shadow-sm overflow-hidden bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Reporting Hierarchy Tree</CardTitle>
              <CardDescription>Visual chart mapping reporting paths within PulseHRMS</CardDescription>
            </CardHeader>
            <CardContent className="w-full overflow-x-auto p-4 sm:p-8 scrollbar-thin">
              <div className="flex flex-col items-center justify-center min-w-[760px] mx-auto pb-4">
                
                {/* Root: Top Leader */}
                {topLeader && (
                  <div className="flex flex-col items-center relative">
                    <div className="bg-slate-900 dark:bg-slate-800 text-white p-4 rounded-xl border border-primary/20 shadow-md text-center w-52">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-primary">
                        {topLeader.designation || "Chief Executive"}
                      </span>
                      <h4 className="font-heading font-bold text-sm mt-0.5">{topLeader.name}</h4>
                      <p className="text-[10px] text-slate-300">{topLeader.department || "Executive Board"}</p>
                    </div>
                    {/* Vertical Connector */}
                    <div className="h-10 w-0.5 bg-border mt-2 relative">
                      <ChevronDown className="h-4 w-4 absolute -bottom-2 -left-1.5 text-muted-foreground" />
                    </div>
                  </div>
                )}

                {/* Level 2: Direct Reports / Managers */}
                <div className="flex justify-center gap-12 mt-4 relative w-full flex-wrap">
                  {level2Reportees.map((manager, idx) => {
                    const managerReports = employees.filter(e => e.reportsTo === manager.id);
                    const isEng = manager.department.toLowerCase().includes("eng");
                    const isHr = manager.department.toLowerCase().includes("hr") || manager.department.toLowerCase().includes("human");
                    const badgeColor = isEng 
                      ? "text-emerald-600 dark:text-emerald-400" 
                      : isHr 
                        ? "text-amber-600 dark:text-amber-400" 
                        : "text-indigo-600 dark:text-indigo-400";

                    return (
                      <div key={manager.id || idx} className="flex flex-col items-center">
                        <div className="bg-card p-4 rounded-xl border border-border/60 shadow-sm text-center w-52 hover:border-primary/30 transition-colors">
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${badgeColor}`}>
                            {manager.designation || "Lead"}
                          </span>
                          <h4 className="font-heading font-bold text-sm mt-0.5">{manager.name}</h4>
                          <p className="text-[10px] text-muted-foreground">{manager.department}</p>
                        </div>
                        {/* Vertical Connector */}
                        {managerReports.length > 0 && (
                          <div className="h-10 w-0.5 bg-border mt-2 relative">
                            <ChevronDown className="h-4 w-4 absolute -bottom-2 -left-1.5 text-muted-foreground" />
                          </div>
                        )}

                        {/* Level 3: Reportees under this manager */}
                        {managerReports.length > 0 && (
                          <div className="flex gap-4 mt-4 justify-center flex-wrap max-w-md">
                            {managerReports.map((reportee, rIdx) => (
                              <div key={reportee.id || rIdx} className="bg-muted/30 p-3 rounded-lg border border-border/40 text-center w-40 hover:bg-muted/50 transition-colors">
                                <span className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">
                                  {reportee.designation || "Team Member"}
                                </span>
                                <h5 className="font-heading font-bold text-xs mt-0.5">{reportee.name}</h5>
                                <p className="text-[9px] text-muted-foreground">{reportee.department}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Departments */}
        <TabsContent value="depts" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deptSummary.map((dept) => (
              <Card key={dept.name} className="shadow-sm hover:border-primary/20 transition-colors">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-base m-0">{dept.name}</h3>
                      <span className="text-xs text-muted-foreground">Manager: <span className="font-semibold text-foreground/80">{dept.lead}</span></span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-border/40 pt-3">
                    <span className="text-muted-foreground">Staff Count</span>
                    <Badge variant="secondary" className="font-extrabold">{dept.count} Members</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab 3: Locations */}
        <TabsContent value="locs" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locSummary.map((loc) => (
              <Card key={loc.name} className="shadow-sm hover:border-primary/20 transition-colors">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-base m-0">{loc.name}</h3>
                      <span className="text-xs text-muted-foreground">Office Branch Location</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-border/40 pt-3">
                    <span className="text-muted-foreground">Active Headcount</span>
                    <Badge variant="outline" className="font-extrabold">{loc.count} Staff</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

      </Tabs>

    </div>
  );
}
