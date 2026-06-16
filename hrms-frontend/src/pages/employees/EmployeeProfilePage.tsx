import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useHrmsData } from "@/hooks/useHrmsData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Upload,
  Download,
  Trash2,
  Clock,
  ArrowLeft,
  DollarSign,
  Award,
  CheckCircle,
  FileCheck2,
  CreditCard,
  Plus
} from "lucide-react";

export function EmployeeProfilePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const { employees, updateEmployee, uploadDocument, deleteDocument } = useHrmsData();

  // Find target employee
  // If id is provided, fetch matching employee. Else, match current user email
  const employee = id
    ? employees.find((e) => e.id === id)
    : employees.find((e) => e.email.toLowerCase() === currentUser?.email.toLowerCase());

  const [activeTab, setActiveTab] = useState("personal");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<any>(null);
  
  // Document Upload Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docCategory, setDocCategory] = useState("Contract");

  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Edit contact info state
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editedPhone, setEditedPhone] = useState(employee?.phone || "");
  const [editedLocation, setEditedLocation] = useState(employee?.location || "");

  if (!employee) {
    return (
      <div className="text-center py-20 bg-card border border-border/40 rounded-xl shadow-sm max-w-md mx-auto space-y-4">
        <h3 className="text-lg font-bold">Profile Not Found</h3>
        <p className="text-xs text-muted-foreground">The requested employee record does not exist or has been deleted.</p>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  const handleContactSave = () => {
    updateEmployee(employee.id, {
      phone: editedPhone,
      location: editedLocation,
    });
    setIsEditingContact(false);
  };

  const handleDocumentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formattedSize = formatBytes(selectedFile.size);
    uploadDocument(employee.id, selectedFile.name, docCategory, formattedSize);
    
    // Clear forms
    setSelectedFile(null);
    setDocCategory("Contract");
    setIsUploadOpen(false);
  };

  const isHrOrLeader = currentUser?.role === "HR Admin";
  const isOwnProfile = currentUser?.email.toLowerCase() === employee.email.toLowerCase();

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      
      {/* Back button link if viewing another employee */}
      {id && (
        <Button variant="ghost" size="sm" onClick={() => navigate("/employees")} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Employee List
        </Button>
      )}

      {/* Profile Header Hero Card */}
      <div className="bg-card border border-border/40 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden transition-all duration-300">
        <div className="absolute right-0 top-0 h-full w-1/4 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10">
          <img
            src={employee.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${employee.email}`}
            alt={employee.name}
            className="h-20 w-20 rounded-full object-cover border-4 border-primary/20 shadow-md"
          />
          <div className="text-center sm:text-left space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <h1 className="text-2xl font-heading font-extrabold tracking-tight m-0 text-foreground">
                {employee.name}
              </h1>
              <Badge variant="success" className="w-fit self-center sm:self-auto py-0 px-2 text-[10px]">
                {employee.status}
              </Badge>
            </div>
            <p className="text-sm font-semibold text-primary">{employee.designation}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> {employee.department}</span>
              <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {employee.location}</span>
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Joined {new Date(employee.joiningDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
          </div>
        </div>

        {/* Edit Button if allowed */}
        {isHrOrLeader && (
          <Button
            variant="outline"
            className="h-10 px-4 rounded-lg font-semibold shrink-0 border-border"
            onClick={() => navigate(`/employees/edit/${employee.id}`)}
          >
            Edit Profile
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="personal" className="w-full">
        
        <TabsList className="bg-card/60 backdrop-blur-md p-1 border border-border/40 rounded-xl max-w-2xl">
          <TabsTrigger value="personal" className="flex items-center gap-1.5 text-xs"><User className="h-4 w-4" /> Personal info</TabsTrigger>
          <TabsTrigger value="bank" className="flex items-center gap-1.5 text-xs"><CreditCard className="h-4 w-4" /> Bank details</TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-1.5 text-xs"><FileCheck2 className="h-4 w-4" /> Documents</TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-1.5 text-xs"><Clock className="h-4 w-4" /> Timeline</TabsTrigger>
        </TabsList>

        {/* Tab 1: Personal info */}
        <TabsContent value="personal">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* General details Card */}
            <Card className="md:col-span-2 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Contact & Personal Information</CardTitle>
                  <CardDescription>Details registered in payroll system</CardDescription>
                </div>
                {(isOwnProfile || isHrOrLeader) && !isEditingContact && (
                  <Button variant="ghost" className="h-8 text-xs font-semibold" onClick={() => setIsEditingContact(true)}>
                    Edit Details
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isEditingContact ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Phone Number"
                        value={editedPhone}
                        onChange={(e) => setEditedPhone(e.target.value)}
                      />
                      <Input
                        label="Office Location"
                        value={editedLocation}
                        onChange={(e) => setEditedLocation(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => setIsEditingContact(false)}>Cancel</Button>
                      <Button size="sm" onClick={handleContactSave}>Save Details</Button>
                    </div>
                  </div>
                ) : (
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    <div>
                      <dt className="text-xs font-bold font-heading text-muted-foreground uppercase tracking-wider">Full Legal Name</dt>
                      <dd className="mt-1 font-semibold text-foreground/90">{employee.name}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold font-heading text-muted-foreground uppercase tracking-wider">Email Address</dt>
                      <dd className="mt-1 font-semibold text-foreground/90 font-mono">{employee.email}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold font-heading text-muted-foreground uppercase tracking-wider">Phone</dt>
                      <dd className="mt-1 font-semibold text-foreground/90">{employee.phone || "Not Registered"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold font-heading text-muted-foreground uppercase tracking-wider">Location</dt>
                      <dd className="mt-1 font-semibold text-foreground/90">{employee.location}</dd>
                    </div>
                  </dl>
                )}
              </CardContent>
            </Card>

            {/* Employment Status Summary Card */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Employment Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs text-foreground/95">
                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <span className="font-semibold text-muted-foreground">Employee ID</span>
                  <span className="font-mono font-bold text-primary">{employee.id}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <span className="font-semibold text-muted-foreground">Department</span>
                  <span className="font-semibold">{employee.department}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <span className="font-semibold text-muted-foreground">Designation</span>
                  <span className="font-semibold">{employee.designation}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-semibold text-muted-foreground">System Role</span>
                  <span className="font-semibold"><Badge variant="outline">{employee.role}</Badge></span>
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* Tab 2: Bank details */}
        <TabsContent value="bank">
          <Card className="max-w-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Disbursement Bank Information</CardTitle>
              <CardDescription>Primary bank account for monthly salary credit logs</CardDescription>
            </CardHeader>
            <CardContent>
              {employee.bankName ? (
                <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
                  <div>
                    <dt className="text-xs font-bold font-heading text-muted-foreground uppercase tracking-wider">Bank Name</dt>
                    <dd className="mt-1 font-semibold text-foreground/90">{employee.bankName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold font-heading text-muted-foreground uppercase tracking-wider">Account Number</dt>
                    <dd className="mt-1 font-mono font-semibold text-foreground/90">{employee.accountNo}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold font-heading text-muted-foreground uppercase tracking-wider">IFSC / Routing Code</dt>
                    <dd className="mt-1 font-mono font-semibold text-foreground/90">{employee.ifscCode}</dd>
                  </div>
                </dl>
              ) : (
                <div className="text-center py-6 text-muted-foreground flex flex-col items-center gap-2">
                  <CreditCard className="h-8 w-8 text-muted-foreground/60" />
                  <span className="text-sm font-semibold">No Bank Information Registered</span>
                  <span className="text-xs max-w-xs leading-relaxed">Disbursement coordinates are required for payroll processing. Please edit your profile to add bank details.</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Documents */}
        <TabsContent value="documents">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Documents Locker</CardTitle>
                <CardDescription>Legal contracts, certificates, and payroll documents</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 text-xs h-8.5 font-semibold border-border"
                onClick={() => setIsUploadOpen(true)}
              >
                <Plus className="h-4 w-4" /> Upload Document
              </Button>
            </CardHeader>
            <CardContent>
              {employee.documents && employee.documents.length > 0 ? (
                <div className="divide-y divide-border/40">
                  {employee.documents.map((doc, index) => (
                    <div key={doc.id || (doc as any)._id || index} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded bg-primary/10 text-primary flex items-center justify-center font-heading font-extrabold text-xs shrink-0">
                          {doc.name.split(".").pop()?.toUpperCase() || "PDF"}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-foreground leading-none">{doc.name}</h4>
                          <span className="text-[10px] text-muted-foreground mt-1 block">
                            {doc.category} • Uploaded on {doc.uploadedAt} • {doc.size}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href="#"
                          onClick={(e) => { e.preventDefault(); alert(`Downloading simulated document: ${doc.name}`); }}
                          className="h-8.5 w-8.5 rounded border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                          title="Download Document"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        <button
                          type="button"
                          className="h-8.5 w-8.5 rounded border border-destructive/20 flex items-center justify-center text-destructive hover:bg-destructive/5 transition-colors cursor-pointer"
                          onClick={() => {
                            setDocToDelete(doc);
                            setIsDeleteOpen(true);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground/60" />
                  <span className="text-sm font-semibold">No Documents Uploaded</span>
                  <span className="text-xs">Upload degree certifications, signed NDAs, or ID proofs.</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Timeline */}
        <TabsContent value="timeline">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Personnel Career Timeline</CardTitle>
              <CardDescription>Visual history of organizational changes and uploads</CardDescription>
            </CardHeader>
            <CardContent>
              {employee.timeline && employee.timeline.length > 0 ? (
                <div className="relative border-l border-border/80 ml-3.5 pl-6 space-y-6">
                  {employee.timeline.map((event, index) => {
                    const isJoining = event.type === "joining";
                    const isPromotion = event.type === "promotion";
                    return (
                      <div key={event.id || (event as any)._id || index} className="relative">
                        {/* Bullet Icon */}
                        <span className={`absolute -left-[31px] top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full ring-4 ring-card ${
                          isJoining ? "bg-emerald-500 text-white" :
                          isPromotion ? "bg-amber-500 text-white" : "bg-primary text-white"
                        }`}>
                          {isJoining ? <CheckCircle className="h-3 w-3" /> :
                           isPromotion ? <Award className="h-3 w-3" /> :
                           <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                        </span>
                        <div>
                          <span className="text-[10px] font-bold text-muted-foreground block uppercase font-mono">{event.date}</span>
                          <h4 className="text-sm font-bold mt-1 text-foreground">{event.title}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{event.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <span className="text-sm font-semibold">Timeline Empty</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Simulated Document Upload Modal dialog */}
      <Dialog isOpen={isUploadOpen} onClose={() => { setIsUploadOpen(false); setSelectedFile(null); }}>
        <DialogHeader>
          <DialogTitle>Upload Employee Document</DialogTitle>
          <DialogDescription>Select legal, identity, or credential certificate files to add to this locker.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleDocumentSubmit} className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground font-heading">Choose File / Image</label>
            <div className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-xl p-6 text-center cursor-pointer relative bg-muted/10 group">
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
                required
              />
              <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary mx-auto mb-2 transition-colors" />
              {selectedFile ? (
                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-foreground truncate max-w-[280px] mx-auto">{selectedFile.name}</p>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase">{formatBytes(selectedFile.size)}</p>
                </div>
              ) : (
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground/80">Click or drag file here to select</p>
                  <p className="text-[10px]">PDF, PNG, JPG, or DOCX (max 10MB)</p>
                </div>
              )}
            </div>
          </div>
          <Select
            label="Category"
            value={docCategory}
            onChange={(e) => setDocCategory(e.target.value)}
            options={[
              { value: "Contract", label: "Employment Contract" },
              { value: "Legal", label: "Legal (NDA, Policies)" },
              { value: "Education", label: "Education & Degree Certificates" },
              { value: "Identity", label: "Government ID Proofs" },
              { value: "Other", label: "Other Attachments" },
            ]}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setIsUploadOpen(false); setSelectedFile(null); }}>Cancel</Button>
            <Button type="submit">Upload Document</Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog isOpen={isDeleteOpen} onClose={() => { setIsDeleteOpen(false); setDocToDelete(null); }}>
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
            <Trash2 className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl font-bold font-heading text-destructive">
            Delete Document
          </DialogTitle>
          <DialogDescription className="text-center text-sm mt-2">
            Are you sure you want to delete <span className="font-semibold text-foreground">{docToDelete?.name}</span>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => { setIsDeleteOpen(false); setDocToDelete(null); }}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              if (docToDelete) {
                deleteDocument(employee.id, docToDelete._id || docToDelete.id);
              }
              setIsDeleteOpen(false);
              setDocToDelete(null);
            }} 
            className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 text-white font-semibold border-0"
          >
            Yes, Delete
          </Button>
        </DialogFooter>
      </Dialog>

    </div>
  );
}
