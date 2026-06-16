import React, { createContext, useContext, useState, useEffect } from "react";
import type { Employee, LeaveRequest, Payslip, EmployeeDoc } from "@/types";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

interface HrmsDataContextType {
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  payslips: Payslip[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
  addEmployee: (employee: Omit<Employee, "id" | "documents" | "timeline">) => Promise<void>;
  updateEmployee: (id: string, updatedData: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  applyLeave: (request: Omit<LeaveRequest, "id" | "employeeId" | "employeeName" | "appliedAt" | "status">, employeeId: string, employeeName: string) => Promise<void>;
  approveLeave: (id: string) => Promise<void>;
  rejectLeave: (id: string) => Promise<void>;
  uploadDocument: (employeeId: string, docName: string, category: string, size: string) => Promise<void>;
  deleteDocument: (employeeId: string, docId: string) => Promise<void>;
  notifications: any[];
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const HrmsDataContext = createContext<HrmsDataContextType | undefined>(undefined);

const INITIAL_PAYSLIPS: Payslip[] = [
  {
    id: "PAY-2026-05",
    month: "May",
    year: 2026,
    basic: 4000,
    hra: 1200,
    allowance: 800,
    pf: 480,
    tax: 620,
    netPay: 4900,
  },
  {
    id: "PAY-2026-04",
    month: "April",
    year: 2026,
    basic: 4000,
    hra: 1200,
    allowance: 800,
    pf: 480,
    tax: 620,
    netPay: 4900,
  },
  {
    id: "PAY-2026-03",
    month: "March",
    year: 2026,
    basic: 4000,
    hra: 1200,
    allowance: 800,
    pf: 480,
    tax: 620,
    netPay: 4900,
  },
];

export function HrmsDataProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [payslips] = useState<Payslip[]>(INITIAL_PAYSLIPS);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.get<any[]>("/notifications");
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const refreshData = async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const [empData, leaveData, notifData] = await Promise.all([
        api.get<Employee[]>("/employees"),
        api.get<LeaveRequest[]>("/leaves"),
        api.get<any[]>("/notifications"),
      ]);
      setEmployees(empData);
      setLeaveRequests(leaveData);
      setNotifications(notifData);
    } catch (error) {
      console.error("Failed to load HRMS data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync data from backend when authenticated session changes
  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    } else {
      setEmployees([]);
      setLeaveRequests([]);
      setNotifications([]);
    }
  }, [isAuthenticated]);

  // CRUD Actions
  const addEmployee = async (empData: Omit<Employee, "id" | "documents" | "timeline">) => {
    try {
      const newEmp = await api.post<Employee>("/employees", empData);
      setEmployees((prev) => [...prev, newEmp]);
    } catch (error) {
      console.error("Add employee failed:", error);
      alert(error instanceof Error ? error.message : "Failed to add employee");
      throw error;
    }
  };

  const updateEmployee = async (id: string, updatedData: Partial<Employee>) => {
    try {
      const updatedEmp = await api.put<Employee>(`/employees/${id}`, updatedData);
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === id ? updatedEmp : emp))
      );
    } catch (error) {
      console.error("Update employee failed:", error);
      alert(error instanceof Error ? error.message : "Failed to update employee");
      throw error;
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      await api.delete(`/employees/${id}`);
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
    } catch (error) {
      console.error("Delete employee failed:", error);
      alert(error instanceof Error ? error.message : "Failed to delete employee");
      throw error;
    }
  };

  const applyLeave = async (
    request: Omit<LeaveRequest, "id" | "employeeId" | "employeeName" | "appliedAt" | "status">,
    _employeeId: string,
    _employeeName: string
  ) => {
    try {
      const newReq = await api.post<LeaveRequest>("/leaves", request);
      setLeaveRequests((prev) => [newReq, ...prev]);
    } catch (error) {
      console.error("Apply leave failed:", error);
      alert(error instanceof Error ? error.message : "Failed to apply leave");
      throw error;
    }
  };

  const approveLeave = async (id: string) => {
    try {
      const updatedReq = await api.put<LeaveRequest>(`/leaves/${id}/status`, { status: "Approved" });
      setLeaveRequests((prev) =>
        prev.map((req) => (req._id === id || req.id === id ? updatedReq : req))
      );
    } catch (error) {
      console.error("Approve leave failed:", error);
      alert(error instanceof Error ? error.message : "Failed to approve leave");
    }
  };

  const rejectLeave = async (id: string) => {
    try {
      const updatedReq = await api.put<LeaveRequest>(`/leaves/${id}/status`, { status: "Rejected" });
      setLeaveRequests((prev) =>
        prev.map((req) => (req._id === id || req.id === id ? updatedReq : req))
      );
    } catch (error) {
      console.error("Reject leave failed:", error);
      alert(error instanceof Error ? error.message : "Failed to reject leave");
    }
  };

  const uploadDocument = async (employeeId: string, docName: string, category: string, size: string) => {
    try {
      const updatedEmp = await api.post<Employee>(`/employees/${employeeId}/documents`, {
        name: docName,
        category,
        size,
      });
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === employeeId ? updatedEmp : emp))
      );
    } catch (error) {
      console.error("Upload document failed:", error);
      alert(error instanceof Error ? error.message : "Failed to upload document");
    }
  };

  const deleteDocument = async (employeeId: string, docId: string) => {
    try {
      const updatedEmp = await api.delete<Employee>(`/employees/${employeeId}/documents/${docId}`);
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === employeeId ? updatedEmp : emp))
      );
    } catch (error) {
      console.error("Delete document failed:", error);
      alert(error instanceof Error ? error.message : "Failed to delete document");
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      const updatedNotif = await api.put<any>(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? updatedNotif : n))
      );
    } catch (error) {
      console.error("Failed to mark notification read:", error);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
    } catch (error) {
      console.error("Failed to mark all notifications read:", error);
    }
  };

  return (
    <HrmsDataContext.Provider
      value={{
        employees,
        leaveRequests,
        payslips,
        isLoading,
        refreshData,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        applyLeave,
        approveLeave,
        rejectLeave,
        uploadDocument,
        deleteDocument,
        notifications,
        fetchNotifications,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </HrmsDataContext.Provider>
  );
}

export function useHrmsData() {
  const context = useContext(HrmsDataContext);
  if (!context) {
    throw new Error("useHrmsData must be used within an HrmsDataProvider");
  }
  return context;
}
