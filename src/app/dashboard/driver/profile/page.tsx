"use client";

import { useEffect, useState } from "react";
import {
  User,
  Truck,
  MapPin,
  Lock,
  Save,
  Loader2,
  Camera,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Profile, DriverProfile } from "@/types/database";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [vehicleYear, setVehicleYear] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [cargoLength, setCargoLength] = useState("");
  const [cargoWidth, setCargoWidth] = useState("");
  const [cargoHeight, setCargoHeight] = useState("");
  const [maxWeight, setMaxWeight] = useState("");
  const [serviceRadius, setServiceRadius] = useState(25);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: prof }, { data: dp }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase
          .from("driver_profiles")
          .select("*")
          .eq("id", user.id)
          .single(),
      ]);

      setProfile(prof);
      setDriverProfile(dp);

      if (prof) {
        setFullName(prof.full_name);
        setEmail(prof.email);
        setPhone(prof.phone || "");
      }
      if (dp) {
        setVehicleYear(dp.vehicle_year?.toString() || "");
        setVehicleMake(dp.vehicle_make || "");
        setVehicleModel(dp.vehicle_model || "");
        setVehicleColor(dp.vehicle_color || "");
        setLicensePlate(dp.license_plate || "");
        setCargoLength(dp.cargo_length_inches?.toString() || "");
        setCargoWidth(dp.cargo_width_inches?.toString() || "");
        setCargoHeight(dp.cargo_height_inches?.toString() || "");
        setMaxWeight(dp.max_weight_lbs?.toString() || "");
        setServiceRadius(dp.service_radius_miles);
      }

      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    const supabase = createClient();

    await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone: phone || null,
      })
      .eq("id", profile.id);

    await supabase
      .from("driver_profiles")
      .update({
        vehicle_year: vehicleYear ? parseInt(vehicleYear) : null,
        vehicle_make: vehicleMake || null,
        vehicle_model: vehicleModel || null,
        vehicle_color: vehicleColor || null,
        license_plate: licensePlate || null,
        cargo_length_inches: cargoLength ? parseFloat(cargoLength) : null,
        cargo_width_inches: cargoWidth ? parseFloat(cargoWidth) : null,
        cargo_height_inches: cargoHeight ? parseFloat(cargoHeight) : null,
        max_weight_lbs: maxWeight ? parseFloat(maxWeight) : null,
        service_radius_miles: serviceRadius,
      })
      .eq("id", profile.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handlePasswordChange() {
    if (newPassword !== confirmPassword) {
      setPasswordMessage("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage("Password must be at least 8 characters.");
      return;
    }
    setPasswordSaving(true);
    setPasswordMessage("");
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setPasswordMessage(error.message);
    } else {
      setPasswordMessage("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setPasswordSaving(false);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="mt-2 h-5 w-72" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A]">Profile Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your personal and vehicle information.
        </p>
      </div>

      {/* Personal Info */}
      <Card className="rounded-xl shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0F172A]">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-[#3B82F6] text-white text-lg">
                {fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm">
              <Camera className="mr-2 h-4 w-4" />
              Change Avatar
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="full-name">Full Name</Label>
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="mt-1 bg-muted"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Contact support to change your email.
              </p>
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Info */}
      <Card className="rounded-xl shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0F172A]">
            <Truck className="h-5 w-5" />
            Vehicle Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="v-year">Year</Label>
              <Input
                id="v-year"
                type="number"
                value={vehicleYear}
                onChange={(e) => setVehicleYear(e.target.value)}
                placeholder="2024"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="v-make">Make</Label>
              <Input
                id="v-make"
                value={vehicleMake}
                onChange={(e) => setVehicleMake(e.target.value)}
                placeholder="Mercedes-Benz"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="v-model">Model</Label>
              <Input
                id="v-model"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="Sprinter 2500"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="v-color">Color</Label>
              <Input
                id="v-color"
                value={vehicleColor}
                onChange={(e) => setVehicleColor(e.target.value)}
                placeholder="White"
                className="mt-1"
              />
            </div>
          </div>
          <div className="max-w-xs">
            <Label htmlFor="v-plate">License Plate</Label>
            <Input
              id="v-plate"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              placeholder="ABC 1234"
              className="mt-1"
            />
          </div>
          <Separator />
          <p className="text-sm font-medium text-[#0F172A]">
            Cargo Dimensions
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="c-length">Length (inches)</Label>
              <Input
                id="c-length"
                type="number"
                value={cargoLength}
                onChange={(e) => setCargoLength(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="c-width">Width (inches)</Label>
              <Input
                id="c-width"
                type="number"
                value={cargoWidth}
                onChange={(e) => setCargoWidth(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="c-height">Height (inches)</Label>
              <Input
                id="c-height"
                type="number"
                value={cargoHeight}
                onChange={(e) => setCargoHeight(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="max-weight">Max Weight (lbs)</Label>
              <Input
                id="max-weight"
                type="number"
                value={maxWeight}
                onChange={(e) => setMaxWeight(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Radius */}
      <Card className="rounded-xl shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0F172A]">
            <MapPin className="h-5 w-5" />
            Service Area
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="service-radius">
              Service Radius: {serviceRadius} miles
            </Label>
            <input
              id="service-radius"
              type="range"
              min="5"
              max="200"
              step="5"
              value={serviceRadius}
              onChange={(e) => setServiceRadius(parseInt(e.target.value))}
              className="mt-2 h-2 w-full max-w-md cursor-pointer appearance-none rounded-lg bg-muted accent-[#3B82F6]"
            />
            <div className="mt-1 flex max-w-md justify-between text-xs text-muted-foreground">
              <span>5 mi</span>
              <span>100 mi</span>
              <span>200 mi</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Jobs within this radius of your current location will appear in
            available jobs.
          </p>
        </CardContent>
      </Card>

      {/* Save Profile */}
      <div className="flex items-center gap-4">
        <Button
          className="bg-[#3B82F6] hover:bg-[#2563EB]"
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Profile
        </Button>
        {saved && (
          <span className="text-sm font-medium text-emerald-600">
            Saved successfully!
          </span>
        )}
      </div>

      {/* Password Change */}
      <Card className="rounded-xl shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0F172A]">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-sm">
            <Label htmlFor="current-pw">Current Password</Label>
            <Input
              id="current-pw"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="max-w-sm">
            <Label htmlFor="new-pw">New Password</Label>
            <Input
              id="new-pw"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="max-w-sm">
            <Label htmlFor="confirm-pw">Confirm New Password</Label>
            <Input
              id="confirm-pw"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1"
            />
          </div>
          {passwordMessage && (
            <p
              className={`text-sm ${
                passwordMessage.includes("success")
                  ? "text-emerald-600"
                  : "text-red-600"
              }`}
            >
              {passwordMessage}
            </p>
          )}
          <Button
            variant="outline"
            disabled={
              passwordSaving || !currentPassword || !newPassword
            }
            onClick={handlePasswordChange}
          >
            {passwordSaving && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Update Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
