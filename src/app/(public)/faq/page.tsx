import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about SprintCargo for shippers and drivers. Learn about pricing, payments, trust, and more.",
};

const generalFaqs = [
  {
    question: "What is SprintCargo?",
    answer:
      "SprintCargo is a delivery marketplace that connects people who need items delivered (shippers) with independent drivers who have cargo vans and other vehicles. Unlike traditional platforms that take 20-30% of every delivery, we charge drivers a flat $99/month subscription and let them keep 100% of their delivery earnings minus standard credit card processing fees (2.9% + $0.30).",
  },
  {
    question: "How is SprintCargo different from Roadie, GoShare, or other delivery platforms?",
    answer:
      "The biggest difference is our pricing model. Traditional platforms take a percentage of every delivery—typically 20-30%. That means on a $200 delivery, the driver might lose $40-$60 to the platform. SprintCargo charges a flat $99/month subscription for drivers, with zero commission on deliveries. Shippers use the platform for free. This model means drivers earn significantly more per delivery, and because they keep more, they can afford to charge shippers less. Everyone benefits except the old model of extracting commissions.",
  },
  {
    question: "What types of deliveries can I send through SprintCargo?",
    answer:
      "SprintCargo supports a wide range of local and regional deliveries. Common use cases include furniture and appliance delivery, moving supplies between locations, business-to-business freight, marketplace item delivery (for items bought on Facebook Marketplace, Craigslist, etc.), catering and event supplies, and anything else that fits in a cargo van or truck. We do not currently support hazardous materials, live animals, or illegal items.",
  },
  {
    question: "What areas does SprintCargo serve?",
    answer:
      "SprintCargo is available in select metropolitan areas and is expanding rapidly. When you create a delivery request, you will see whether drivers are available in your area. Drivers define their own service areas, so coverage depends on local driver availability. If you are a driver in an area we have not reached yet, signing up helps us build coverage in your region.",
  },
];

const shipperFaqs = [
  {
    question: "How much does it cost to use SprintCargo as a shipper?",
    answer:
      "SprintCargo is completely free for shippers. There is no subscription, no posting fee, and no hidden charges. You post your delivery, receive quotes from drivers, and pay only the price you agree to with your chosen driver. Payment processing is handled securely through Stripe.",
  },
  {
    question: "How do I know I can trust the drivers?",
    answer:
      "Every driver on SprintCargo undergoes identity verification before they can accept jobs. Drivers build a public profile with ratings and reviews from previous deliveries. You can see a driver's delivery count, average rating, and individual reviews before accepting their quote. Additionally, mandatory photo documentation at pickup and delivery, plus real-time GPS tracking, provide multiple layers of accountability.",
  },
  {
    question: "What if my items are damaged during delivery?",
    answer:
      "Mandatory photos at both pickup and delivery create a documented record of item condition. If damage occurs during transport, these photos serve as evidence for dispute resolution. We recommend that shippers also take their own photos before the driver arrives. SprintCargo facilitates dispute resolution between shippers and drivers, and drivers are responsible for items in their care during transport.",
  },
  {
    question: "Can I cancel a delivery after a driver has been assigned?",
    answer:
      "Yes, you can cancel a delivery before the driver picks up your items at no charge. If the driver has already started traveling to your pickup location, a cancellation fee may apply to compensate them for their time and fuel. Once items have been picked up, cancellation is handled on a case-by-case basis. Full details are in our Terms of Service.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "Delivery times depend on the distance, driver availability, and the delivery speed you select. When you post a delivery, you specify your preferred timing—standard, same-day, or rush. Drivers include their estimated pickup and delivery times in their quotes, so you know exactly what to expect before you accept. Real-time tracking lets you monitor progress throughout.",
  },
];

const driverFaqs = [
  {
    question: "How much does SprintCargo cost for drivers?",
    answer:
      "SprintCargo costs $99/month for drivers. That flat subscription is your only platform cost. We do not take any commission or percentage from your deliveries. The only other deduction is the standard credit card processing fee (2.9% + $0.30 per transaction), which is charged by our payment processor, Stripe, not by SprintCargo. New drivers get a 7-day free trial to try the platform before committing.",
  },
  {
    question: "How quickly can I start earning?",
    answer:
      "After signing up, you will need to complete identity verification and set up your driver profile, including your vehicle details, pricing rates, and service area. This typically takes less than 24 hours for verification. Once approved, you can immediately start browsing and quoting on available deliveries in your area.",
  },
  {
    question: "Do I need a cargo van to drive for SprintCargo?",
    answer:
      "While SprintCargo is designed primarily for cargo van deliveries, we welcome drivers with other vehicle types including pickup trucks, box trucks, and SUVs with sufficient cargo space. Your vehicle type is displayed on your profile so shippers can see what you drive and assess whether it is suitable for their delivery needs.",
  },
  {
    question: "How do I get paid?",
    answer:
      "After a shipper confirms delivery, payment is processed through Stripe and deposited directly to your linked bank account. Payouts typically arrive within 1-3 business days. You can track all your earnings, pending payments, and completed payouts in your driver dashboard. We also provide downloadable earnings reports for tax purposes.",
  },
  {
    question: "Can I work for other platforms while using SprintCargo?",
    answer:
      "Absolutely. SprintCargo does not require exclusivity. You are an independent contractor and are free to work for any other platform, take private jobs, or run your own delivery business alongside SprintCargo. Many of our drivers use SprintCargo as their primary platform because of higher take-home pay while maintaining accounts on other platforms.",
  },
  {
    question: "What happens if I need to cancel my subscription?",
    answer:
      "You can cancel your SprintCargo subscription at any time from your account settings. There are no cancellation fees, no long-term contracts, and no penalties. Your subscription continues through the end of your current billing period, and you can keep using the platform until then. Any pending payouts will still be processed after cancellation.",
  },
];

export default function FAQPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Frequently Asked Questions
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Everything you need to know about SprintCargo. Can&apos;t find
              your answer?{" "}
              <Link
                href="/contact"
                className="text-[#3B82F6] underline underline-offset-4 hover:text-[#60A5FA]"
              >
                Contact our team
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* General */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-[#0F172A] sm:text-3xl">
            General Questions
          </h2>
          <div className="mt-8">
            <Accordion>
              {generalFaqs.map((faq, index) => (
                <AccordionItem key={index} value={`general-${index}`}>
                  <AccordionTrigger className="text-left text-base font-medium text-[#0F172A]">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Shipper FAQs */}
      <section className="bg-[#F8FAFC] py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-[#0F172A] sm:text-3xl">
            For Shippers
          </h2>
          <div className="mt-8">
            <Accordion>
              {shipperFaqs.map((faq, index) => (
                <AccordionItem key={index} value={`shipper-${index}`}>
                  <AccordionTrigger className="text-left text-base font-medium text-[#0F172A]">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Driver FAQs */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-[#0F172A] sm:text-3xl">
            For Drivers
          </h2>
          <div className="mt-8">
            <Accordion>
              {driverFaqs.map((faq, index) => (
                <AccordionItem key={index} value={`driver-${index}`}>
                  <AccordionTrigger className="text-left text-base font-medium text-[#0F172A]">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Still have questions?
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            Our team is here to help. Reach out and we will get back to you
            within 24 hours.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="h-12 gap-2 rounded-lg bg-[#3B82F6] px-8 text-base font-semibold text-white hover:bg-[#2563EB]"
              render={<Link href="/contact" />}
            >
              Contact Us
              <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 gap-2 rounded-lg border-gray-600 px-8 text-base font-semibold text-white hover:bg-white/10 hover:text-white"
              render={<Link href="/auth/signup" />}
            >
              Get Started
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
