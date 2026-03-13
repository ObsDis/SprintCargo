"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Mail,
  Phone,
  Building2,
  Camera,
  Save,
  Lock,
  Eye,
  EyeOff,
  Shield,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

interface ProfileFormData {
  full_name: string;
  email: string;
  phone: string;
  company_name: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>();

  const {
    register: registerPw,
    handleSubmit: handleSubmitPw,
    reset: resetPw,
    watch: watchPw,
    formState: { errors: pwErrors },
  } = useForm<PasswordFormData>();

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        const p = data as Profile;
        setProfile(p);
        reset({
          full_name: p.full_name,
          email: p.email,
          phone: p.phone ?? "",
          company_name: p.company_name ?? "",
        });
      }
      setLoading(false);
    }
    fetchProfile();
  }, [reset]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSaveProfile = async (data: ProfileFormData) => {
    if (!profile) return;
    setSaving(true);
    const supabase = createClient();

    let avatarUrl = profile.avatar_url;

    // Upload avatar if changed
    if (avatarFile) {
      const fileExt = avatarFile.name.split(".").pop();
      const fileName = `${profile.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, avatarFile, { upsert: true });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);
        avatarUrl = urlData.publicUrl;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: data.full_name,
        phone: data.phone || null,
        company_name: data.company_name || null,
        avatar_url: avatarUrl,
      })
      .eq("id", profile.id);

    if (error) {
      toast.error("Failed to save profile: " + error.message);
    } else {
      toast.success("Profile updated successfully!");
      setProfile((prev) => prev ? { ...prev, ...data, avatar_url: avatarUrl } : null);
      setAvatarFile(null);
    }
    setSaving(false);
  };

  const onChangePassword = async (data: PasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (data.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setChangingPassword(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: data.newPassword,
    });
    if (error) {
      toast.error("Failed to change password: " + error.message);
    } else {
      toast.success("Password changed successfully!");
      resetPw();
    }
    setChangingPassword(false);
  };

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "??";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Profile Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account information</p>
      </div>

      {loading ? (
        <div className="space-y-6">
          <Card className="rounded-xl shadow-sm border-0 bg-white">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Profile Form */}
          <form onSubmit={handleSubmit(onSaveProfile)}>
            <Card className="rounded-xl shadow-sm border-0 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-[#0F172A] flex items-center gap-2">
                  <User className="h-5 w-5 text-[#3B82F6]" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-5">
                  <div className="relative group">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={avatarPreview ?? profile?.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-[#0F172A] text-white text-lg">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <label
                      htmlFor="avatar-upload"
                      className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Camera className="h-5 w-5 text-white" />
                    </label>
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-[#0F172A]">{profile?.full_name}</p>
                    <p className="text-sm text-gray-500">{profile?.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Shipper Account
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name" className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-gray-400" />
                      Full Name
                    </Label>
                    <Input
                      id="full_name"
                      className="mt-1.5"
                      {...register("full_name", { required: "Name is required" })}
                    />
                    {errors.full_name && (
                      <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email" className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-gray-400" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      disabled
                      className="mt-1.5 bg-gray-50"
                      {...register("email")}
                    />
                    <p className="text-xs text-gray-400 mt-1">Email cannot be changed here</p>
                  </div>
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 000-0000"
                      className="mt-1.5"
                      {...register("phone")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="company_name" className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-gray-400" />
                      Company Name
                    </Label>
                    <Input
                      id="company_name"
                      placeholder="Optional"
                      className="mt-1.5"
                      {...register("company_name")}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={saving || (!isDirty && !avatarFile)}
                    className="bg-[#3B82F6] hover:bg-[#2563EB] text-white gap-2 min-w-[140px]"
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>

          {/* Password Change */}
          <form onSubmit={handleSubmitPw(onChangePassword)}>
            <Card className="rounded-xl shadow-sm border-0 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-[#0F172A] flex items-center gap-2">
                  <Lock className="h-5 w-5 text-[#3B82F6]" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Enter current password"
                      {...registerPw("currentPassword", { required: "Current password is required" })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative mt-1.5">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="At least 8 characters"
                        {...registerPw("newPassword", {
                          required: "New password is required",
                          minLength: { value: 8, message: "At least 8 characters" },
                        })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {pwErrors.newPassword && (
                      <p className="text-xs text-red-500 mt-1">{pwErrors.newPassword.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Re-enter new password"
                      className="mt-1.5"
                      {...registerPw("confirmPassword", { required: "Please confirm your password" })}
                    />
                    {pwErrors.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">{pwErrors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={changingPassword}
                    className="gap-2 min-w-[160px]"
                  >
                    {changingPassword ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        Updating...
                      </span>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Update Password
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>

          {/* Account Info */}
          <Card className="rounded-xl shadow-sm border-0 bg-white">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Account created {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "N/A"}</span>
                <span className="text-gray-300">|</span>
                <span>Subscription: <span className="font-medium text-[#0F172A] capitalize">{profile?.subscription_status ?? "N/A"}</span></span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
