import type { Metadata } from "next";
import Link from "next/link";
import {
  Package,
  Search,
  MapPin,
  DollarSign,
  Briefcase,
  Truck,
  Camera,
  Shield,
  Eye,
  Users,
  ArrowRight,
  Check,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "SprintCargo - Cargo Van Delivery Marketplace",
  description:
    "Delivery platforms take up to 30% of every job. We charge drivers $99/month. That's it. Lower costs for drivers means lower prices for you.",
};

const shipperSteps = [
  {
    icon: Package,
    title: "Post Your Delivery",
    description:
      "Describe what you need moved, where it's going, and when. Get an instant price estimate.",
  },
  {
    icon: Search,
    title: "Compare Driver Quotes",
    description:
      "Receive competitive quotes from verified local drivers. Review ratings, prices, and ETAs.",
  },
  {
    icon: MapPin,
    title: "Track & Receive",
    description:
      "Follow your delivery in real-time. Driver takes photos at pickup and delivery for your peace of mind.",
  },
];

const driverSteps = [
  {
    icon: DollarSign,
    title: "Set Your Rates",
    description:
      "Build your pricing profile. You decide what to charge based on distance, size, and speed.",
  },
  {
    icon: Briefcase,
    title: "Choose Your Jobs",
    description:
      "Browse available deliveries in your area. Quote on the ones that work for you.",
  },
  {
    icon: Truck,
    title: "Deliver & Get Paid",
    description:
      "Complete the delivery, snap your photos, and get paid. We pass through 100% of the price minus credit card fees (2.9% + $0.30).",
  },
];

const features = [
  {
    icon: DollarSign,
    title: "Drivers keep more",
    description:
      "No 20-30% platform commission. Flat $99/month. Every dollar you earn above that stays in your pocket.",
  },
  {
    icon: Users,
    title: "Shippers save money",
    description:
      "When drivers keep more, they charge less. Simple economics. Lower platform costs mean lower delivery prices for you.",
  },
  {
    icon: Eye,
    title: "Transparent pricing",
    description:
      "Drivers set their own rates. Shippers see multiple quotes. No hidden fees, no surge pricing, no surprises.",
  },
  {
    icon: Shield,
    title: "Built-in trust",
    description:
      "Mandatory pickup and delivery photos. Real-time GPS tracking. Verified drivers. Every delivery is documented.",
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(59,130,246,0.15),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(59,130,246,0.1),_transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-4 py-1.5 text-sm text-[#3B82F6]">
              <Star className="size-4" />
              The fair delivery marketplace
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Sprint<span className="text-[#3B82F6]">Cargo</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-300 sm:text-xl">
              Delivery platforms take up to 30% of every job. We charge drivers
              $99/month. That&apos;s it. Lower costs for drivers means lower
              prices for you.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="h-12 gap-2 rounded-lg bg-[#3B82F6] px-8 text-base font-semibold text-white hover:bg-[#2563EB]"
                render={<Link href="/auth/signup?role=driver" />}
              >
                I&apos;m a Driver
                <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 gap-2 rounded-lg border-gray-600 px-8 text-base font-semibold text-white hover:bg-white/10 hover:text-white"
                render={<Link href="/auth/signup?role=shipper" />}
              >
                Send a Package
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
        {/* Bottom gradient fade */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* How It Works - For Shippers */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#3B82F6]">
              For Shippers
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Get your items delivered in three simple steps.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            {shipperSteps.map((step, index) => (
              <div key={step.title} className="relative text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#3B82F6]/10">
                  <step.icon className="size-8 text-[#3B82F6]" />
                </div>
                <div className="absolute -top-2 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-[#3B82F6] text-xs font-bold text-white">
                  {index + 1}
                </div>
                <h3 className="mt-6 text-lg font-semibold text-[#0F172A]">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - For Drivers */}
      <section className="bg-[#F8FAFC] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#3B82F6]">
              For Drivers
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Set your own rates, choose your jobs, and keep what you earn.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            {driverSteps.map((step, index) => (
              <div key={step.title} className="relative text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0F172A]/10">
                  <step.icon className="size-8 text-[#0F172A]" />
                </div>
                <div className="absolute -top-2 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-[#0F172A] text-xs font-bold text-white">
                  {index + 1}
                </div>
                <h3 className="mt-6 text-lg font-semibold text-[#0F172A]">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why SprintCargo */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">
              Why SprintCargo
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              A marketplace built on fairness, transparency, and trust.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="border-0 bg-white shadow-md transition-shadow hover:shadow-lg"
              >
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#3B82F6]/10">
                    <feature.icon className="size-6 text-[#3B82F6]" />
                  </div>
                  <CardTitle className="mt-4 text-lg font-semibold text-[#0F172A]">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-gray-600">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-[#F8FAFC] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">
              Simple, Fair Pricing
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              No commissions. No hidden fees. Just a flat monthly rate for
              drivers.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
            {/* Shipper Card */}
            <Card className="border-0 bg-white shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-xl font-bold text-[#0F172A]">
                  For Shippers
                </CardTitle>
                <CardDescription className="text-gray-500">
                  Send packages with confidence
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mt-2">
                  <span className="text-5xl font-bold text-[#0F172A]">
                    Free
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Always free to post deliveries
                </p>
                <ul className="mt-8 space-y-3 text-left text-sm">
                  {[
                    "Post unlimited deliveries",
                    "Receive multiple driver quotes",
                    "Real-time tracking",
                    "Photo proof of delivery",
                    "Ratings & reviews",
                    "Secure payment processing",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-[#22C55E]" />
                      <span className="text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  size="lg"
                  className="mt-8 w-full rounded-lg bg-[#3B82F6] text-white hover:bg-[#2563EB]"
                  render={<Link href="/auth/signup?role=shipper" />}
                >
                  Get Started Free
                </Button>
              </CardContent>
            </Card>

            {/* Driver Card */}
            <Card className="relative border-2 border-[#3B82F6] bg-white shadow-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#3B82F6] px-4 py-1 text-xs font-semibold text-white">
                Most Popular
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-xl font-bold text-[#0F172A]">
                  For Drivers
                </CardTitle>
                <CardDescription className="text-gray-500">
                  Keep what you earn
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mt-2">
                  <span className="text-5xl font-bold text-[#0F172A]">
                    $99
                  </span>
                  <span className="text-lg text-gray-500">/month</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  7-day free trial to get started
                </p>
                <ul className="mt-8 space-y-3 text-left text-sm">
                  {[
                    "Zero commission on deliveries",
                    "Set your own rates",
                    "Choose your own jobs",
                    "Instant job notifications",
                    "Built-in navigation",
                    "Photo verification tools",
                    "Direct deposit payouts",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-[#22C55E]" />
                      <span className="text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  size="lg"
                  className="mt-8 w-full rounded-lg bg-[#0F172A] text-white hover:bg-[#1E293B]"
                  render={<Link href="/auth/signup?role=driver" />}
                >
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to deliver smarter?
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            Join the marketplace where drivers keep more and shippers pay less.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="h-12 gap-2 rounded-lg bg-[#3B82F6] px-8 text-base font-semibold text-white hover:bg-[#2563EB]"
              render={<Link href="/auth/signup?role=driver" />}
            >
              I&apos;m a Driver
              <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 gap-2 rounded-lg border-gray-600 px-8 text-base font-semibold text-white hover:bg-white/10 hover:text-white"
              render={<Link href="/auth/signup?role=shipper" />}
            >
              Send a Package
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
