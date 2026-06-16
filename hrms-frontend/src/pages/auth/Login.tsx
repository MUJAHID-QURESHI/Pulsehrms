import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Eye, EyeOff, Mail, Lock, Shield } from "lucide-react";

// Form schema validation with Zod
const loginSchema = zod.object({
  email: zod.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: zod.string().min(6, "Password must be at least 6 characters"),
  rememberMe: zod.boolean().optional(),
});

type LoginFormValues = zod.infer<typeof loginSchema>;

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setFormError(null);
    try {
      const success = await login(data.email, data.password);
      if (success) {
        navigate("/dashboard");
      } else {
        setFormError("Invalid credentials. Try using one of the quick demo roles.");
      }
    } catch (err) {
      setFormError("Something went wrong. Please try again.");
    }
  };

  // Helper to pre-populate form for quick reviewer testing
  const handleQuickLogin = (email: string) => {
    setValue("email", email);
    setValue("password", "password123");
    setFormError(null);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex flex-col gap-2 text-center lg:text-left">
        <h2 className="text-3xl font-heading font-bold tracking-tight text-foreground m-0">
          Welcome back
        </h2>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to access your HR workspace dashboard
        </p>
      </div>

      {/* General error message */}
      {formError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-xs text-destructive font-medium animate-fade-in flex items-center gap-2">
          <Shield className="h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        {/* Email */}
        <Input
          label="Work Email Address"
          type="email"
          placeholder="name@company.com"
          leftIcon={<Mail className="h-4.5 w-4.5" />}
          error={errors.email?.message}
          // To ensure React Hook Form matches schema, we register key names correctly
          {...register("email")}
        />

        {/* Password */}
        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          leftIcon={<Lock className="h-4.5 w-4.5" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 hover:bg-muted rounded text-muted-foreground focus:outline-none"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          error={errors.password?.message}
          {...register("password")}
        />

        {/* Remember me & Forgot Password */}
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 font-medium text-foreground/75 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer"
              {...register("rememberMe")}
            />
            Remember me
          </label>
          <Link
            to="/forgot-password"
            className="text-primary hover:underline font-semibold"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-11 text-sm rounded-lg font-semibold"
          isLoading={isSubmitting}
        >
          Sign In to Portal
        </Button>
      </form>

      {/* Divider */}
      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-border/60"></div>
        <span className="flex-shrink mx-4 text-muted-foreground/60 text-xs font-semibold uppercase tracking-wider font-heading">
          Quick Demo Accounts
        </span>
        <div className="flex-grow border-t border-border/60"></div>
      </div>

      {/* Quick Login Tags */}
      <div className="grid grid-cols-2 gap-2.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickLogin("admin@company.com")}
          className="justify-start text-left flex flex-col items-start h-auto py-2.5 px-3 rounded-lg border-border hover:border-primary/50 transition-colors"
        >
          <span className="font-semibold text-xs text-foreground leading-none">HR Admin</span>
          <span className="text-[10px] text-muted-foreground mt-1 font-mono">admin@company.com</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickLogin("manager@company.com")}
          className="justify-start text-left flex flex-col items-start h-auto py-2.5 px-3 rounded-lg border-border hover:border-primary/50 transition-colors"
        >
          <span className="font-semibold text-xs text-foreground leading-none">Manager</span>
          <span className="text-[10px] text-muted-foreground mt-1 font-mono">manager@company.com</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickLogin("employee@company.com")}
          className="justify-start text-left flex flex-col items-start h-auto py-2.5 px-3 rounded-lg border-border hover:border-primary/50 transition-colors"
        >
          <span className="font-semibold text-xs text-foreground leading-none">Employee</span>
          <span className="text-[10px] text-muted-foreground mt-1 font-mono">employee@company.com</span>
        </Button>


      </div>

    </div>
  );
}
