"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { cn, formatCurrency } from "@/lib/utils";
import type { SizeCategory, DeliverySpeed, Json } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Package,
  ClipboardCheck,
  Zap,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Upload,
  AlertTriangle,
  Users,
  Check,
  Clock,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { id: 1, label: "Pickup", icon: MapPin },
  { id: 2, label: "Delivery", icon: Truck },
  { id: 3, label: "Items", icon: Package },
  { id: 4, label: "Review", icon: ClipboardCheck },
];

const SIZE_OPTIONS: {
  value: SizeCategory;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    value: "small",
    label: "Small",
    description: "Fits in a car trunk. Boxes, bags, small furniture.",
    icon: "📦",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Needs an SUV or small van. Appliances, multiple boxes.",
    icon: "📫",
  },
  {
    value: "large",
    label: "Large",
    description: "Requires a cargo van or truck. Furniture, large items.",
    icon: "🚛",
  },
  {
    value: "oversized",
    label: "Oversized",
    description: "Full truck load. Multiple large items, full moves.",
    icon: "🏗️",
  },
];

const SPEED_OPTIONS: {
  value: DeliverySpeed;
  label: string;
  description: string;
  priceMultiplier: string;
}[] = [
  {
    value: "standard",
    label: "Standard",
    description: "Delivery within 2-5 business days",
    priceMultiplier: "1x",
  },
  {
    value: "same_day",
    label: "Same Day",
    description: "Delivered by end of today",
    priceMultiplier: "1.5x",
  },
  {
    value: "rush",
    label: "Rush",
    description: "Picked up within 2 hours",
    priceMultiplier: "2x",
  },
];

interface AdditionalStop {
  address: string;
  contactName: string;
  contactPhone: string;
  notes: string;
}

interface ShipmentFormData {
  // Step 1 - Pickup
  pickupAddress: string;
  pickupContactName: string;
  pickupContactPhone: string;
  pickupNotes: string;
  pickupDate: string;
  pickupTimeStart: string;
  pickupTimeEnd: string;
  // Step 2 - Delivery
  dropoffAddress: string;
  dropoffContactName: string;
  dropoffContactPhone: string;
  dropoffNotes: string;
  additionalStops: AdditionalStop[];
  // Step 3 - Items
  title: string;
  itemDescription: string;
  sizeCategory: SizeCategory;
  estimatedWeightLbs: number;
  numItems: number;
  fragile: boolean;
  requiresHelpers: boolean;
  specialInstructions: string;
  // Step 4 - Review
  deliverySpeed: DeliverySpeed;
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        const isActive = currentStep === step.id;
        const isComplete = currentStep > step.id;
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                isActive && "bg-[#3B82F6] text-white shadow-md",
                isComplete && "bg-green-100 text-green-700",
                !isActive && !isComplete && "bg-gray-100 text-gray-400"
              )}
            >
              {isComplete ? (
                <Check className="h-4 w-4" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-8 transition-colors",
                  currentStep > step.id ? "bg-green-300" : "bg-gray-200"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function CreateShipmentPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<ShipmentFormData>({
    defaultValues: {
      pickupAddress: "",
      pickupContactName: "",
      pickupContactPhone: "",
      pickupNotes: "",
      pickupDate: "",
      pickupTimeStart: "",
      pickupTimeEnd: "",
      dropoffAddress: "",
      dropoffContactName: "",
      dropoffContactPhone: "",
      dropoffNotes: "",
      additionalStops: [],
      title: "",
      itemDescription: "",
      sizeCategory: "small",
      estimatedWeightLbs: 0,
      numItems: 1,
      fragile: false,
      requiresHelpers: false,
      specialInstructions: "",
      deliverySpeed: "standard",
    },
  });

  const watchAll = watch();
  const additionalStops = watch("additionalStops");

  const addStop = () => {
    const stops = watchAll.additionalStops ?? [];
    setValue("additionalStops", [
      ...stops,
      { address: "", contactName: "", contactPhone: "", notes: "" },
    ]);
  };

  const removeStop = (index: number) => {
    const stops = watchAll.additionalStops ?? [];
    setValue(
      "additionalStops",
      stops.filter((_, i) => i !== index)
    );
  };

  const stepFields: Record<number, (keyof ShipmentFormData)[]> = {
    1: ["pickupAddress", "pickupContactName", "pickupContactPhone", "pickupDate", "pickupTimeStart", "pickupTimeEnd"],
    2: ["dropoffAddress", "dropoffContactName", "dropoffContactPhone"],
    3: ["title", "itemDescription", "sizeCategory", "numItems"],
    4: ["deliverySpeed"],
  };

  const validateStep = async () => {
    // Basic manual validation per step
    if (currentStep === 1) {
      if (!watchAll.pickupAddress || !watchAll.pickupContactName || !watchAll.pickupContactPhone || !watchAll.pickupDate) {
        toast.error("Please fill in all required pickup fields.");
        return false;
      }
    }
    if (currentStep === 2) {
      if (!watchAll.dropoffAddress || !watchAll.dropoffContactName || !watchAll.dropoffContactPhone) {
        toast.error("Please fill in all required delivery fields.");
        return false;
      }
    }
    if (currentStep === 3) {
      if (!watchAll.title || !watchAll.itemDescription) {
        toast.error("Please fill in title and item description.");
        return false;
      }
    }
    return true;
  };

  const handleNext = async () => {
    const valid = await validateStep();
    if (valid) setCurrentStep((s) => Math.min(s + 1, 4));
  };

  const handleBack = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotoFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const estimatedPriceLow = (() => {
    const base = watchAll.sizeCategory === "small" ? 35 : watchAll.sizeCategory === "medium" ? 65 : watchAll.sizeCategory === "large" ? 120 : 250;
    const multiplier = watchAll.deliverySpeed === "rush" ? 2 : watchAll.deliverySpeed === "same_day" ? 1.5 : 1;
    return Math.round(base * multiplier);
  })();
  const estimatedPriceHigh = Math.round(estimatedPriceLow * 1.8);

  const onSubmit = async (data: ShipmentFormData) => {
    setSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in.");
        return;
      }

      const pickupStart = new Date(`${data.pickupDate}T${data.pickupTimeStart || "09:00"}`);
      const pickupEnd = new Date(`${data.pickupDate}T${data.pickupTimeEnd || "17:00"}`);

      const { error } = await supabase.from("jobs").insert({
        shipper_id: user.id,
        status: "posted",
        title: data.title,
        pickup_address: data.pickupAddress,
        pickup_lat: 0,
        pickup_lng: 0,
        pickup_contact_name: data.pickupContactName,
        pickup_contact_phone: data.pickupContactPhone,
        pickup_notes: data.pickupNotes || null,
        dropoff_address: data.dropoffAddress,
        dropoff_lat: 0,
        dropoff_lng: 0,
        dropoff_contact_name: data.dropoffContactName,
        dropoff_contact_phone: data.dropoffContactPhone,
        dropoff_notes: data.dropoffNotes || null,
        additional_stops:
          data.additionalStops.length > 0 ? (data.additionalStops as unknown as Json) : null,
        item_description: data.itemDescription,
        size_category: data.sizeCategory,
        estimated_weight_lbs: data.estimatedWeightLbs || null,
        num_items: data.numItems,
        delivery_speed: data.deliverySpeed,
        pickup_window_start: pickupStart.toISOString(),
        pickup_window_end: pickupEnd.toISOString(),
        special_instructions: data.specialInstructions || null,
        fragile: data.fragile,
        requires_helpers: data.requiresHelpers,
        estimated_price_low: estimatedPriceLow,
        estimated_price_high: estimatedPriceHigh,
      });

      if (error) {
        toast.error("Failed to create shipment: " + error.message);
        return;
      }

      toast.success("Shipment posted successfully!");
      router.push("/dashboard/shipper/shipment-bids");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A]">Create Shipment</h1>
        <p className="text-gray-500 mt-1">
          Describe your shipment and we&apos;ll connect you with drivers
        </p>
      </div>

      <StepIndicator currentStep={currentStep} />

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Pickup */}
        {currentStep === 1 && (
          <Card className="rounded-xl shadow-sm border-0 bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-[#0F172A] flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#3B82F6]" />
                Pickup Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label htmlFor="pickupAddress">Pickup Address *</Label>
                <Input
                  id="pickupAddress"
                  placeholder="Enter full pickup address"
                  className="mt-1.5"
                  {...register("pickupAddress")}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pickupContactName">Contact Name *</Label>
                  <Input
                    id="pickupContactName"
                    placeholder="Who will be at pickup?"
                    className="mt-1.5"
                    {...register("pickupContactName")}
                  />
                </div>
                <div>
                  <Label htmlFor="pickupContactPhone">Contact Phone *</Label>
                  <Input
                    id="pickupContactPhone"
                    type="tel"
                    placeholder="(555) 000-0000"
                    className="mt-1.5"
                    {...register("pickupContactPhone")}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="pickupNotes">Pickup Notes</Label>
                <Textarea
                  id="pickupNotes"
                  placeholder="e.g., Gate code #1234, ring doorbell, loading dock on east side"
                  className="mt-1.5"
                  {...register("pickupNotes")}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="pickupDate">Pickup Date *</Label>
                  <Input
                    id="pickupDate"
                    type="date"
                    className="mt-1.5"
                    {...register("pickupDate")}
                  />
                </div>
                <div>
                  <Label htmlFor="pickupTimeStart">Earliest Time</Label>
                  <Input
                    id="pickupTimeStart"
                    type="time"
                    className="mt-1.5"
                    {...register("pickupTimeStart")}
                  />
                </div>
                <div>
                  <Label htmlFor="pickupTimeEnd">Latest Time</Label>
                  <Input
                    id="pickupTimeEnd"
                    type="time"
                    className="mt-1.5"
                    {...register("pickupTimeEnd")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Delivery */}
        {currentStep === 2 && (
          <Card className="rounded-xl shadow-sm border-0 bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-[#0F172A] flex items-center gap-2">
                <Truck className="h-5 w-5 text-[#3B82F6]" />
                Delivery Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label htmlFor="dropoffAddress">Drop-off Address *</Label>
                <Input
                  id="dropoffAddress"
                  placeholder="Enter full delivery address"
                  className="mt-1.5"
                  {...register("dropoffAddress")}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dropoffContactName">Contact Name *</Label>
                  <Input
                    id="dropoffContactName"
                    placeholder="Who will receive the delivery?"
                    className="mt-1.5"
                    {...register("dropoffContactName")}
                  />
                </div>
                <div>
                  <Label htmlFor="dropoffContactPhone">Contact Phone *</Label>
                  <Input
                    id="dropoffContactPhone"
                    type="tel"
                    placeholder="(555) 000-0000"
                    className="mt-1.5"
                    {...register("dropoffContactPhone")}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="dropoffNotes">Delivery Notes</Label>
                <Textarea
                  id="dropoffNotes"
                  placeholder="e.g., Leave at front door, apartment 4B, call when arriving"
                  className="mt-1.5"
                  {...register("dropoffNotes")}
                />
              </div>

              {/* Map Placeholder */}
              <div className="h-48 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <MapPin className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">Map Preview</p>
                  <p className="text-xs">Route will appear here</p>
                </div>
              </div>

              {/* Additional Stops */}
              <div className="border-t pt-5">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-semibold">Additional Stops</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addStop}
                    className="text-[#3B82F6] border-[#3B82F6]/30 hover:bg-blue-50"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Stop
                  </Button>
                </div>
                {(additionalStops ?? []).map((stop, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border border-gray-100 bg-gray-50/50 mb-3 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">
                        Stop {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStop(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Stop address"
                      value={stop.address}
                      onChange={(e) => {
                        const stops = [...(watchAll.additionalStops ?? [])];
                        stops[index] = { ...stops[index], address: e.target.value };
                        setValue("additionalStops", stops);
                      }}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="Contact name"
                        value={stop.contactName}
                        onChange={(e) => {
                          const stops = [...(watchAll.additionalStops ?? [])];
                          stops[index] = { ...stops[index], contactName: e.target.value };
                          setValue("additionalStops", stops);
                        }}
                      />
                      <Input
                        placeholder="Contact phone"
                        value={stop.contactPhone}
                        onChange={(e) => {
                          const stops = [...(watchAll.additionalStops ?? [])];
                          stops[index] = { ...stops[index], contactPhone: e.target.value };
                          setValue("additionalStops", stops);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Items */}
        {currentStep === 3 && (
          <Card className="rounded-xl shadow-sm border-0 bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-[#0F172A] flex items-center gap-2">
                <Package className="h-5 w-5 text-[#3B82F6]" />
                Item Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label htmlFor="title">Shipment Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Couch delivery, Office move, IKEA pickup"
                  className="mt-1.5"
                  {...register("title")}
                />
              </div>
              <div>
                <Label htmlFor="itemDescription">Item Description *</Label>
                <Textarea
                  id="itemDescription"
                  placeholder="Describe what needs to be shipped: dimensions, material, any special considerations"
                  className="mt-1.5"
                  {...register("itemDescription")}
                />
              </div>

              {/* Size Category */}
              <div>
                <Label className="mb-3 block">Size Category *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {SIZE_OPTIONS.map((size) => (
                    <button
                      key={size.value}
                      type="button"
                      onClick={() => setValue("sizeCategory", size.value)}
                      className={cn(
                        "p-4 rounded-xl border-2 text-left transition-all hover:border-[#3B82F6]/50",
                        watchAll.sizeCategory === size.value
                          ? "border-[#3B82F6] bg-blue-50 shadow-sm"
                          : "border-gray-200"
                      )}
                    >
                      <span className="text-2xl block mb-2">{size.icon}</span>
                      <p className="font-medium text-sm text-[#0F172A]">
                        {size.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                        {size.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimatedWeightLbs">Estimated Weight (lbs)</Label>
                  <Input
                    id="estimatedWeightLbs"
                    type="number"
                    min="0"
                    placeholder="0"
                    className="mt-1.5"
                    {...register("estimatedWeightLbs", { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <Label htmlFor="numItems">Number of Items</Label>
                  <Input
                    id="numItems"
                    type="number"
                    min="1"
                    placeholder="1"
                    className="mt-1.5"
                    {...register("numItems", { valueAsNumber: true })}
                  />
                </div>
              </div>

              {/* Photo Upload */}
              <div>
                <Label className="mb-2 block">Item Photos</Label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#3B82F6]/40 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 font-medium">
                      Click to upload photos
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PNG, JPG up to 10MB each
                    </p>
                  </label>
                </div>
                {photoFiles.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {photoFiles.map((file, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        {file.name}
                        <button
                          type="button"
                          onClick={() =>
                            setPhotoFiles((prev) =>
                              prev.filter((_, idx) => idx !== i)
                            )
                          }
                          className="ml-1 text-gray-400 hover:text-red-500"
                        >
                          &times;
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">Fragile</p>
                      <p className="text-xs text-gray-500">Handle with extra care</p>
                    </div>
                  </div>
                  <Switch
                    checked={watchAll.fragile}
                    onCheckedChange={(val) => setValue("fragile", val)}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">
                        Need Helpers
                      </p>
                      <p className="text-xs text-gray-500">
                        Loading/unloading assistance
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={watchAll.requiresHelpers}
                    onCheckedChange={(val) => setValue("requiresHelpers", val)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="specialInstructions">Special Instructions</Label>
                <Textarea
                  id="specialInstructions"
                  placeholder="Any other details the driver should know"
                  className="mt-1.5"
                  {...register("specialInstructions")}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div className="space-y-4">
            {/* Speed Selection */}
            <Card className="rounded-xl shadow-sm border-0 bg-white">
              <CardHeader>
                <CardTitle className="text-lg text-[#0F172A] flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[#3B82F6]" />
                  Delivery Speed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {SPEED_OPTIONS.map((speed) => (
                    <button
                      key={speed.value}
                      type="button"
                      onClick={() => setValue("deliverySpeed", speed.value)}
                      className={cn(
                        "p-4 rounded-xl border-2 text-left transition-all",
                        watchAll.deliverySpeed === speed.value
                          ? "border-[#3B82F6] bg-blue-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-[#0F172A]">{speed.label}</p>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs",
                            speed.value === "rush"
                              ? "bg-red-100 text-red-700"
                              : speed.value === "same_day"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-gray-100 text-gray-600"
                          )}
                        >
                          {speed.priceMultiplier}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">{speed.description}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="rounded-xl shadow-sm border-0 bg-white">
              <CardHeader>
                <CardTitle className="text-lg text-[#0F172A]">
                  Shipment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-gray-50 space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Pickup
                    </p>
                    <p className="text-sm font-medium text-[#0F172A]">
                      {watchAll.pickupAddress || "Not specified"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {watchAll.pickupContactName} &middot;{" "}
                      {watchAll.pickupContactPhone}
                    </p>
                    <p className="text-xs text-gray-500">
                      {watchAll.pickupDate}{" "}
                      {watchAll.pickupTimeStart &&
                        `${watchAll.pickupTimeStart} - ${watchAll.pickupTimeEnd}`}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50 space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Drop-off
                    </p>
                    <p className="text-sm font-medium text-[#0F172A]">
                      {watchAll.dropoffAddress || "Not specified"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {watchAll.dropoffContactName} &middot;{" "}
                      {watchAll.dropoffContactPhone}
                    </p>
                  </div>
                </div>

                {(additionalStops ?? []).length > 0 && (
                  <div className="p-4 rounded-lg bg-gray-50">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Additional Stops
                    </p>
                    {(additionalStops ?? []).map((stop, i) => (
                      <p key={i} className="text-sm text-[#0F172A]">
                        Stop {i + 1}: {stop.address}
                      </p>
                    ))}
                  </div>
                )}

                <div className="p-4 rounded-lg bg-gray-50 space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Item Details
                  </p>
                  <p className="text-sm font-semibold text-[#0F172A]">
                    {watchAll.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    {watchAll.itemDescription}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary">
                      {SIZE_OPTIONS.find((s) => s.value === watchAll.sizeCategory)
                        ?.label ?? watchAll.sizeCategory}
                    </Badge>
                    {watchAll.estimatedWeightLbs > 0 && (
                      <Badge variant="secondary">
                        {watchAll.estimatedWeightLbs} lbs
                      </Badge>
                    )}
                    <Badge variant="secondary">{watchAll.numItems} item(s)</Badge>
                    {watchAll.fragile && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                        Fragile
                      </Badge>
                    )}
                    {watchAll.requiresHelpers && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        Helpers Needed
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Price Estimate */}
                <div className="p-5 rounded-xl bg-gradient-to-r from-[#0F172A] to-[#1E293B] text-white">
                  <p className="text-sm text-blue-200 mb-1">Estimated Price Range</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(estimatedPriceLow)} &ndash;{" "}
                    {formatCurrency(estimatedPriceHigh)}
                  </p>
                  <p className="text-xs text-blue-300 mt-2">
                    Drivers will submit their own quotes. This is an estimate only.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={submitting}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white gap-2 min-w-[160px]"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Posting...
                </span>
              ) : (
                <>
                  Post Shipment
                  <Check className="h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
