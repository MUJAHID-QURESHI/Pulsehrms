import React, { useState } from "react";
import { useHrmsData } from "@/hooks/useHrmsData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog";
import { FileText, Download, Eye, CreditCard, Building } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { Payslip } from "@/types";

export function MyDocuments() {
  const { payslips } = useHrmsData();
  const { user } = useAuth();
  
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDownload = (pay: Payslip) => {
    alert(`Downloading simulated PDF file: Payslip_${pay.month}_${pay.year}.pdf`);
  };

  const handleOpenBreakdown = (pay: Payslip) => {
    setSelectedPayslip(pay);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-heading font-extrabold tracking-tight m-0 text-foreground">
          My Documents & Payslips
        </h1>
        <p className="text-sm text-muted-foreground">
          View your legal employment documents, download monthly payslips, and check salary credit logs.
        </p>
      </div>

      {/* Grid containing Documents List and Payslips Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Payslips Log */}
        <div className="lg:col-span-8">
          <Card className="shadow-sm overflow-hidden h-full">
            <CardHeader>
              <CardTitle>Payslips Archive</CardTitle>
              <CardDescription>Monthly salary disbursements statements</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Statement Period</TableHead>
                    <TableHead>Salary Disbursed</TableHead>
                    <TableHead>Tax Deductions</TableHead>
                    <TableHead>Net Credit</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payslips.map((pay) => (
                    <TableRow key={pay.id}>
                      <TableCell className="font-semibold">{pay.month} {pay.year}</TableCell>
                      <TableCell className="font-mono text-xs">${pay.basic + pay.hra + pay.allowance}</TableCell>
                      <TableCell className="font-mono text-xs text-destructive">-${pay.pf + pay.tax}</TableCell>
                      <TableCell className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">${pay.netPay}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8.5 w-8.5 p-0"
                            onClick={() => handleOpenBreakdown(pay)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8.5 w-8.5 p-0"
                            onClick={() => handleDownload(pay)}
                            title="Download PDF Statement"
                          >
                            <Download className="h-4 w-4 text-primary" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Company Policies Locker */}
        <div className="lg:col-span-4">
          <Card className="shadow-sm h-full">
            <CardHeader>
              <CardTitle>Company Guidelines</CardTitle>
              <CardDescription>Official handbooks and policy documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "Employee_Handbook_2026.pdf", category: "Policies", size: "3.2 MB" },
                { name: "IT_Security_Compliance.pdf", category: "Security", size: "1.5 MB" },
                { name: "Leaves_Benefits_Structure.pdf", category: "Benefits", size: "940 KB" },
              ].map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 rounded-lg border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex gap-2.5 items-start">
                    <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="truncate max-w-[160px]">
                      <h4 className="text-xs font-semibold text-foreground truncate leading-none mb-1">{doc.name}</h4>
                      <span className="text-[10px] text-muted-foreground">{doc.category} • {doc.size}</span>
                    </div>
                  </div>
                  <button
                    className="h-7 w-7 rounded-full border border-border/60 hover:border-primary/50 text-muted-foreground hover:text-primary flex items-center justify-center cursor-pointer transition-colors bg-background"
                    onClick={() => alert(`Downloading policy file: ${doc.name}`)}
                    title="Download Guidelines"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Salary credit invoice breakdown modal */}
      <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {selectedPayslip && (
          <>
            <DialogHeader>
              <DialogTitle>Salary Statement Breakdown</DialogTitle>
              <DialogDescription>Invoice statement for {selectedPayslip.month} {selectedPayslip.year}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4 text-xs">
              
              {/* Employer Header */}
              <div className="flex justify-between items-start pb-4 border-b border-border/40">
                <div className="space-y-1">
                  <h3 className="font-heading font-extrabold text-sm text-primary flex items-center gap-1.5"><Building className="h-4.5 w-4.5" /> PulseHRMS Inc.</h3>
                  <span className="text-muted-foreground block text-[10px]">Chicago HQ, Illinois, USA</span>
                </div>
                <div className="text-right">
                  <Badge variant="success">Statement Released</Badge>
                  <span className="text-muted-foreground block text-[10px] mt-1 font-mono">ID: {selectedPayslip.id}</span>
                </div>
              </div>

              {/* Employee Header details */}
              <div className="grid grid-cols-2 gap-3 bg-muted/25 p-3 rounded-lg border border-border/40">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block font-heading">Employee Name</span>
                  <span className="font-bold text-foreground mt-0.5 block">{user?.name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block font-heading">Designation</span>
                  <span className="font-semibold text-foreground mt-0.5 block">{user?.designation}</span>
                </div>
              </div>

              {/* Earnings Table vs Deductions Table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                {/* Earnings */}
                <div className="space-y-2">
                  <h4 className="font-bold font-heading text-foreground/80 border-b border-border/40 pb-1 uppercase tracking-wide text-[10px]">Earnings (USD)</h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Basic Salary</span>
                      <span className="font-mono font-semibold">${selectedPayslip.basic}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">HRA Allowance</span>
                      <span className="font-mono font-semibold">${selectedPayslip.hra}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Special Allowances</span>
                      <span className="font-mono font-semibold">${selectedPayslip.allowance}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-border/40 pt-1.5">
                      <span>Gross Salary</span>
                      <span className="font-mono text-primary">${selectedPayslip.basic + selectedPayslip.hra + selectedPayslip.allowance}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-2">
                  <h4 className="font-bold font-heading text-foreground/80 border-b border-border/40 pb-1 uppercase tracking-wide text-[10px]">Deductions (USD)</h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Provident Fund (PF)</span>
                      <span className="font-mono text-destructive">-${selectedPayslip.pf}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Income Tax (TDS)</span>
                      <span className="font-mono text-destructive">-${selectedPayslip.tax}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-border/40 pt-1.5 mt-4">
                      <span>Total Deductions</span>
                      <span className="font-mono text-destructive">-${selectedPayslip.pf + selectedPayslip.tax}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Final Credit payout */}
              <div className="bg-emerald-500/5 border border-emerald-500/15 p-4 rounded-xl flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block font-heading">Net Credit Amount</span>
                    <span className="text-[9px] text-muted-foreground">Credited to registered Bank account</span>
                  </div>
                </div>
                <span className="text-xl font-heading font-extrabold text-emerald-600 dark:text-emerald-400">${selectedPayslip.netPay}</span>
              </div>

            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Close Statement</Button>
              <Button onClick={() => handleDownload(selectedPayslip)} className="flex items-center gap-1.5 font-semibold">
                <Download className="h-4 w-4" /> Download PDF Statement
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>

    </div>
  );
}
