"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "For Drivers", href: "/for-drivers" },
  { label: "FAQ", href: "/faq" },
] as const;

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F172A]">
            <span className="text-sm font-bold text-white">SC</span>
          </div>
          <span className="text-xl font-bold text-[#0F172A]">
            Sprint<span className="text-[#3B82F6]">Cargo</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-[#0F172A]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" size="sm" render={<Link href="/auth/login" />}>
            Login
          </Button>
          <Button
            size="sm"
            className="bg-[#3B82F6] text-white hover:bg-[#2563EB]"
            render={<Link href="/auth/signup" />}
          >
            Sign Up
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "overflow-hidden border-t border-gray-100 bg-white transition-all duration-200 md:hidden",
          mobileMenuOpen ? "max-h-80" : "max-h-0 border-t-0"
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-[#0F172A]"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t border-gray-100 pt-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center"
              render={<Link href="/auth/login" />}
            >
              Login
            </Button>
            <Button
              size="sm"
              className="w-full justify-center bg-[#3B82F6] text-white hover:bg-[#2563EB]"
              render={<Link href="/auth/signup" />}
            >
              Sign Up
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
