import React, { createContext, useContext, useEffect, useState } from "react";
import type { User, UserRole } from "@/types";
import { api } from "@/utils/api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_EMAILS: Record<UserRole, string> = {
  "HR Admin": "admin@company.com",
  "Manager": "manager@company.com",
  "Employee": "employee@company.com",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session on mount from backend
    const checkSession = async () => {
      const token = localStorage.getItem("hrms-token");
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const data = await api.get<{ user: User }>(`/auth/me`);
        setUser(data.user);
      } catch (err) {
        console.error("Session restore failed:", err);
        localStorage.removeItem("hrms-token");
        localStorage.removeItem("hrms-session");
        localStorage.removeItem("hrms-employeeId");
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const data = await api.post<{ token: string; user: User; employeeId: string | null }>(
        "/auth/login",
        { email, password }
      );
      
      localStorage.setItem("hrms-token", data.token);
      localStorage.setItem("hrms-session", JSON.stringify(data.user));
      if (data.employeeId) {
        localStorage.setItem("hrms-employeeId", data.employeeId);
      } else {
        localStorage.removeItem("hrms-employeeId");
      }
      
      setUser(data.user);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error("Login failed:", err);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("hrms-token");
    localStorage.removeItem("hrms-session");
    localStorage.removeItem("hrms-employeeId");
    localStorage.removeItem("hrms-punch-status");
  };

  const switchRole = async (role: UserRole) => {
    const email = ROLE_EMAILS[role];
    if (email) {
      // Perform programmatic login for the selected role using seeded password
      await login(email, "password123");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
