"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  Save,
  Calculator,
  Loader2,
  Info,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { DriverRateCard, SizeCategory, DeliverySpeed } from "@/types/database";

interface RateCardForm {
  base_rate: number;
  per_mile_rate: number;
  size_small_surcharge: number;
  size_medium_surcharge: number;
  size_large_surcharge: number;
  size_oversized_surcharge: number;
  weight_under_50_surcharge: number;
  weight_50_to_150_surcharge: number;
  weight_150_to_500_surcharge: number;
  weight_over_500_surcharge: number;
  multi_stop_per_stop_rate: number;
  rush_multiplier: number;
}

interface PreviewParams {
  distance: number;
  size: SizeCategory;
  weight: number;
  speed: DeliverySpeed;
  additionalStops: number;
}

export default function RateCardPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [preview, setPreview] = useState<PreviewParams>({
    distance: 25,
    size: "medium",
    weight: 100,
    speed: "standard",
    additionalStops: 0,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<RateCardForm>({
    defaultValues: {
      base_rate: 25,
      per_mile_rate: 1.5,
      size_small_surcharge: 0,
      size_medium_surcharge: 10,
      size_large_surcharge: 25,
      size_oversized_surcharge: 50,
      weight_under_50_surcharge: 0,
      weight_50_to_150_surcharge: 10,
      weight_150_to_500_surcharge: 25,
      weight_over_500_surcharge: 50,
      multi_stop_per_stop_rate: 15,
      rush_multiplier: 1.5,
    },
  });

  const watchedValues = watch();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from("driver_rate_cards")
        .select("*")
        .eq("driver_id", user.id)
        .single();

      if (data) {
        setExistingId(data.id);
        reset({
          base_rate: data.base_rate,
          per_mile_rate: data.per_mile_rate,
          size_small_surcharge: data.size_small_surcharge,
          size_medium_surcharge: data.size_medium_surcharge,
          size_large_surcharge: data.size_large_surcharge,
          size_oversized_surcharge: data.size_oversized_surcharge,
          weight_under_50_surcharge: data.weight_under_50_surcharge,
          weight_50_to_150_surcharge: data.weight_50_to_150_surcharge,
          weight_150_to_500_surcharge: data.weight_150_to_500_surcharge,
          weight_over_500_surcharge: data.weight_over_500_surcharge,
          multi_stop_per_stop_rate: data.multi_stop_per_stop_rate,
          rush_multiplier: data.rush_multiplier,
        });
      }
      setLoading(false);
    }
    load();
  }, [reset]);

  function calculatePreviewQuote(values: RateCardForm): number {
    let total = values.base_rate;
    total += preview.distance * values.per_mile_rate;

    const sizeMap: Record<SizeCategory, number> = {
      small: values.size_small_surcharge,
      medium: values.size_medium_surcharge,
      large: values.size_large_surcharge,
      oversized: values.size_oversized_surcharge,
    };
    total += sizeMap[preview.size] || 0;

    if (preview.weight > 500) total += values.weight_over_500_surcharge;
    else if (preview.weight > 150) total += values.weight_150_to_500_surcharge;
    else if (preview.weight > 50) total += values.weight_50_to_150_surcharge;
    else total += values.weight_under_50_surcharge;

    if (preview.speed === "rush") total *= values.rush_multiplier;

    total += preview.additionalStops * values.multi_stop_per_stop_rate;

    return Math.round(total * 100) / 100;
  }

  async function onSubmit(data: RateCardForm) {
    if (!userId) return;
    setSaving(true);
    setSaved(false);
    const supabase = createClient();

    // Convert string values from inputs to numbers
    const payload = {
      driver_id: userId,
      base_rate: Number(data.base_rate),
      per_mile_rate: Number(data.per_mile_rate),
      size_small_surcharge: Number(data.size_small_surcharge),
      size_medium_surcharge: Number(data.size_medium_surcharge),
      size_large_surcharge: Number(data.size_large_surcharge),
      size_oversized_surcharge: Number(data.size_oversized_surcharge),
      weight_under_50_surcharge: Number(data.weight_under_50_surcharge),
      weight_50_to_150_surcharge: Number(data.weight_50_to_150_surcharge),
      weight_150_to_500_surcharge: Number(data.weight_150_to_500_surcharge),
      weight_over_500_surcharge: Number(data.weight_over_500_surcharge),
      multi_stop_per_stop_rate: Number(data.multi_stop_per_stop_rate),
      rush_multiplier: Number(data.rush_multiplier),
    };

    if (existingId) {
      await supabase
        .from("driver_rate_cards")
        .update(payload)
        .eq("id", existingId);
    } else {
      const { data: newCard } = await supabase
        .from("driver_rate_cards")
        .insert(payload)
        .select()
        .single();
      if (newCard) setExistingId(newCard.id);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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
        <h1 className="text-3xl font-bold text-[#0F172A]">Rate Card</h1>
        <p className="mt-1 text-muted-foreground">
          Configure your pricing. These rates are used to auto-calculate quotes
          for available jobs.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Base Rates */}
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#0F172A]">
              <DollarSign className="h-5 w-5" />
              Base Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="base_rate">Base Rate ($)</Label>
              <Input
                id="base_rate"
                type="number"
                step="0.01"
                min="0"
                {...register("base_rate", {
                  required: true,
                  valueAsNumber: true,
                })}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Flat fee charged for every delivery regardless of distance.
              </p>
            </div>
            <div>
              <Label htmlFor="per_mile_rate">Per-Mile Rate ($)</Label>
              <Input
                id="per_mile_rate"
                type="number"
                step="0.01"
                min="0"
                {...register("per_mile_rate", {
                  required: true,
                  valueAsNumber: true,
                })}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Additional charge per mile of estimated distance.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Size Surcharges */}
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="text-[#0F172A]">
              Size Surcharges
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="size_small_surcharge">
                Small ($)
              </Label>
              <Input
                id="size_small_surcharge"
                type="number"
                step="0.01"
                min="0"
                {...register("size_small_surcharge", { valueAsNumber: true })}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Fits in a car trunk (boxes, small furniture)
              </p>
            </div>
            <div>
              <Label htmlFor="size_medium_surcharge">
                Medium ($)
              </Label>
              <Input
                id="size_medium_surcharge"
                type="number"
                step="0.01"
                min="0"
                {...register("size_medium_surcharge", { valueAsNumber: true })}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Requires SUV or small van (appliances, mattress)
              </p>
            </div>
            <div>
              <Label htmlFor="size_large_surcharge">
                Large ($)
              </Label>
              <Input
                id="size_large_surcharge"
                type="number"
                step="0.01"
                min="0"
                {...register("size_large_surcharge", { valueAsNumber: true })}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Requires a cargo van or truck (couch, multiple large items)
              </p>
            </div>
            <div>
              <Label htmlFor="size_oversized_surcharge">
                Oversized ($)
              </Label>
              <Input
                id="size_oversized_surcharge"
                type="number"
                step="0.01"
                min="0"
                {...register("size_oversized_surcharge", {
                  valueAsNumber: true,
                })}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Full-size truck or trailer (pallets, heavy equipment)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Weight Surcharges */}
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="text-[#0F172A]">
              Weight Surcharges
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="weight_under_50_surcharge">
                Under 50 lbs ($)
              </Label>
              <Input
                id="weight_under_50_surcharge"
                type="number"
                step="0.01"
                min="0"
                {...register("weight_under_50_surcharge", {
                  valueAsNumber: true,
                })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="weight_50_to_150_surcharge">
                50 - 150 lbs ($)
              </Label>
              <Input
                id="weight_50_to_150_surcharge"
                type="number"
                step="0.01"
                min="0"
                {...register("weight_50_to_150_surcharge", {
                  valueAsNumber: true,
                })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="weight_150_to_500_surcharge">
                150 - 500 lbs ($)
              </Label>
              <Input
                id="weight_150_to_500_surcharge"
                type="number"
                step="0.01"
                min="0"
                {...register("weight_150_to_500_surcharge", {
                  valueAsNumber: true,
                })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="weight_over_500_surcharge">
                Over 500 lbs ($)
              </Label>
              <Input
                id="weight_over_500_surcharge"
                type="number"
                step="0.01"
                min="0"
                {...register("weight_over_500_surcharge", {
                  valueAsNumber: true,
                })}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Multi-stop & Rush */}
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="text-[#0F172A]">
              Additional Charges
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="multi_stop_per_stop_rate">
                Per Additional Stop ($)
              </Label>
              <Input
                id="multi_stop_per_stop_rate"
                type="number"
                step="0.01"
                min="0"
                {...register("multi_stop_per_stop_rate", {
                  valueAsNumber: true,
                })}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Charged for each additional stop beyond the main route.
              </p>
            </div>
            <div>
              <Label htmlFor="rush_multiplier">Rush Multiplier</Label>
              <Input
                id="rush_multiplier"
                type="number"
                step="0.01"
                min="1"
                {...register("rush_multiplier", {
                  required: true,
                  valueAsNumber: true,
                })}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Total is multiplied by this factor for rush deliveries. e.g. 1.5
                = 50% premium.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <Button
            type="submit"
            className="bg-[#3B82F6] hover:bg-[#2563EB]"
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Rate Card
          </Button>
          {saved && (
            <span className="text-sm font-medium text-emerald-600">
              Saved successfully!
            </span>
          )}
        </div>
      </form>

      {/* Preview Calculator */}
      <Card className="rounded-xl shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0F172A]">
            <Calculator className="h-5 w-5" />
            Quote Preview Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <Label>Distance (miles)</Label>
              <Input
                type="number"
                min="0"
                value={preview.distance}
                onChange={(e) =>
                  setPreview((p) => ({
                    ...p,
                    distance: parseFloat(e.target.value) || 0,
                  }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Size Category</Label>
              <Select
                value={preview.size}
                onValueChange={(v) =>
                  setPreview((p) => ({ ...p, size: v as SizeCategory }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="oversized">Oversized</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Weight (lbs)</Label>
              <Input
                type="number"
                min="0"
                value={preview.weight}
                onChange={(e) =>
                  setPreview((p) => ({
                    ...p,
                    weight: parseFloat(e.target.value) || 0,
                  }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Delivery Speed</Label>
              <Select
                value={preview.speed}
                onValueChange={(v) =>
                  setPreview((p) => ({
                    ...p,
                    speed: v as DeliverySpeed,
                  }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="same_day">Same Day</SelectItem>
                  <SelectItem value="rush">Rush</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Additional Stops</Label>
              <Input
                type="number"
                min="0"
                value={preview.additionalStops}
                onChange={(e) =>
                  setPreview((p) => ({
                    ...p,
                    additionalStops: parseInt(e.target.value) || 0,
                  }))
                }
                className="mt-1"
              />
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              Preview is based on your current form values.
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                Estimated Quote
              </p>
              <p className="text-3xl font-bold text-[#3B82F6]">
                {formatCurrency(calculatePreviewQuote(watchedValues))}
              </p>
              {preview.speed === "rush" && (
                <Badge variant="destructive" className="mt-1">
                  Rush pricing applied
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
