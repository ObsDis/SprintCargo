import type { Metadata } from "next";
import { Mail, Phone, Clock, MapPin } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the SprintCargo team. We respond to all inquiries within 24 hours.",
};

const contactInfo = [
  {
    icon: Mail,
    title: "Email",
    value: "support@sprintcargo.com",
    description: "We respond to all emails within 24 hours",
  },
  {
    icon: Phone,
    title: "Phone",
    value: "(555) 123-4567",
    description: "Available during business hours",
  },
  {
    icon: Clock,
    title: "Business Hours",
    value: "Mon-Fri, 8AM - 6PM EST",
    description: "Weekend support via email only",
  },
  {
    icon: MapPin,
    title: "Headquarters",
    value: "Austin, Texas",
    description: "Serving drivers and shippers nationwide",
  },
];

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Get in Touch
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Have a question, suggestion, or need help? Our team is here to
              assist you. Fill out the form below or reach us directly.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 lg:grid-cols-5">
            {/* Contact Info */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-[#0F172A]">
                Contact Information
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-gray-600">
                Reach out through any of these channels. We are committed to
                responding to every inquiry promptly.
              </p>
              <div className="mt-8 space-y-6">
                {contactInfo.map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#3B82F6]/10">
                      <item.icon className="size-5 text-[#3B82F6]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A]">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-[#3B82F6]">
                        {item.value}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-[#0F172A]">
                    Send Us a Message
                  </CardTitle>
                  <CardDescription>
                    Fill out the form and our team will respond within 24 hours.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ContactForm />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
