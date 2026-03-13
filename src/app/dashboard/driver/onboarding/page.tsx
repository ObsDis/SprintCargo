"use client";

import { useState, useEffect } from "react";
import {
  Truck,
  DollarSign,
  MapPin,
  CreditCard,
  Smartphone,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Camera,
  Loader2,
  Shield,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const STEPS = [
  { label: "Vehicle Info", icon: Truck },
  { label: "Rate Card", icon: DollarSign },
  { label: "Service Area", icon: MapPin },
  { label: "Stripe Connect", icon: CreditCard },
  { label: "Subscription", icon: Shield },
  { label: "Mobile App", icon: Smartphone },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Step 1: Vehicle
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [cargoLength, setCargoLength] = useState("");
  const [cargoWidth, setCargoWidth] = useState("");
  const [cargoHeight, setCargoHeight] = useState("");
  const [maxWeight, setMaxWeight] = useState("");

  // Step 2: Rate card
  const [baseRate, setBaseRate] = useState("25");
  const [perMile, setPerMile] = useState("1.50");
  const [sizeSmall, setSizeSmall] = useState("0");
  const [sizeMedium, setSizeMedium] = useState("10");
  const [sizeLarge, setSizeLarge] = useState("25");
  const [sizeOversized, setSizeOversized] = useState("50");
  const [weightUnder50, setWeightUnder50] = useState("0");
  const [weight50to150, setWeight50to150] = useState("10");
  const [weight150to500, setWeight150to500] = useState("25");
  const [weightOver500, setWeightOver500] = useState("50");
  const [multiStopRate, setMultiStopRate] = useState("15");
  const [rushMultiplier, setRushMultiplier] = useState("1.5");

  // Step 3: Service area
  const [serviceRadius, setServiceRadius] = useState(25);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      setLoading(false);
    }
    load();
  }, []);

  async function saveVehicleInfo() {
    if (!userId) return;
    setSaving(true);
    const supabase = createClient();

    // Upsert driver profile
    await supabase.from("driver_profiles").upsert({
      id: userId,
      vehicle_year: vehicleYear ? parseInt(vehicleYear) : null,
      vehicle_make: vehicleMake || null,
      vehicle_model: vehicleModel || null,
      vehicle_color: vehicleColor || null,
      license_plate: licensePlate || null,
      cargo_length_inches: cargoLength ? parseFloat(cargoLength) : null,
      cargo_width_inches: cargoWidth ? parseFloat(cargoWidth) : null,
      cargo_height_inches: cargoHeight ? parseFloat(cargoHeight) : null,
      max_weight_lbs: maxWeight ? parseFloat(maxWeight) : null,
    });

    setSaving(false);
    setStep(1);
  }

  async function saveRateCard() {
    if (!userId) return;
    setSaving(true);
    const supabase = createClient();

    await supabase.from("driver_rate_cards").upsert(
      {
        driver_id: userId,
        base_rate: parseFloat(baseRate) || 25,
        per_mile_rate: parseFloat(perMile) || 1.5,
        size_small_surcharge: parseFloat(sizeSmall) || 0,
        size_medium_surcharge: parseFloat(sizeMedium) || 10,
        size_large_surcharge: parseFloat(sizeLarge) || 25,
        size_oversized_surcharge: parseFloat(sizeOversized) || 50,
        weight_under_50_surcharge: parseFloat(weightUnder50) || 0,
        weight_50_to_150_surcharge: parseFloat(weight50to150) || 10,
        weight_150_to_500_surcharge: parseFloat(weight150to500) || 25,
        weight_over_500_surcharge: parseFloat(weightOver500) || 50,
        multi_stop_per_stop_rate: parseFloat(multiStopRate) || 15,
        rush_multiplier: parseFloat(rushMultiplier) || 1.5,
      },
      { onConflict: "driver_id" }
    );

    setSaving(false);
    setStep(2);
  }

  async function saveServiceArea() {
    if (!userId) return;
    setSaving(true);
    const supabase = createClient();

    await supabase
      .from("driver_profiles")
      .update({ service_radius_miles: serviceRadius })
      .eq("id", userId);

    setSaving(false);
    setStep(3);
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A]">
          Driver Onboarding
        </h1>
        <p className="mt-1 text-muted-foreground">
          Complete these steps to start accepting deliveries.
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </span>
          <span className="font-medium text-[#3B82F6]">
            {Math.round(progress)}% complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => {
          const isCompleted = i < step;
          const isCurrent = i === step;
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="flex flex-col items-center gap-1"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                  isCompleted
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : isCurrent
                    ? "border-[#3B82F6] bg-[#3B82F6] text-white"
                    : "border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <span
                className={`text-xs ${
                  isCurrent
                    ? "font-medium text-[#0F172A]"
                    : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      {step === 0 && (
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#0F172A]">
              <Truck className="h-5 w-5" />
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="o-year">Year</Label>
                <Input
                  id="o-year"
                  type="number"
                  value={vehicleYear}
                  onChange={(e) => setVehicleYear(e.target.value)}
                  placeholder="2024"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="o-make">Make</Label>
                <Input
                  id="o-make"
                  value={vehicleMake}
                  onChange={(e) => setVehicleMake(e.target.value)}
                  placeholder="Mercedes-Benz"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="o-model">Model</Label>
                <Input
                  id="o-model"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  placeholder="Sprinter 2500"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="o-color">Color</Label>
                <Input
                  id="o-color"
                  value={vehicleColor}
                  onChange={(e) => setVehicleColor(e.target.value)}
                  placeholder="White"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="max-w-xs">
              <Label htmlFor="o-plate">License Plate</Label>
              <Input
                id="o-plate"
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
                <Label htmlFor="o-length">Length (in)</Label>
                <Input
                  id="o-length"
                  type="number"
                  value={cargoLength}
                  onChange={(e) => setCargoLength(e.target.value)}
                  placeholder="170"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="o-width">Width (in)</Label>
                <Input
                  id="o-width"
                  type="number"
                  value={cargoWidth}
                  onChange={(e) => setCargoWidth(e.target.value)}
                  placeholder="70"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="o-height">Height (in)</Label>
                <Input
                  id="o-height"
                  type="number"
                  value={cargoHeight}
                  onChange={(e) => setCargoHeight(e.target.value)}
                  placeholder="78"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="o-weight">Max Weight (lbs)</Label>
                <Input
                  id="o-weight"
                  type="number"
                  value={maxWeight}
                  onChange={(e) => setMaxWeight(e.target.value)}
                  placeholder="3500"
                  className="mt-1"
                />
              </div>
            </div>

            <Separator />
            <div>
              <p className="text-sm font-medium text-[#0F172A]">
                Vehicle Photo
              </p>
              <div className="mt-2 flex h-32 w-full items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50">
                <div className="text-center">
                  <Camera className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-1 text-sm text-muted-foreground">
                    Click to upload a photo of your vehicle
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                className="bg-[#3B82F6] hover:bg-[#2563EB]"
                disabled={saving}
                onClick={saveVehicleInfo}
              >
                {saving && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Next: Rate Card
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#0F172A]">
              <DollarSign className="h-5 w-5" />
              Rate Card Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Set your pricing. These suggested defaults are based on typical
              market rates. You can adjust anytime.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Base Rate ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={baseRate}
                  onChange={(e) => setBaseRate(e.target.value)}
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Suggested: $25.00
                </p>
              </div>
              <div>
                <Label>Per-Mile Rate ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={perMile}
                  onChange={(e) => setPerMile(e.target.value)}
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Suggested: $1.50
                </p>
              </div>
            </div>

            <Separator />
            <p className="text-sm font-medium text-[#0F172A]">
              Size Surcharges
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Small", value: sizeSmall, set: setSizeSmall, sug: "$0" },
                { label: "Medium", value: sizeMedium, set: setSizeMedium, sug: "$10" },
                { label: "Large", value: sizeLarge, set: setSizeLarge, sug: "$25" },
                { label: "Oversized", value: sizeOversized, set: setSizeOversized, sug: "$50" },
              ].map((item) => (
                <div key={item.label}>
                  <Label>{item.label} ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.value}
                    onChange={(e) => item.set(e.target.value)}
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Suggested: {item.sug}
                  </p>
                </div>
              ))}
            </div>

            <Separator />
            <p className="text-sm font-medium text-[#0F172A]">
              Weight Surcharges
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "<50 lbs", value: weightUnder50, set: setWeightUnder50, sug: "$0" },
                { label: "50-150 lbs", value: weight50to150, set: setWeight50to150, sug: "$10" },
                { label: "150-500 lbs", value: weight150to500, set: setWeight150to500, sug: "$25" },
                { label: ">500 lbs", value: weightOver500, set: setWeightOver500, sug: "$50" },
              ].map((item) => (
                <div key={item.label}>
                  <Label>{item.label} ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.value}
                    onChange={(e) => item.set(e.target.value)}
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Suggested: {item.sug}
                  </p>
                </div>
              ))}
            </div>

            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Multi-Stop Rate (per stop) ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={multiStopRate}
                  onChange={(e) => setMultiStopRate(e.target.value)}
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Suggested: $15.00
                </p>
              </div>
              <div>
                <Label>Rush Multiplier</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="1"
                  value={rushMultiplier}
                  onChange={(e) => setRushMultiplier(e.target.value)}
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Suggested: 1.5x
                </p>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(0)}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                className="bg-[#3B82F6] hover:bg-[#2563EB]"
                disabled={saving}
                onClick={saveRateCard}
              >
                {saving && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Next: Service Area
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#0F172A]">
              <MapPin className="h-5 w-5" />
              Service Area
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Set how far from your location you are willing to pick up
              deliveries.
            </p>

            <div>
              <Label>Service Radius: {serviceRadius} miles</Label>
              <input
                type="range"
                min="5"
                max="200"
                step="5"
                value={serviceRadius}
                onChange={(e) =>
                  setServiceRadius(parseInt(e.target.value))
                }
                className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-[#3B82F6]"
              />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>5 mi</span>
                <span>100 mi</span>
                <span>200 mi</span>
              </div>
            </div>

            {/* Map placeholder */}
            <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50">
              <div className="text-center">
                <MapPin className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Map preview showing your {serviceRadius}-mile service radius
                </p>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                className="bg-[#3B82F6] hover:bg-[#2563EB]"
                disabled={saving}
                onClick={saveServiceArea}
              >
                {saving && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Next: Stripe Connect
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#0F172A]">
              <CreditCard className="h-5 w-5" />
              Stripe Connect Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your bank account through Stripe to receive payouts for
              completed deliveries. You will be redirected to Stripe to
              securely set up your account.
            </p>

            <div className="rounded-lg border bg-muted/50 p-6 text-center">
              <CreditCard className="mx-auto h-12 w-12 text-[#3B82F6]" />
              <p className="mt-3 font-medium text-[#0F172A]">
                Secure Payment Processing
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Stripe handles all payment processing. Your banking details are
                never stored on our servers.
              </p>
              <Button
                className="mt-4 bg-[#3B82F6] hover:bg-[#2563EB]"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Connect with Stripe
              </Button>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                variant="outline"
                onClick={() => setStep(4)}
              >
                Skip for Now
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#0F172A]">
              <Shield className="h-5 w-5" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Subscribe to SprintCargo Driver Pro to start accepting delivery
              jobs.
            </p>

            <div className="rounded-lg border p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[#0F172A]">
                    Driver Pro Plan
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Unlimited job quotes
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Priority job matching
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Real-time notifications
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Earnings analytics
                    </li>
                  </ul>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-[#0F172A]">$29.99</p>
                  <p className="text-sm text-muted-foreground">/month</p>
                  <Badge variant="secondary" className="mt-1">
                    7-day free trial
                  </Badge>
                </div>
              </div>
              <Button className="mt-6 w-full bg-[#3B82F6] hover:bg-[#2563EB]">
                <CreditCard className="mr-2 h-4 w-4" />
                Start Free Trial
              </Button>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button variant="outline" onClick={() => setStep(5)}>
                Skip for Now
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 5 && (
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#0F172A]">
              <Smartphone className="h-5 w-5" />
              Download the Mobile App
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Download the SprintCargo Driver app to manage deliveries on the
              go, receive real-time notifications, and use GPS navigation.
            </p>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="flex flex-col items-center rounded-lg border p-6">
                <div className="flex h-40 w-40 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50">
                  <p className="text-sm text-muted-foreground">QR Code</p>
                </div>
                <p className="mt-3 font-medium text-[#0F172A]">iOS App</p>
                <p className="text-sm text-muted-foreground">
                  Scan to download from App Store
                </p>
              </div>
              <div className="flex flex-col items-center rounded-lg border p-6">
                <div className="flex h-40 w-40 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50">
                  <p className="text-sm text-muted-foreground">QR Code</p>
                </div>
                <p className="mt-3 font-medium text-[#0F172A]">Android App</p>
                <p className="text-sm text-muted-foreground">
                  Scan to download from Google Play
                </p>
              </div>
            </div>

            <Separator />

            <div className="rounded-lg bg-emerald-50 p-6 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
              <h3 className="mt-3 text-lg font-semibold text-emerald-900">
                You are all set!
              </h3>
              <p className="mt-1 text-sm text-emerald-700">
                Your driver account is configured and ready to go. Start
                browsing available jobs now.
              </p>
              <Button
                className="mt-4 bg-[#3B82F6] hover:bg-[#2563EB]"
                onClick={() =>
                  (window.location.href = "/dashboard/driver")
                }
              >
                Go to Dashboard
              </Button>
            </div>

            <div className="flex justify-start">
              <Button variant="outline" onClick={() => setStep(4)}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
