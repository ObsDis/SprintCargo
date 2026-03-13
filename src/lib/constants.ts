import type {
  SizeCategory,
  DeliverySpeed,
  JobStatus,
  QuoteStatus,
} from "@/types/database";

// ---------------------------------------------------------------------------
// Size Categories
// ---------------------------------------------------------------------------

export const SIZE_CATEGORIES: Record<
  SizeCategory,
  { label: string; description: string }
> = {
  small: {
    label: "Small",
    description: "Fits in a car trunk (e.g., boxes, small furniture pieces)",
  },
  medium: {
    label: "Medium",
    description: "Requires an SUV or small van (e.g., appliances, mattress)",
  },
  large: {
    label: "Large",
    description: "Requires a cargo van or truck (e.g., couch, multiple large items)",
  },
  oversized: {
    label: "Oversized",
    description: "Requires a full-size truck or trailer (e.g., pallets, heavy equipment)",
  },
};

// ---------------------------------------------------------------------------
// Delivery Speeds
// ---------------------------------------------------------------------------

export const DELIVERY_SPEEDS: Record<
  DeliverySpeed,
  { label: string; description: string }
> = {
  standard: {
    label: "Standard",
    description: "Flexible timing, typically within 2-5 days",
  },
  same_day: {
    label: "Same Day",
    description: "Delivered the same day the job is posted",
  },
  rush: {
    label: "Rush",
    description: "Picked up within 2 hours of acceptance",
  },
};

// ---------------------------------------------------------------------------
// Job Statuses
// ---------------------------------------------------------------------------

export const JOB_STATUSES: Record<
  JobStatus,
  { label: string; color: string }
> = {
  draft: { label: "Draft", color: "gray" },
  posted: { label: "Posted", color: "blue" },
  quoted: { label: "Quoted", color: "indigo" },
  accepted: { label: "Accepted", color: "purple" },
  driver_en_route_pickup: { label: "Driver En Route", color: "yellow" },
  at_pickup: { label: "At Pickup", color: "orange" },
  loaded: { label: "Loaded", color: "amber" },
  in_transit: { label: "In Transit", color: "cyan" },
  at_dropoff: { label: "At Dropoff", color: "teal" },
  delivered: { label: "Delivered", color: "green" },
  completed: { label: "Completed", color: "emerald" },
  cancelled: { label: "Cancelled", color: "red" },
  disputed: { label: "Disputed", color: "rose" },
};

// ---------------------------------------------------------------------------
// Quote Statuses
// ---------------------------------------------------------------------------

export const QUOTE_STATUSES: Record<
  QuoteStatus,
  { label: string; color: string }
> = {
  pending: { label: "Pending", color: "yellow" },
  countered_by_shipper: { label: "Counter (Shipper)", color: "blue" },
  countered_by_driver: { label: "Counter (Driver)", color: "indigo" },
  accepted: { label: "Accepted", color: "green" },
  declined: { label: "Declined", color: "red" },
  expired: { label: "Expired", color: "gray" },
  withdrawn: { label: "Withdrawn", color: "gray" },
};

// ---------------------------------------------------------------------------
// Navigation Items
// ---------------------------------------------------------------------------

export interface NavItem {
  label: string;
  href: string;
  icon: string; // Lucide icon name
}

export const SHIPPER_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Post a Job", href: "/dashboard/jobs/new", icon: "Plus" },
  { label: "My Jobs", href: "/dashboard/jobs", icon: "Package" },
  { label: "Quotes", href: "/dashboard/quotes", icon: "MessageSquare" },
  { label: "Tracking", href: "/dashboard/tracking", icon: "MapPin" },
  { label: "Payments", href: "/dashboard/payments", icon: "CreditCard" },
  { label: "Reviews", href: "/dashboard/reviews", icon: "Star" },
  { label: "Support", href: "/dashboard/support", icon: "HelpCircle" },
  { label: "Settings", href: "/dashboard/settings", icon: "Settings" },
];

export const DRIVER_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Available Jobs", href: "/dashboard/jobs/available", icon: "Search" },
  { label: "My Jobs", href: "/dashboard/jobs", icon: "Truck" },
  { label: "My Quotes", href: "/dashboard/quotes", icon: "MessageSquare" },
  { label: "Rate Card", href: "/dashboard/rate-card", icon: "DollarSign" },
  { label: "Earnings", href: "/dashboard/earnings", icon: "Wallet" },
  { label: "Reviews", href: "/dashboard/reviews", icon: "Star" },
  { label: "Vehicle", href: "/dashboard/vehicle", icon: "Car" },
  { label: "Support", href: "/dashboard/support", icon: "HelpCircle" },
  { label: "Settings", href: "/dashboard/settings", icon: "Settings" },
];
