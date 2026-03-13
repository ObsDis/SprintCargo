import type { Metadata } from "next";
import Link from "next/link";
import {
  DollarSign,
  Clock,
  MapPin,
  Shield,
  BarChart3,
  Smartphone,
  ArrowRight,
  Check,
  X,
  TrendingUp,
  Zap,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "For Drivers",
  description:
    "Stop losing 20-30% of every delivery to platform fees. SprintCargo charges a flat $99/month. Keep what you earn.",
};

const benefits = [
  {
    icon: DollarSign,
    title: "Zero commissions",
    description:
      "No percentage cut from your deliveries. Your flat $99/month subscription is the only platform cost you pay.",
  },
  {
    icon: Clock,
    title: "Work on your schedule",
    description:
      "Set your own hours, define your service area, and toggle availability on or off whenever you want.",
  },
  {
    icon: BarChart3,
    title: "Set your own rates",
    description:
      "You decide what to charge. Build a pricing profile based on distance, cargo size, and delivery speed.",
  },
  {
    icon: MapPin,
    title: "Choose your jobs",
    description:
      "Browse available deliveries and quote only on the ones that make sense for your route and schedule.",
  },
  {
    icon: Smartphone,
    title: "Professional tools",
    description:
      "Built-in navigation, photo documentation, in-app messaging, mileage tracking, and earnings reports.",
  },
  {
    icon: Shield,
    title: "Fair dispute resolution",
    description:
      "Photo documentation at pickup and delivery protects you if a shipper makes a false claim about damaged goods.",
  },
  {
    icon: TrendingUp,
    title: "Earnings dashboard",
    description:
      "Track your income, expenses, completed jobs, and ratings all in one place. Download reports for tax time.",
  },
  {
    icon: Users,
    title: "Build your reputation",
    description:
      "Your ratings, reviews, and delivery count are visible to shippers. Great service means more accepted quotes.",
  },
];

export default function ForDriversPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#22C55E]/30 bg-[#22C55E]/10 px-4 py-1.5 text-sm text-[#22C55E]">
              <Zap className="size-4" />
              Keep more of every dollar
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Stop Giving Away{" "}
              <span className="text-[#EF4444]">30%</span> of
              Your Earnings
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Other platforms take 20-30% of every job you complete.
              SprintCargo charges a flat $99/month. No commissions, no
              per-job fees. You keep what you earn.
            </p>
            <div className="mt-10">
              <Button
                size="lg"
                className="h-12 gap-2 rounded-lg bg-[#3B82F6] px-8 text-base font-semibold text-white hover:bg-[#2563EB]"
                render={<Link href="/auth/signup?role=driver" />}
              >
                Start Your Free Trial
                <ArrowRight className="size-4" />
              </Button>
              <p className="mt-3 text-sm text-gray-400">
                7-day free trial. No credit card required to start.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Rate Comparison Calculator */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">
              See the Difference
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Here is what you actually take home on a $150 delivery.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Traditional Platform */}
            <Card className="border-2 border-[#EF4444]/20 bg-red-50/30">
              <CardHeader className="text-center">
                <CardTitle className="text-lg text-[#0F172A]">
                  Traditional Platforms
                </CardTitle>
                <p className="text-sm text-gray-500">
                  (Roadie, GoShare, etc.)
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Delivery price</span>
                  <span className="font-semibold text-[#0F172A]">$150.00</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Platform commission (25%)
                  </span>
                  <span className="font-semibold text-[#EF4444]">-$37.50</span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#0F172A]">
                      You keep
                    </span>
                    <span className="text-2xl font-bold text-[#EF4444]">
                      $112.50
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-red-100/50 px-3 py-2 text-xs text-[#EF4444]">
                  <X className="size-3.5 shrink-0" />
                  You lose $37.50 on every $150 job
                </div>
              </CardContent>
            </Card>

            {/* SprintCargo */}
            <Card className="border-2 border-[#22C55E]/30 bg-green-50/30 shadow-lg lg:scale-105">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#22C55E] px-4 py-1 text-xs font-semibold text-white">
                SprintCargo
              </div>
              <CardHeader className="text-center pt-6">
                <CardTitle className="text-lg text-[#0F172A]">
                  SprintCargo
                </CardTitle>
                <p className="text-sm text-gray-500">Flat $99/month</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Delivery price</span>
                  <span className="font-semibold text-[#0F172A]">$150.00</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Platform commission</span>
                  <span className="font-semibold text-[#22C55E]">$0.00</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Processing fee (2.9% + $0.30)
                  </span>
                  <span className="font-semibold text-gray-500">-$4.65</span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#0F172A]">
                      You keep
                    </span>
                    <span className="text-2xl font-bold text-[#22C55E]">
                      $145.35
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-green-100/50 px-3 py-2 text-xs text-[#22C55E]">
                  <Check className="size-3.5 shrink-0" />
                  You keep $32.85 more per job
                </div>
              </CardContent>
            </Card>

            {/* Monthly Comparison */}
            <Card className="border-0 bg-[#F8FAFC] shadow-md">
              <CardHeader className="text-center">
                <CardTitle className="text-lg text-[#0F172A]">
                  Monthly Impact
                </CardTitle>
                <p className="text-sm text-gray-500">
                  At 20 deliveries/month ($150 avg)
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Traditional Platform
                  </p>
                  <p className="mt-1 text-xl font-bold text-[#0F172A]">
                    $2,250.00
                  </p>
                  <p className="text-xs text-gray-500">
                    Lost to commissions: $750.00
                  </p>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    SprintCargo
                  </p>
                  <p className="mt-1 text-xl font-bold text-[#22C55E]">
                    $2,807.00
                  </p>
                  <p className="text-xs text-gray-500">
                    Costs: $99 subscription + $93 processing
                  </p>
                </div>
                <div className="rounded-xl bg-[#22C55E]/10 px-4 py-3 text-center">
                  <p className="text-xs font-medium text-[#22C55E]">
                    Extra earnings with SprintCargo
                  </p>
                  <p className="text-2xl font-bold text-[#22C55E]">
                    +$557/mo
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="bg-[#F8FAFC] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">
              Everything You Need to Succeed
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              SprintCargo gives you the tools and freedom to run your delivery
              business the way you want.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => (
              <Card
                key={benefit.title}
                className="border-0 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <CardContent className="pt-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3B82F6]/10">
                    <benefit.icon className="size-5 text-[#3B82F6]" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-[#0F172A]">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-gray-600">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Side by Side Comparison */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">
              SprintCargo vs. Traditional Platforms
            </h2>
          </div>
          <div className="mx-auto mt-16 max-w-3xl overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC]">
                  <th className="px-6 py-4 text-left font-semibold text-[#0F172A]">
                    Feature
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-[#3B82F6]">
                    SprintCargo
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-400">
                    Others
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ["Commission per job", "0%", "20-30%"],
                  ["Set your own rates", true, false],
                  ["Choose your jobs", true, false],
                  ["Photo documentation", true, "Varies"],
                  ["Real-time tracking", true, true],
                  ["Direct deposit", true, true],
                  ["Earnings dashboard", true, "Varies"],
                  ["Monthly cost", "$99/mo", "Free*"],
                  ["Cost on $150 job", "$4.65", "$37.50+"],
                ].map(([feature, sprint, other]) => (
                  <tr key={feature as string} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 font-medium text-[#0F172A]">
                      {feature as string}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {sprint === true ? (
                        <Check className="mx-auto size-5 text-[#22C55E]" />
                      ) : sprint === false ? (
                        <X className="mx-auto size-5 text-[#EF4444]" />
                      ) : (
                        <span className="font-semibold text-[#22C55E]">
                          {sprint as string}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {other === true ? (
                        <Check className="mx-auto size-5 text-[#22C55E]" />
                      ) : other === false ? (
                        <X className="mx-auto size-5 text-[#EF4444]" />
                      ) : (
                        <span className="text-gray-500">
                          {other as string}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="bg-[#F8FAFC] px-6 py-3 text-xs text-gray-500">
              * Traditional platforms are &ldquo;free&rdquo; to join but take
              20-30% of every delivery, costing far more over time.
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Start keeping what you earn
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            Sign up today and try SprintCargo free for 7 days. No credit card
            required. Cancel anytime.
          </p>
          <div className="mt-10">
            <Button
              size="lg"
              className="h-12 gap-2 rounded-lg bg-[#3B82F6] px-8 text-base font-semibold text-white hover:bg-[#2563EB]"
              render={<Link href="/auth/signup?role=driver" />}
            >
              Start Your Free Trial
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
