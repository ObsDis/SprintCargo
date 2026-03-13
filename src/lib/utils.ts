import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import type { DriverRateCard, DeliverySpeed, SizeCategory } from "@/types/database";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as USD currency.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format an ISO date string or Date using date-fns.
 */
export function formatDate(date: string | Date, pattern = "MMM d, yyyy"): string {
  return format(new Date(date), pattern);
}

/**
 * Format a date relative to now (e.g., "3 minutes ago").
 */
export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/**
 * Format a distance in miles to a human-readable string.
 */
export function formatDistance(miles: number): string {
  if (miles < 0.1) {
    return `${Math.round(miles * 5280)} ft`;
  }
  return `${miles.toFixed(1)} mi`;
}

/**
 * Calculate a quote amount from a driver's rate card and job parameters.
 */
export function calculateQuoteFromRateCard(
  rateCard: DriverRateCard,
  params: {
    distanceMiles: number;
    sizeCategory: SizeCategory;
    estimatedWeightLbs: number;
    deliverySpeed: DeliverySpeed;
    additionalStops: number;
  }
): number {
  let amount = rateCard.base_rate;

  // Distance charge
  amount += rateCard.per_mile_rate * params.distanceMiles;

  // Size surcharge
  const sizeSurcharges: Record<SizeCategory, number> = {
    small: rateCard.size_small_surcharge,
    medium: rateCard.size_medium_surcharge,
    large: rateCard.size_large_surcharge,
    oversized: rateCard.size_oversized_surcharge,
  };
  amount += sizeSurcharges[params.sizeCategory];

  // Weight surcharge
  const weight = params.estimatedWeightLbs;
  if (weight <= 50) {
    amount += rateCard.weight_under_50_surcharge;
  } else if (weight <= 150) {
    amount += rateCard.weight_50_to_150_surcharge;
  } else if (weight <= 500) {
    amount += rateCard.weight_150_to_500_surcharge;
  } else {
    amount += rateCard.weight_over_500_surcharge;
  }

  // Multi-stop surcharge
  if (params.additionalStops > 0) {
    amount += rateCard.multi_stop_per_stop_rate * params.additionalStops;
  }

  // Rush multiplier
  if (params.deliverySpeed === "rush") {
    amount *= rateCard.rush_multiplier;
  } else if (params.deliverySpeed === "same_day") {
    // Same-day gets half the rush premium
    const sameDayMultiplier = 1 + (rateCard.rush_multiplier - 1) / 2;
    amount *= sameDayMultiplier;
  }

  return Math.round(amount * 100) / 100;
}
