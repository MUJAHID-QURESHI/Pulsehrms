import React, { useState } from "react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useHrmsData } from "@/hooks/useHrmsData";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Menu,
  X,
  Bell,
  Sun,
  Moon,
  LogOut,
  LayoutDashboard,
  Users,
  Clock,
  CalendarCheck,
  Building2,
  FileBarChart2,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  User,
  Activity,
  Briefcase,
  AlertTriangle,
  FileText
} from "lucide-react";
import { cn } from "@/utils/cn";
import type { UserRole } from "@/types";
import { AICopilot } from "@/components/AICopilot";

// Side navigation structure with roles
interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  roles: UserRole[];
  category: "General" | "My Pulse" | "Management" | "Administration" | "System";
}

const NAV_ITEMS: NavItem[] = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    roles: ["Employee", "Manager", "HR Admin"],
    category: "General",
  },
  // Employee Self Service
  {
    name: "My Profile",
    path: "/profile",
    icon: User,
    roles: ["Employee", "Manager", "HR Admin"],
    category: "My Pulse",
  },
  {
    name: "My Attendance",
    path: "/my-attendance",
    icon: Clock,
    roles: ["Employee", "Manager", "HR Admin"],
    category: "My Pulse",
  },
  {
    name: "Apply Leave",
    path: "/apply-leave",
    icon: CalendarCheck,
    roles: ["Employee", "Manager", "HR Admin"],
    category: "My Pulse",
  },
  {
    name: "My Documents",
    path: "/my-documents",
    icon: FileText,
    roles: ["Employee", "Manager", "HR Admin"],
    category: "My Pulse",
  },
  // Manager
  {
    name: "Team Directory",
    path: "/team",
    icon: Users,
    roles: ["Manager", "HR Admin"],
    category: "Management",
  },
  {
    name: "Pending Approvals",
    path: "/approvals",
    icon: ShieldCheck,
    roles: ["Manager", "HR Admin"],
    category: "Management",
  },
  // Admin Operations
  {
    name: "Employees",
    path: "/employees",
    icon: Users,
    roles: ["HR Admin"],
    category: "Administration",
  },
  {
    name: "Organization",
    path: "/organization",
    icon: Building2,
    roles: ["HR Admin"],
    category: "Administration",
  },
  {
    name: "Reports",
    path: "/reports",
    icon: FileBarChart2,
    roles: ["HR Admin"],
    category: "Administration",
  },
  // Settings
  {
    name: "Settings",
    path: "/settings",
    icon: Settings,
    roles: ["HR Admin"],
    category: "System",
  },
];

export function MainLayout() {
  const { user, logout, switchRole } = useAuth();
  const { notifications, markAllNotificationsRead } = useHrmsData();
  const { theme, toggleTheme } = useTheme();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  // Filter items by role
  const filteredNavItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(user.role)
  );

  // Group Nav Items by Category
  const categories = Array.from(new Set(filteredNavItems.map(item => item.category))) as NavItem["category"][];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Generate breadcrumbs from location
  const pathnames = location.pathname.split("/").filter((x) => x);
  const breadcrumbs = pathnames.map((name, index) => {
    const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
    const isLast = index === pathnames.length - 1;
    const displayName = name.charAt(0).toUpperCase() + name.slice(1).replace("-", " ");
    return { displayName, routeTo, isLast };
  });

  // Live Notifications List
  const unreadNotifications = notifications.filter((n: any) => !n.isRead);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-950 text-slate-100 border-r border-slate-900 transition-all duration-300 lg:static",
          {
            "w-64": !isSidebarCollapsed,
            "w-20": isSidebarCollapsed,
            "translate-x-0": isMobileSidebarOpen,
            "-translate-x-full lg:translate-x-0": !isMobileSidebarOpen,
          },
          isAiOpen && "blur-[2px] pointer-events-none opacity-85 transition-all duration-300"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-900">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/40">
              <Activity className="h-5 w-5 text-white" />
            </div>
            {(!isSidebarCollapsed || isMobileSidebarOpen) && (
              <span className="font-heading font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                PulseHRMS
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-900"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {categories.map((category) => (
            <div key={category} className="space-y-1">
              {(!isSidebarCollapsed || isMobileSidebarOpen) && (
                <p className="text-xs font-semibold text-slate-500 font-heading uppercase tracking-wider px-3 mb-2">
                  {category}
                </p>
              )}
              {filteredNavItems
                .filter((item) => item.category === category)
                .map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group duration-150",
                        isActive
                          ? "bg-primary text-white shadow-md shadow-primary/20"
                          : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60"
                      )}
                    >
                      <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200")} />
                      {(!isSidebarCollapsed || isMobileSidebarOpen) && (
                        <span>{item.name}</span>
                      )}
                    </Link>
                  );
                })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer collapse toggler */}
        <div className="hidden lg:flex p-4 border-t border-slate-900">
          <Button
            variant="ghost"
            className="w-full text-slate-400 hover:text-white hover:bg-slate-900/60 flex items-center justify-center gap-2"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span className="text-xs font-heading">Collapse Menu</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Main Content Area Wrapper */}
      <div 
        className={cn(
          "flex-1 flex flex-col overflow-hidden",
          isAiOpen && "blur-[2px] pointer-events-none opacity-85 transition-all duration-300"
        )}
      >
        
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-border/40 bg-card/60 backdrop-blur-md z-30 transition-all duration-300">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Breadcrumbs */}
            <div className="hidden sm:flex items-center space-x-1.5 text-xs text-muted-foreground font-medium">
              <Link to="/dashboard" className="hover:text-foreground">Home</Link>
              {breadcrumbs.map((crumb) => (
                <React.Fragment key={crumb.routeTo}>
                  <span className="text-muted-foreground/40">/</span>
                  <Link
                    to={crumb.routeTo}
                    className={cn(
                      crumb.isLast ? "text-foreground font-semibold" : "hover:text-foreground"
                    )}
                  >
                    {crumb.displayName}
                  </Link>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-3 relative">
            
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full w-9 h-9"
              onClick={toggleTheme}
              title="Toggle Theme"
            >
              {theme === "light" ? (
                <Moon className="h-4.5 w-4.5" />
              ) : (
                <Sun className="h-4.5 w-4.5 text-amber-400" />
              )}
            </Button>

            {/* Notifications Dropdown Toggle */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full w-9 h-9 relative"
                onClick={() => {
                  setIsNotificationOpen(!isNotificationOpen);
                  setIsProfileOpen(false);
                }}
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadNotifications.length > 0 && (
                  <>
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive animate-ping" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
                  </>
                )}
              </Button>

              {/* Notifications Dropdown Panel */}
              {isNotificationOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotificationOpen(false)} />
                  <div className="absolute right-0 mt-2.5 w-80 rounded-xl border border-border bg-card p-4 shadow-lg z-50 animate-slide-in">
                    <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-2">
                      <span className="font-heading font-semibold text-sm">Notifications</span>
                      {unreadNotifications.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Badge variant="success" className="text-[10px] py-0 px-1.5">{unreadNotifications.length} New</Badge>
                          <button 
                            onClick={() => markAllNotificationsRead()} 
                            className="text-[10px] text-primary font-semibold hover:underline bg-transparent border-0 cursor-pointer"
                          >
                            Mark all read
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {unreadNotifications.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">No new notifications</p>
                      ) : (
                        unreadNotifications.map((notif: any) => (
                          <div key={notif._id} className="flex gap-2.5 items-start text-xs text-foreground/80 hover:bg-muted/30 p-1.5 rounded transition-colors">
                            <div className={cn(
                              "h-2 w-2 rounded-full mt-1.5 shrink-0",
                              notif.category === "attendance" && "bg-emerald-500",
                              notif.category === "leave" && "bg-sky-500",
                              notif.category === "system" && "bg-primary"
                            )} />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold leading-tight text-foreground truncate">{notif.title}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{notif.message}</p>
                              <span className="text-[9px] text-muted-foreground/80 mt-1 block font-medium">{notif.time}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="border-t border-border/40 pt-2 mt-3 text-center">
                      <button className="text-[11px] text-primary font-semibold hover:underline bg-transparent" onClick={() => { setIsNotificationOpen(false); navigate("/notifications"); }}>
                        View All Notifications
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown Toggle */}
            <div className="relative">
              <button
                className="flex items-center gap-2 focus:outline-none cursor-pointer group"
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotificationOpen(false);
                }}
              >
                <img
                  src={user.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120"}
                  alt={user.name}
                  className="h-8.5 w-8.5 rounded-full object-cover border-2 border-primary/20 group-hover:border-primary/60 transition-colors"
                />
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-semibold leading-none text-foreground">{user.name}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">{user.role}</span>
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                  <div className="absolute right-0 mt-2.5 w-60 rounded-xl border border-border bg-card p-4 shadow-lg z-50 animate-slide-in">
                    
                    {/* User Info */}
                    <div className="flex items-center gap-3 border-b border-border/40 pb-3 mb-3">
                      <img
                        src={user.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120"}
                        alt={user.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-semibold leading-none">{user.name}</span>
                        <span className="text-xs text-muted-foreground mt-1">{user.designation}</span>
                      </div>
                    </div>


                    {/* Menu Items */}
                    <div className="space-y-1">
                      <button
                        onClick={() => { setIsProfileOpen(false); navigate("/profile"); }}
                        className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-muted/50 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <User className="h-4 w-4 text-muted-foreground" />
                        My Profile Settings
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-2 py-1.5 text-xs text-destructive rounded hover:bg-destructive/5 transition-colors flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>

                  </div>
                </>
              )}
            </div>

          </div>
        </header>

        {/* Scrollable page body viewport */}
        <main className="flex-1 overflow-y-auto p-6 bg-background/50">
          <Outlet />
        </main>

      </div>
      <AICopilot onToggle={setIsAiOpen} />
    </div>
  );
}
