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

  // Aggregate department counts
  const deptSummary = Array.from(new Set(employees.map((e) => e.department))).map((dept) => {
    const members = employees.filter((e) => e.department === dept);
    const lead = employees.find((e) => e.department === dept && (e.role === "Manager" || e.role === "HR Admin"));
    return { name: dept, count: members.length, lead: lead ? lead.name : "N/A" };
  });

  // Aggregate location counts
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
      <Tabs defaultValue="chart" className="w-full">
        
        <TabsList className="bg-card/60 backdrop-blur-md p-1 border border-border/40 rounded-xl max-w-md">
          <TabsTrigger value="chart" className="flex items-center gap-1.5 text-xs">
            <GitMerge className="h-4 w-4 text-primary" /> Visual Org Chart
          </TabsTrigger>
          <TabsTrigger value="depts" className="flex items-center gap-1.5 text-xs">
            <Building2 className="h-4 w-4 text-emerald-500" /> Departments
          </TabsTrigger>
          <TabsTrigger value="locs" className="flex items-center gap-1.5 text-xs">
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
            <CardContent className="flex flex-col items-center justify-center p-8 overflow-x-auto min-w-[700px]">
              
              {/* Root: CEO */}
              <div className="flex flex-col items-center relative">
                <div className="bg-slate-900 dark:bg-slate-800 text-white p-4 rounded-xl border border-primary/20 shadow-md text-center w-52">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-primary">Chief Executive</span>
                  <h4 className="font-heading font-bold text-sm mt-0.5">Elena Rostova</h4>
                  <p className="text-[10px] text-slate-300">Executive Board</p>
                </div>
                {/* Vertical Connector */}
                <div className="h-10 w-0.5 bg-border mt-2 relative">
                  <ChevronDown className="h-4 w-4 absolute -bottom-2 -left-1.5 text-muted-foreground" />
                </div>
              </div>

              {/* Level 2: Managers / Admin */}
              <div className="flex justify-center gap-12 mt-4 relative w-full">
                
                {/* Manager Column */}
                <div className="flex flex-col items-center">
                  <div className="bg-card p-4 rounded-xl border border-border/60 shadow-sm text-center w-52 hover:border-primary/30 transition-colors">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Engineering Lead</span>
                    <h4 className="font-heading font-bold text-sm mt-0.5">Marcus Sterling</h4>
                    <p className="text-[10px] text-muted-foreground">Engineering Dept</p>
                  </div>
                  {/* Vertical Connector */}
                  <div className="h-10 w-0.5 bg-border mt-2 relative">
                    <ChevronDown className="h-4 w-4 absolute -bottom-2 -left-1.5 text-muted-foreground" />
                  </div>

                  {/* Level 3: Engineering Team Reportees */}
                  <div className="flex gap-4 mt-4 justify-center">
                    {[
                      { name: "David Vance", role: "Software Engineer" },
                      { name: "Anna Kovach", role: "UI Designer" },
                      { name: "Jared Leto", role: "QA Engineer" },
                    ].map((eng, idx) => (
                      <div key={idx} className="bg-muted/30 p-3 rounded-lg border border-border/40 text-center w-40 hover:bg-muted/50 transition-colors">
                        <span className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">Developer</span>
                        <h5 className="font-heading font-bold text-xs mt-0.5">{eng.name}</h5>
                        <p className="text-[9px] text-muted-foreground">{eng.role}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* HR Admin Column (Adjacent node) */}
                <div className="flex flex-col items-center">
                  <div className="bg-card p-4 rounded-xl border border-border/60 shadow-sm text-center w-52 hover:border-primary/30 transition-colors">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">HR Director</span>
                    <h4 className="font-heading font-bold text-sm mt-0.5">Sarah Jenkins</h4>
                    <p className="text-[10px] text-muted-foreground">Human Resources</p>
                  </div>
                  <div className="h-6 w-0.5 bg-dashed border-l border-muted-foreground/30 mt-2" />
                  <span className="text-[9px] text-muted-foreground italic mt-2">Dotted reporting to CEO</span>
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
