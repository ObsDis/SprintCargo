"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PlusCircle,
  Gavel,
  Clock,
  CreditCard,
  Headphones,
  Search,
  Truck,
  Wallet,
  ChevronDown,
  ChevronRight,
  Menu,
  Settings,
  LogOut,
  Star,
  CreditCard as SubscriptionIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Role = "shipper" | "driver";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  children?: { label: string; href: string }[];
}

// ---------------------------------------------------------------------------
// Navigation definitions
// ---------------------------------------------------------------------------

const shipperNav: NavItem[] = [
  { label: "Create Shipment", href: "/dashboard/shipper/create-shipment", icon: PlusCircle },
  { label: "Shipment Bids", href: "/dashboard/shipper/shipment-bids", icon: Gavel },
  { label: "Shipment History", href: "/dashboard/shipper/shipment-history", icon: Clock },
  { label: "Billing", href: "/dashboard/shipper/billing", icon: CreditCard },
  { label: "Contact Support", href: "/dashboard/shipper/contact-support", icon: Headphones },
];

const driverNav: NavItem[] = [
  { label: "Bids", href: "/dashboard/driver/bids", icon: Search },
  {
    label: "Deliveries",
    href: "/dashboard/driver/deliveries",
    icon: Truck,
    children: [
      { label: "Active", href: "/dashboard/driver/deliveries" },
      { label: "History", href: "/dashboard/driver/deliveries/history" },
    ],
  },
  {
    label: "Payment Settings",
    href: "/dashboard/driver/payment-settings",
    icon: Wallet,
    children: [
      { label: "Bank Info", href: "/dashboard/driver/payment-settings" },
      { label: "Disbursements", href: "/dashboard/driver/payment-settings/disbursements" },
    ],
  },
  { label: "Contact Support", href: "/dashboard/driver/contact-support", icon: Headphones },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 px-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3B82F6]">
        <span className="text-sm font-bold text-white">SC</span>
      </div>
      <span className="text-lg font-bold text-[#0F172A]">
        Sprint<span className="text-[#3B82F6]">Cargo</span>
      </span>
    </Link>
  );
}

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const [expanded, setExpanded] = useState(() => {
    if (!item.children) return false;
    return item.children.some((child) => pathname === child.href) || pathname === item.href;
  });

  const Icon = item.icon;
  const isActive =
    pathname === item.href ||
    (item.children?.some((child) => pathname === child.href) ?? false);

  if (item.children) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive
              ? "bg-[#3B82F6]/10 text-[#3B82F6]"
              : "text-gray-600 hover:bg-gray-100 hover:text-[#0F172A]"
          )}
        >
          <Icon className="size-5 shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          {expanded ? (
            <ChevronDown className="size-4 shrink-0" />
          ) : (
            <ChevronRight className="size-4 shrink-0" />
          )}
        </button>
        {expanded && (
          <div className="ml-8 mt-1 flex flex-col gap-0.5 border-l border-gray-200 pl-3">
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNavigate}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  pathname === child.href
                    ? "font-medium text-[#3B82F6]"
                    : "text-gray-500 hover:text-[#0F172A]"
                )}
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-[#3B82F6]/10 text-[#3B82F6]"
          : "text-gray-600 hover:bg-gray-100 hover:text-[#0F172A]"
      )}
    >
      <Icon className="size-5 shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

function ProfileDropdown({ role }: { role: Role }) {
  const driverItems = (
    <>
      <DropdownMenuItem render={<Link href={`/dashboard/${role}/settings`} />}>
        <Settings className="size-4" />
        Settings
      </DropdownMenuItem>
      <DropdownMenuItem render={<Link href="/dashboard/driver/rate-card" />}>
        <Star className="size-4" />
        Rate Card
      </DropdownMenuItem>
      <DropdownMenuItem render={<Link href="/dashboard/driver/subscription" />}>
        <SubscriptionIcon className="size-4" />
        Subscription
      </DropdownMenuItem>
    </>
  );

  const shipperItems = (
    <DropdownMenuItem render={<Link href={`/dashboard/${role}/settings`} />}>
      <Settings className="size-4" />
      Settings
    </DropdownMenuItem>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-gray-100"
      >
        <Avatar size="sm">
          <AvatarFallback className="bg-[#3B82F6] text-xs text-white">
            U
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 truncate">
          <p className="truncate text-sm font-medium text-[#0F172A]">User Name</p>
          <p className="truncate text-xs text-gray-500">
            {role === "shipper" ? "Shipper" : "Driver"}
          </p>
        </div>
        <ChevronDown className="size-4 shrink-0 text-gray-400" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" sideOffset={8}>
        {role === "driver" ? driverItems : shipperItems}
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/auth/logout" />}>
          <LogOut className="size-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// Sidebar content (reused in both desktop + mobile sheet)
// ---------------------------------------------------------------------------

function SidebarContent({
  role,
  pathname,
  onNavigate,
}: {
  role: Role;
  pathname: string;
  onNavigate?: () => void;
}) {
  const navItems = role === "shipper" ? shipperNav : driverNav;

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center px-4">
        <Logo />
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* Divider + Profile */}
      <div className="px-3">
        <Separator className="mb-2" />
      </div>
      <div className="px-3 pb-4">
        <ProfileDropdown role={role} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exported component
// ---------------------------------------------------------------------------

interface DashboardSidebarProps {
  role: Role;
}

export function DashboardSidebar({ role }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white lg:block">
        <SidebarContent role={role} pathname={pathname} />
      </aside>

      {/* Mobile top bar + sheet */}
      <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon-sm" />
            }
          >
            <Menu className="size-5" />
            <span className="sr-only">Open sidebar</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarContent
              role={role}
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
        <Logo />
      </div>
    </>
  );
}
