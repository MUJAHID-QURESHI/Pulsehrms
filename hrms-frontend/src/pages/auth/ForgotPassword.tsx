import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

const schema = zod.object({
  email: zod.string().min(1, "Email is required").email("Please enter a valid email address"),
});

type FormValues = zod.infer<typeof schema>;

export function ForgotPassword() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: FormValues) => {
    // Simulate API request delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSubmittedEmail(data.email);
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
            Check your email
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We have sent password recovery instructions and a secure reset link to{" "}
            <span className="font-semibold text-foreground">{submittedEmail}</span>.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full h-11 text-sm font-semibold rounded-lg"
            onClick={() => setIsSubmitted(false)}
          >
            Resend recovery email
          </Button>

          <Link
            to="/login"
            className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex flex-col gap-2 text-center lg:text-left">
        <h2 className="text-3xl font-heading font-bold tracking-tight text-foreground m-0">
          Forgot password?
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          No worries! Just enter your registered work email address, and we'll send you a link to reset your password.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        <Input
          label="Work Email Address"
          type="email"
          placeholder="name@company.com"
          leftIcon={<Mail className="h-4.5 w-4.5" />}
          error={errors.email?.message}
          {...register("email")}
        />

        <Button
          type="submit"
          className="w-full h-11 text-sm rounded-lg font-semibold"
          isLoading={isSubmitting}
        >
          Send Reset Link
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
