import { JobStatus, SizeCategory, DeliverySpeed } from "../types/database";

export const COLORS = {
  navy: "#0F172A",
  blue: "#3B82F6",
  blueDark: "#2563EB",
  blueLight: "#DBEAFE",
  white: "#FFFFFF",
  lightGray: "#F8FAFC",
  gray100: "#F1F5F9",
  gray200: "#E2E8F0",
  gray300: "#CBD5E1",
  gray400: "#94A3B8",
  gray500: "#64748B",
  gray600: "#475569",
  gray700: "#334155",
  green: "#22C55E",
  greenLight: "#DCFCE7",
  red: "#EF4444",
  redLight: "#FEE2E2",
  orange: "#F97316",
  orangeLight: "#FFF7ED",
  yellow: "#EAB308",
  yellowLight: "#FEF9C3",
} as const;

export const JOB_STATUS_CONFIG: Record<
  JobStatus,
  { label: string; color: string; bgColor: string }
> = {
  draft: { label: "Draft", color: COLORS.gray500, bgColor: COLORS.gray100 },
  posted: { label: "Posted", color: COLORS.blue, bgColor: COLORS.blueLight },
  quoted: { label: "Quoted", color: COLORS.blue, bgColor: COLORS.blueLight },
  accepted: {
    label: "Accepted",
    color: COLORS.green,
    bgColor: COLORS.greenLight,
  },
  driver_en_route_pickup: {
    label: "En Route to Pickup",
    color: COLORS.orange,
    bgColor: COLORS.orangeLight,
  },
  at_pickup: {
    label: "At Pickup",
    color: COLORS.orange,
    bgColor: COLORS.orangeLight,
  },
  loaded: {
    label: "Loaded",
    color: COLORS.orange,
    bgColor: COLORS.orangeLight,
  },
  in_transit: {
    label: "In Transit",
    color: COLORS.blue,
    bgColor: COLORS.blueLight,
  },
  at_dropoff: {
    label: "At Dropoff",
    color: COLORS.orange,
    bgColor: COLORS.orangeLight,
  },
  delivered: {
    label: "Delivered",
    color: COLORS.green,
    bgColor: COLORS.greenLight,
  },
  completed: {
    label: "Completed",
    color: COLORS.green,
    bgColor: COLORS.greenLight,
  },
  cancelled: { label: "Cancelled", color: COLORS.red, bgColor: COLORS.redLight },
  disputed: { label: "Disputed", color: COLORS.red, bgColor: COLORS.redLight },
};

export const SIZE_CATEGORY_LABELS: Record<SizeCategory, string> = {
  small: "Small (fits in a car)",
  medium: "Medium (SUV / minivan)",
  large: "Large (cargo van / pickup truck)",
  oversized: "Oversized (box truck)",
};

export const SIZE_CATEGORY_ICONS: Record<SizeCategory, string> = {
  small: "cube-outline",
  medium: "car-outline",
  large: "bus-outline",
  oversized: "train-outline",
};

export const DELIVERY_SPEED_LABELS: Record<DeliverySpeed, string> = {
  standard: "Standard (1-3 days)",
  same_day: "Same Day",
  rush: "Rush (2-4 hours)",
};

export const DELIVERY_SPEED_COLORS: Record<DeliverySpeed, string> = {
  standard: COLORS.gray500,
  same_day: COLORS.orange,
  rush: COLORS.red,
};

export const DRIVER_DELIVERY_STEPS: {
  status: JobStatus;
  label: string;
}[] = [
  { status: "accepted", label: "Accepted" },
  { status: "driver_en_route_pickup", label: "En Route to Pickup" },
  { status: "at_pickup", label: "At Pickup" },
  { status: "loaded", label: "Loaded" },
  { status: "in_transit", label: "In Transit" },
  { status: "at_dropoff", label: "At Dropoff" },
  { status: "delivered", label: "Delivered" },
];

export const ACTIVE_DELIVERY_STATUSES: JobStatus[] = [
  "accepted",
  "driver_en_route_pickup",
  "at_pickup",
  "loaded",
  "in_transit",
  "at_dropoff",
];

export const LOCATION_TRACKING_INTERVAL_MS = 10_000;
export const PLATFORM_FEE_PERCENTAGE = 0.15;
