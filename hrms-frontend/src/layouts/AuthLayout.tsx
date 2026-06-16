import React from "react";
import { Outlet } from "react-router-dom";
import { Activity } from "lucide-react";

export function AuthLayout() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background transition-colors duration-300">
      {/* Branding Column - Hidden on mobile */}
      <div className="hidden lg:flex lg:col-span-7 xl:col-span-8 relative bg-gradient-to-tr from-indigo-900 via-violet-950 to-slate-950 items-center justify-center p-12 overflow-hidden border-r border-border/10">
        {/* Animated ambient light blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "1.5s" }} />

        <div className="relative z-10 max-w-lg flex flex-col gap-8 text-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/40">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <span className="font-heading font-bold text-2xl tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-100 bg-clip-text text-transparent">
              PulseHRMS
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-heading font-bold leading-tight tracking-tight text-white m-0">
              Simplify payroll, culture, and talent in one workspace.
            </h1>
            <p className="text-lg text-indigo-200/80 leading-relaxed font-light">
              Experience the future of employee management. Real-time clock-ins, smart auto-regularization, and insights designed for growth.
            </p>
          </div>

          {/* Testimonial widget card */}
          <div className="glass p-6 rounded-2xl shadow-xl shadow-black/10 border border-white/10 mt-4 animate-slide-in">
            <p className="text-sm italic text-indigo-100/90 leading-relaxed">
              "PulseHRMS transformed our HR workflow completely. Scheduling, team attendance, and leave requests that used to take days now happen automatically in minutes."
            </p>
            <div className="flex items-center gap-3 mt-4">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=80"
                alt="Elena Rostova"
                className="h-10 w-10 rounded-full object-cover border border-white/20"
              />
              <div>
                <h4 className="text-sm font-semibold text-white">Elena Rostova</h4>
                <p className="text-xs text-indigo-300">CEO, Rostova Consulting</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Column */}
      <div className="col-span-1 lg:col-span-5 xl:col-span-4 flex items-center justify-center p-6 sm:p-12 relative">
        {/* Ambient background blur for mobile */}
        <div className="absolute top-10 right-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl lg:hidden pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl lg:hidden pointer-events-none" />

        <div className="w-full max-w-md animate-fade-in relative z-10">
          <div className="flex justify-center mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="font-heading font-bold text-xl tracking-tight text-foreground">
                PulseHRMS
              </span>
            </div>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
}
