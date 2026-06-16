import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { AlertCircle, ArrowLeft } from "lucide-react";

export function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="h-16 w-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-6">
        <AlertCircle className="h-10 w-10" />
      </div>
      <h1 className="text-4xl font-heading font-extrabold tracking-tight m-0 text-foreground">
        404 - Page Not Found
      </h1>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-relaxed">
        The workspace section you are trying to access doesn't exist or is currently under construction for this role.
      </p>
      <Button
        className="mt-6 flex items-center gap-2"
        onClick={() => navigate("/dashboard")}
      >
        <ArrowLeft className="h-4 w-4" />
        Return to Dashboard
      </Button>
    </div>
  );
}
