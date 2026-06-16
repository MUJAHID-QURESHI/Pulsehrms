import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Bell,
  CheckCheck,
  CalendarDays,
  Clock,
  ShieldCheck,
  Settings,
  Mail,
  Smartphone,
  Info
} from "lucide-react";
import { useHrmsData } from "@/hooks/useHrmsData";

export function Notifications() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useHrmsData();
  const [activeTab, setActiveTab] = useState("all");

  // Preferences toggles state
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [pushAlerts, setPushAlerts] = useState(true);

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
  };

  const handleMarkSingleRead = (id: string) => {
    markNotificationRead(id);
  };

  // Filter logs
  const filteredNotifications = notifications.filter((notif) => {
    if (activeTab === "all") return true;
    return notif.category === activeTab;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight m-0 text-foreground">
            Notification Center
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage alerts, updates regarding workflows, and toggle notification delivery channels.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 h-10 px-4 rounded-lg font-semibold border-border"
          >
            <CheckCheck className="h-4.5 w-4.5" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Grid: Notifications List on Left, Preferences on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Notifications list */}
        <div className="lg:col-span-8 space-y-4">
          <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-card/60 backdrop-blur-md p-1 border border-border/40 rounded-xl">
              <TabsTrigger value="all" className="text-xs">All Alerts</TabsTrigger>
              <TabsTrigger value="leave" className="text-xs">Leaves</TabsTrigger>
              <TabsTrigger value="attendance" className="text-xs">Attendance</TabsTrigger>
              <TabsTrigger value="system" className="text-xs">System</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4 space-y-3">
              {filteredNotifications.length === 0 ? (
                <Card className="text-center py-16 text-muted-foreground border border-border/40 bg-card/60 backdrop-blur-sm">
                  <Info className="h-9 w-9 text-muted-foreground/60 mx-auto mb-2" />
                  <p className="text-sm font-semibold">No Notifications Found</p>
                  <p className="text-xs">You are completely up to date.</p>
                </Card>
              ) : (
                filteredNotifications.map((notif) => {
                  const isLeave = notif.category === "leave";
                  const isAtt = notif.category === "attendance";
                  
                  return (
                    <Card key={notif._id} className={`hover:border-primary/10 transition-all ${!notif.isRead && "border-l-4 border-l-primary"}`}>
                      <CardContent className="pt-5 pb-5 flex gap-4 items-start">
                        {/* Category icon */}
                        <div className={`h-9.5 w-9.5 rounded-lg flex items-center justify-center shrink-0 ${
                          isLeave ? "bg-sky-500/10 text-sky-600" :
                          isAtt ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary"
                        }`}>
                          {isLeave ? <CalendarDays className="h-4.5 w-4.5" /> :
                           isAtt ? <Clock className="h-4.5 w-4.5" /> : <Bell className="h-4.5 w-4.5" />}
                        </div>

                        {/* Text contents */}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-4">
                            <h4 className="text-xs font-bold text-foreground m-0">{notif.title}</h4>
                            <span className="text-[10px] text-muted-foreground font-semibold">{notif.time}</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{notif.message}</p>
                        </div>

                        {/* Read dot button */}
                        {!notif.isRead && (
                          <button
                            onClick={() => handleMarkSingleRead(notif._id)}
                            className="h-2 w-2 rounded-full bg-primary hover:scale-125 transition-transform shrink-0 mt-1.5 cursor-pointer"
                            title="Mark as read"
                          />
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Preferences panel */}
        <div className="lg:col-span-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings className="h-4.5 w-4.5 text-muted-foreground" /> Alert Preferences</CardTitle>
              <CardDescription>Configure delivery channels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Email channel */}
              <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex gap-2 items-center">
                  <Mail className="h-4.5 w-4.5 text-primary" />
                  <div className="flex flex-col text-xs">
                    <span className="font-semibold">Email Alerts</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">Time-off approvals details</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                />
              </div>

              {/* SMS channel */}
              <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex gap-2 items-center">
                  <Smartphone className="h-4.5 w-4.5 text-emerald-500" />
                  <div className="flex flex-col text-xs">
                    <span className="font-semibold">SMS Alerts</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">Urgent shift regularization</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={smsAlerts}
                  onChange={(e) => setSmsAlerts(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                />
              </div>

              {/* Browser Push channel */}
              <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex gap-2 items-center">
                  <Bell className="h-4.5 w-4.5 text-primary" />
                  <div className="flex flex-col text-xs">
                    <span className="font-semibold">Desktop Push</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">Real-time chat alerts</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={pushAlerts}
                  onChange={(e) => setPushAlerts(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                />
              </div>

              <Button className="w-full text-xs h-9 font-semibold" onClick={() => alert("Notification settings saved successfully.")}>
                Save Delivery Channels
              </Button>

            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
