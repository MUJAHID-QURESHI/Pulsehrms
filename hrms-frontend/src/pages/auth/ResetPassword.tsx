import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Lock, ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react";

const schema = zod
  .object({
    password: zod.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: zod.string().min(1, "Password confirmation is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = zod.infer<typeof schema>;

export function ResetPassword() {
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (_data: FormValues) => {
    // Simulate API request delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="w-full flex flex-col gap-6 text-center lg:text-left">
        <div className="flex justify-center lg:justify-start">
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-heading font-bold tracking-tight text-foreground m-0">
            Password reset successful
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your login password has been updated. You can now log in to the PulseHRMS portal with your new credentials.
          </p>
        </div>

        <Button
          className="w-full h-11 text-sm font-semibold rounded-lg"
          onClick={() => navigate("/login")}
        >
          Sign In to Portal
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex flex-col gap-2 text-center lg:text-left">
        <h2 className="text-3xl font-heading font-bold tracking-tight text-foreground m-0">
          Reset password
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Create a secure, strong password for your HRMS account.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        {/* New Password */}
        <Input
          label="New Password"
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

        {/* Confirm Password */}
        <Input
          label="Confirm Password"
          type={showConfirmPassword ? "text" : "password"}
          placeholder="••••••••"
          leftIcon={<Lock className="h-4.5 w-4.5" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="p-1 hover:bg-muted rounded text-muted-foreground focus:outline-none"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Button
          type="submit"
          className="w-full h-11 text-sm rounded-lg font-semibold"
          isLoading={isSubmitting}
        >
          Reset Password
        </Button>
      </form>

      {/* Back to Login link */}
      <div className="text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to login portal
        </Link>
      </div>

    </div>
  );
}
