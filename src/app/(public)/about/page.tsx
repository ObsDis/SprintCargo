import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Target, Lightbulb, Heart, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn why SprintCargo exists and how we're building a fairer delivery marketplace for drivers and shippers alike.",
};

const values = [
  {
    icon: Target,
    title: "Fairness First",
    description:
      "We believe the people doing the work should keep the money they earn. Our flat-fee model ensures drivers are never penalized for earning more.",
  },
  {
    icon: Lightbulb,
    title: "Radical Transparency",
    description:
      "No hidden fees, no opaque algorithms, no surge pricing. Drivers set their rates. Shippers see every quote. Everyone knows exactly what they're paying and why.",
  },
  {
    icon: Heart,
    title: "Driver Dignity",
    description:
      "Drivers are independent business owners, not gig workers to be exploited. We give them the tools and freedom to run their delivery business on their terms.",
  },
  {
    icon: TrendingUp,
    title: "Aligned Incentives",
    description:
      "When drivers keep more, they charge less. When shippers pay less, they ship more. When more shipments are posted, drivers earn more. Everyone wins.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              About Sprint<span className="text-[#3B82F6]">Cargo</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              We started SprintCargo because we saw an industry taking advantage
              of the people who make it work.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-[#0F172A] sm:text-3xl">
            The Problem We Saw
          </h2>
          <div className="mt-8 space-y-6 text-base leading-7 text-gray-600">
            <p>
              The local delivery industry has a problem that nobody talks about
              openly: the platforms that connect shippers with drivers are
              taking 20-30% of every single job. When a shipper pays $200 for a
              delivery, platforms like Roadie, GoShare, and others take $40-$60
              right off the top. The driver, who owns the vehicle, pays for gas,
              maintains insurance, and does all of the physical work, gets what
              is left over.
            </p>
            <p>
              This model creates a vicious cycle. Because drivers lose so much
              to platform fees, they have to charge higher rates to make ends
              meet. Higher rates mean shippers pay more than they should. Some
              shippers stop using delivery services altogether, which means
              fewer jobs for drivers. The only winner in this arrangement is the
              platform sitting in the middle, extracting value without adding
              proportional benefit.
            </p>
            <p>
              We founded SprintCargo to break this cycle. Instead of taking a
              percentage of every transaction, we charge drivers a flat
              $99/month subscription. That is it. No commissions, no per-job
              fees, no surge pricing. When a shipper pays a driver $200,
              the driver receives $200 minus only the standard credit card
              processing fee (2.9% + $0.30). On that $200 job, that means the
              driver keeps $194.50 instead of $140-$160.
            </p>
            <p>
              The math works for everyone. Drivers who complete just two or
              three decent jobs per month more than cover their subscription
              cost, and everything after that is pure upside. Because drivers
              keep more of every dollar, they can afford to charge lower rates.
              Lower rates attract more shippers. More shippers mean more jobs.
              More jobs mean more revenue for drivers. It is a virtuous cycle
              built on a simple idea: the people doing the work should keep the
              money they earn.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-[#F8FAFC] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-[#3B82F6]">
                Our Mission
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[#0F172A] sm:text-3xl">
                Make local delivery fair for everyone
              </h2>
              <p className="mt-6 text-base leading-7 text-gray-600">
                SprintCargo exists to create a delivery marketplace where
                drivers are treated as the independent business owners they are,
                where shippers get transparent pricing and reliable service, and
                where the platform earns its keep through honest value rather
                than excessive commissions. We believe technology should reduce
                friction and costs, not add a 30% markup on top of every
                transaction.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-[#3B82F6]">
                Our Vision
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[#0F172A] sm:text-3xl">
                The standard for honest delivery
              </h2>
              <p className="mt-6 text-base leading-7 text-gray-600">
                We envision a future where SprintCargo is the default choice for
                local cargo delivery, not because we lock anyone in, but
                because our model is simply better for everyone involved. We
                want to prove that a marketplace can be profitable without
                exploiting its participants. When a platform charges fairly,
                operates transparently, and respects the autonomy of its users,
                loyalty follows naturally.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">
              What We Stand For
            </h2>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2">
            {values.map((value) => (
              <div key={value.title} className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6]/10">
                  <value.icon className="size-6 text-[#3B82F6]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#0F172A]">
                    {value.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Join the movement
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            Whether you are a driver tired of losing a third of your earnings or
            a shipper who wants fair pricing, SprintCargo was built for you.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="h-12 gap-2 rounded-lg bg-[#3B82F6] px-8 text-base font-semibold text-white hover:bg-[#2563EB]"
              render={<Link href="/auth/signup?role=driver" />}
            >
              Join as a Driver
              <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 gap-2 rounded-lg border-gray-600 px-8 text-base font-semibold text-white hover:bg-white/10 hover:text-white"
              render={<Link href="/auth/signup?role=shipper" />}
            >
              Ship with Us
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
