"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Truck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

const resetRequestSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetRequestData = z.infer<typeof resetRequestSchema>;
type NewPasswordData = z.infer<typeof newPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Check if user arrived via a recovery link (Supabase sets the session automatically)
  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const resetRequestForm = useForm<ResetRequestData>({
    resolver: zodResolver(resetRequestSchema),
  });

  const newPasswordForm = useForm<NewPasswordData>({
    resolver: zodResolver(newPasswordSchema),
  });

  async function onRequestReset(data: ResetRequestData) {
    setIsLoading(true);
    try {
      const supabase = createClient();

      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setEmailSent(true);
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function onSetNewPassword(data: NewPasswordData) {
    setIsLoading(true);
    try {
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Password updated successfully!");
      router.push("/auth/login");
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // New password form (user arrived via recovery link)
  if (isRecovery) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F172A] px-4">
        <Card className="w-full max-w-md border-white/10 bg-[#1E293B]">
          <CardHeader className="items-center text-center">
            <Link href="/" className="mb-4 inline-flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">
                Sprint<span className="text-blue-400">Cargo</span>
              </span>
            </Link>
            <CardTitle className="text-xl text-white">
              Set new password
            </CardTitle>
            <CardDescription className="text-slate-400">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={newPasswordForm.handleSubmit(onSetNewPassword)}
              className="space-y-4"
            >
              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    className="h-10 border-white/10 bg-[#0F172A] pl-10 pr-10 text-white placeholder:text-slate-500"
                    {...newPasswordForm.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {newPasswordForm.formState.errors.password && (
                  <p className="text-xs text-red-400">
                    {newPasswordForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    className="h-10 border-white/10 bg-[#0F172A] pl-10 pr-10 text-white placeholder:text-slate-500"
                    {...newPasswordForm.register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {newPasswordForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-red-400">
                    {newPasswordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading}
                className="h-10 w-full bg-blue-500 text-white hover:bg-blue-600"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating password...
                  </>
                ) : (
                  "Update password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Email sent confirmation
  if (emailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F172A] px-4">
        <Card className="w-full max-w-md border-white/10 bg-[#1E293B]">
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <CardTitle className="text-xl text-white">
              Check your email
            </CardTitle>
            <CardDescription className="text-slate-400">
              We sent a password reset link to your email address. Click the
              link to set a new password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-slate-500">
              Didn&apos;t receive the email? Check your spam folder or try
              again.
            </p>
            <Button
              variant="outline"
              className="w-full border-white/10 bg-transparent text-white hover:bg-white/5"
              onClick={() => setEmailSent(false)}
            >
              Try again
            </Button>
            <div className="text-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Request reset form
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F172A] px-4">
      <Card className="w-full max-w-md border-white/10 bg-[#1E293B]">
        <CardHeader className="items-center text-center">
          <Link href="/" className="mb-4 inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">
              Sprint<span className="text-blue-400">Cargo</span>
            </span>
          </Link>
          <CardTitle className="text-xl text-white">
            Reset your password
          </CardTitle>
          <CardDescription className="text-slate-400">
            Enter your email and we&apos;ll send you a reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={resetRequestForm.handleSubmit(onRequestReset)}
            className="space-y-4"
          >
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  className="h-10 border-white/10 bg-[#0F172A] pl-10 text-white placeholder:text-slate-500"
                  {...resetRequestForm.register("email")}
                />
              </div>
              {resetRequestForm.formState.errors.email && (
                <p className="text-xs text-red-400">
                  {resetRequestForm.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="h-10 w-full bg-blue-500 text-white hover:bg-blue-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending reset link...
                </>
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>

          {/* Back to login */}
          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
