import type { Metadata } from "next";
import Link from "next/link";
import {
  ClipboardList,
  MapPin,
  Bell,
  MessageSquare,
  Camera,
  Star,
  DollarSign,
  Search,
  Truck,
  CreditCard,
  Shield,
  BarChart3,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Learn exactly how SprintCargo works for both shippers and drivers. Post deliveries, get quotes, track in real-time, and get paid.",
};

const shipperSteps = [
  {
    icon: ClipboardList,
    title: "1. Create Your Delivery Request",
    description:
      "Start by describing what you need delivered. Enter the pickup address, drop-off address, package dimensions and weight, and your preferred delivery window. Our system calculates an instant price estimate based on distance, package size, and urgency so you know roughly what to expect before any driver quotes come in.",
    details: [
      "Add photos of your items for driver clarity",
      "Specify handling requirements (fragile, keep upright, etc.)",
      "Choose standard, same-day, or rush delivery",
      "Set your budget range or let drivers compete openly",
    ],
  },
  {
    icon: Search,
    title: "2. Review and Compare Quotes",
    description:
      "Once your request is live, verified drivers in your area receive a notification and can submit quotes. Each quote includes the driver's proposed price, estimated pickup time, expected delivery window, and their profile with ratings from previous deliveries. You compare quotes side by side and choose the driver that best fits your needs.",
    details: [
      "See driver ratings, reviews, and completed delivery count",
      "Compare prices from multiple drivers simultaneously",
      "View estimated pickup and delivery times",
      "Message drivers directly to ask questions before accepting",
    ],
  },
  {
    icon: Bell,
    title: "3. Confirm and Coordinate Pickup",
    description:
      "Accept the quote that works for you. The driver receives an instant notification and confirms they are on their way. You receive real-time updates as the driver heads to the pickup location. When they arrive, the driver inspects and photographs your items to document their condition before loading.",
    details: [
      "Receive push notifications at every stage",
      "See the driver's live location on a map",
      "Driver photographs items at pickup for your records",
      "Confirm pickup details through the app",
    ],
  },
  {
    icon: MapPin,
    title: "4. Track Your Delivery in Real-Time",
    description:
      "Follow your delivery from pickup to drop-off with live GPS tracking. You can see exactly where your items are at any moment, get updated ETAs as the driver progresses, and receive notifications when they are approaching the destination. No more wondering where your package is or when it will arrive.",
    details: [
      "Live GPS tracking on an interactive map",
      "Automatic ETA updates based on real traffic",
      "Push notifications for key milestones",
      "Direct messaging with your driver en route",
    ],
  },
  {
    icon: Camera,
    title: "5. Receive and Confirm Delivery",
    description:
      "When the driver arrives at the destination, they photograph the delivered items as proof of completion. You receive a notification with the delivery photos and can confirm that everything arrived in good condition. Once you confirm, payment is released to the driver and you can leave a rating and review.",
    details: [
      "Delivery photos serve as proof of completion",
      "Confirm delivery condition through the app",
      "Rate and review your driver's service",
      "Download delivery receipt for your records",
    ],
  },
];

const driverSteps = [
  {
    icon: DollarSign,
    title: "1. Build Your Pricing Profile",
    description:
      "Set up your pricing structure so the platform can match you with the right jobs. Define your base rates for different distances, size categories, and delivery speeds. You maintain full control over what you charge. You can update your rates at any time based on fuel costs, demand, or any other factor you choose.",
    details: [
      "Set rates by distance tier (local, regional, long-haul)",
      "Define pricing for different cargo sizes",
      "Add rush delivery premiums",
      "Adjust rates anytime as costs change",
    ],
  },
  {
    icon: BarChart3,
    title: "2. Configure Your Availability",
    description:
      "Tell SprintCargo when and where you want to work. Set your operating hours, define your service area on the map, and specify what types of deliveries you can handle based on your vehicle. The platform only sends you jobs that match your availability, location, and capabilities.",
    details: [
      "Set daily operating hours and days off",
      "Draw your service area on an interactive map",
      "Specify vehicle type, capacity, and capabilities",
      "Toggle availability on and off instantly",
    ],
  },
  {
    icon: Search,
    title: "3. Browse and Quote on Jobs",
    description:
      "When a shipper posts a delivery that matches your profile, you receive a notification with all the details: pickup and drop-off locations, package size and weight, preferred timing, and any special instructions. Review the job, calculate your costs, and submit a competitive quote. You decide whether a job is worth your time.",
    details: [
      "Receive instant notifications for matching jobs",
      "See full job details before committing",
      "Submit custom quotes based on your assessment",
      "Skip any job that does not work for you",
    ],
  },
  {
    icon: Truck,
    title: "4. Pick Up, Deliver, Document",
    description:
      "Once a shipper accepts your quote, head to the pickup location. Use the app's built-in navigation to get there efficiently. At pickup, photograph the items to document their condition. Load up, follow your route to the destination, and deliver. At drop-off, take delivery photos to confirm completion.",
    details: [
      "Built-in turn-by-turn navigation",
      "One-tap photo capture at pickup and delivery",
      "In-app messaging with the shipper",
      "Automatic mileage and time tracking",
    ],
  },
  {
    icon: CreditCard,
    title: "5. Get Paid, Keep Your Earnings",
    description:
      "After the shipper confirms delivery, payment is processed and deposited to your account. You keep 100% of the delivery price minus only the standard credit card processing fee (2.9% + $0.30). There is no commission, no percentage cut, no hidden deductions. On a $200 delivery, you take home $194.50. On traditional platforms, you would keep $140-$160.",
    details: [
      "Payments deposited within 1-3 business days",
      "Only standard credit card processing fees deducted",
      "Detailed earnings dashboard and reports",
      "Download statements for tax purposes",
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              How SprintCargo Works
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Whether you are shipping something or delivering it, SprintCargo
              makes the process simple, transparent, and fair. Here is the
              complete walkthrough.
            </p>
          </div>
        </div>
      </section>

      {/* Shipper Flow */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#3B82F6]">
              For Shippers
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">
              Sending a Delivery
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              From posting your request to confirming delivery, here is every
              step of the shipper experience.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-4xl space-y-16">
            {shipperSteps.map((step) => (
              <div
                key={step.title}
                className="flex flex-col gap-6 md:flex-row md:gap-10"
              >
                <div className="flex shrink-0 items-start">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3B82F6]/10">
                    <step.icon className="size-7 text-[#3B82F6]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#0F172A]">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-base leading-7 text-gray-600">
                    {step.description}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {step.details.map((detail) => (
                      <li
                        key={detail}
                        className="flex items-start gap-2 text-sm text-gray-500"
                      >
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#22C55E]" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Driver Flow */}
      <section className="bg-[#F8FAFC] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#3B82F6]">
              For Drivers
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">
              Running Your Delivery Business
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              From setting up your profile to getting paid, here is the complete
              driver workflow.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-4xl space-y-16">
            {driverSteps.map((step) => (
              <div
                key={step.title}
                className="flex flex-col gap-6 md:flex-row md:gap-10"
              >
                <div className="flex shrink-0 items-start">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0F172A]/10">
                    <step.icon className="size-7 text-[#0F172A]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#0F172A]">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-base leading-7 text-gray-600">
                    {step.description}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {step.details.map((detail) => (
                      <li
                        key={detail}
                        className="flex items-start gap-2 text-sm text-gray-500"
                      >
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#22C55E]" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">
              Built-In Trust & Safety
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Every delivery on SprintCargo is backed by multiple layers of
              protection.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Camera,
                title: "Photo Documentation",
                desc: "Mandatory photos at pickup and delivery create an indisputable record of item condition throughout the process.",
              },
              {
                icon: MapPin,
                title: "Real-Time GPS Tracking",
                desc: "Live tracking from pickup to delivery means you always know exactly where your items are and when they will arrive.",
              },
              {
                icon: Shield,
                title: "Verified Drivers",
                desc: "Every driver on SprintCargo undergoes identity verification and vehicle inspection before they can accept their first job.",
              },
              {
                icon: Star,
                title: "Ratings & Reviews",
                desc: "Transparent two-way ratings ensure accountability. Shippers rate drivers and drivers rate shippers after every delivery.",
              },
              {
                icon: MessageSquare,
                title: "In-App Messaging",
                desc: "Communicate directly with your driver or shipper through the app. All messages are logged for your protection.",
              },
              {
                icon: CreditCard,
                title: "Secure Payments",
                desc: "All payments are processed securely through Stripe. Funds are held in escrow until delivery is confirmed by the shipper.",
              },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3B82F6]/10">
                  <item.icon className="size-7 text-[#3B82F6]" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#0F172A]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            Sign up in minutes. No credit card required for shippers. Drivers
            get a 7-day free trial.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="h-12 gap-2 rounded-lg bg-[#3B82F6] px-8 text-base font-semibold text-white hover:bg-[#2563EB]"
              render={<Link href="/auth/signup?role=driver" />}
            >
              Start Driving
              <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 gap-2 rounded-lg border-gray-600 px-8 text-base font-semibold text-white hover:bg-white/10 hover:text-white"
              render={<Link href="/auth/signup?role=shipper" />}
            >
              Ship Something
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
