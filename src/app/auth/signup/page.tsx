"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  Package,
  Truck,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
} from "lucide-react";

type Role = "shipper" | "driver";

const signupSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  phone: z
    .string()
    .min(10, "Please enter a valid phone number")
    .regex(/^[+]?[\d\s()-]+$/, "Please enter a valid phone number"),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>}>
      <SignupContent />
    </Suspense>
  );
}

function SignupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "shipper" || roleParam === "driver") {
      setSelectedRole(roleParam);
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  async function onSubmit(data: SignupFormData) {
    if (!selectedRole) return;

    setIsLoading(true);
    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone,
            role: selectedRole,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
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

  // Email verification success screen
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
              We sent a verification link to your email address. Click the link
              to activate your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-slate-500">
              Didn&apos;t receive the email? Check your spam folder or try
              signing up again.
            </p>
            <Button
              variant="outline"
              className="w-full border-white/10 bg-transparent text-white hover:bg-white/5"
              onClick={() => {
                setEmailSent(false);
                setSelectedRole(null);
              }}
            >
              Back to signup
            </Button>
            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Already verified? Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Role selection screen
  if (!selectedRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F172A] px-4">
        <div className="w-full max-w-2xl space-y-8">
          {/* Branding */}
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">
                Sprint<span className="text-blue-400">Cargo</span>
              </span>
            </Link>
            <h1 className="mt-6 text-2xl font-bold text-white">
              Create your account
            </h1>
            <p className="mt-2 text-slate-400">
              Choose how you want to use SprintCargo
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={() => setSelectedRole("shipper")}
              className="group rounded-xl border border-white/10 bg-[#1E293B] p-6 text-left transition-all hover:border-blue-500/50 hover:bg-[#1E293B]/80 hover:ring-1 hover:ring-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 transition-colors group-hover:bg-blue-500/20">
                <Package className="h-7 w-7 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                I&apos;m a Shipper
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                I need to send packages and cargo. Post deliveries, get
                competitive quotes, and track shipments in real time.
              </p>
              <div className="mt-4 flex items-center text-sm font-medium text-blue-400">
                Get started
                <svg
                  className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>

            <button
              onClick={() => setSelectedRole("driver")}
              className="group rounded-xl border border-white/10 bg-[#1E293B] p-6 text-left transition-all hover:border-blue-500/50 hover:bg-[#1E293B]/80 hover:ring-1 hover:ring-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/10 transition-colors group-hover:bg-emerald-500/20">
                <Truck className="h-7 w-7 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                I&apos;m a Driver
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                I have a cargo van and want to earn. Browse available loads,
                accept jobs, and keep more of what you earn — just $99/month.
              </p>
              <div className="mt-4 flex items-center text-sm font-medium text-emerald-400">
                Get started
                <svg
                  className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-blue-400 hover:text-blue-300"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Registration form
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F172A] px-4">
      <Card className="w-full max-w-md border-white/10 bg-[#1E293B]">
        <CardHeader>
          <button
            onClick={() => setSelectedRole(null)}
            className="mb-2 inline-flex w-fit items-center gap-1 text-sm text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Change role
          </button>
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                Sprint<span className="text-blue-400">Cargo</span>
              </span>
            </Link>
          </div>
          <CardTitle className="mt-2 text-xl text-white">
            Sign up as a{" "}
            <span
              className={
                selectedRole === "shipper"
                  ? "text-blue-400"
                  : "text-emerald-400"
              }
            >
              {selectedRole === "shipper" ? "Shipper" : "Driver"}
            </span>
          </CardTitle>
          <CardDescription className="text-slate-400">
            {selectedRole === "shipper"
              ? "Create your account to start shipping"
              : "Create your account to start earning"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-300">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  className="h-10 border-white/10 bg-[#0F172A] pl-10 text-white placeholder:text-slate-500"
                  {...register("fullName")}
                />
              </div>
              {errors.fullName && (
                <p className="text-xs text-red-400">
                  {errors.fullName.message}
                </p>
              )}
            </div>

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
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  className="h-10 border-white/10 bg-[#0F172A] pl-10 pr-10 text-white placeholder:text-slate-500"
                  {...register("password")}
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
              {errors.password && (
                <p className="text-xs text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-300">
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  className="h-10 border-white/10 bg-[#0F172A] pl-10 text-white placeholder:text-slate-500"
                  {...register("phone")}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-red-400">{errors.phone.message}</p>
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
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>

            {/* Terms */}
            <p className="text-center text-xs text-slate-500">
              By signing up, you agree to our{" "}
              <Link href="/terms" className="text-blue-400 hover:text-blue-300">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-blue-400 hover:text-blue-300"
              >
                Privacy Policy
              </Link>
            </p>
          </form>

          {/* Login link */}
          <div className="mt-6 border-t border-white/10 pt-4 text-center">
            <p className="text-sm text-slate-400">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-blue-400 hover:text-blue-300"
              >
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
