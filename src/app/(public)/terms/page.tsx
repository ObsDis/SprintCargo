import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "SprintCargo Terms of Service. Read our terms governing platform usage, payments, and user responsibilities.",
};

export default function TermsPage() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-gray-500">
          Last updated: March 1, 2026
        </p>

        <div className="mt-12 space-y-10 text-base leading-7 text-gray-600">
          <div>
            <h2 className="text-xl font-semibold text-[#0F172A]">
              1. Acceptance of Terms
            </h2>
            <p className="mt-4">
              By accessing or using the SprintCargo platform, website, or
              mobile application (collectively, the &ldquo;Platform&rdquo;),
              you agree to be bound by these Terms of Service
              (&ldquo;Terms&rdquo;). If you do not agree to all of these Terms,
              you may not access or use the Platform. These Terms constitute a
              legally binding agreement between you and SprintCargo, LLC
              (&ldquo;SprintCargo,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo;
              or &ldquo;our&rdquo;). We reserve the right to modify these Terms
              at any time. Material changes will be communicated via email or
              an in-app notification at least 30 days before taking effect.
              Your continued use of the Platform after changes become effective
              constitutes acceptance of the revised Terms.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0F172A]">
              2. Platform Description
            </h2>
            <p className="mt-4">
              SprintCargo operates a marketplace that connects individuals and
              businesses seeking delivery services (&ldquo;Shippers&rdquo;)
              with independent delivery drivers (&ldquo;Drivers&rdquo;).
              SprintCargo is not a delivery company, freight broker, or
              transportation provider. We provide the technology platform that
              facilitates connections between Shippers and Drivers. All
              delivery services are provided directly by independent Drivers
              who are not employees, agents, or contractors of SprintCargo.
              SprintCargo does not control, direct, or supervise Drivers in the
              performance of delivery services.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0F172A]">
              3. User Accounts and Registration
            </h2>
            <p className="mt-4">
              To use the Platform, you must create an account and provide
              accurate, complete, and current information. You are responsible
              for maintaining the confidentiality of your account credentials
              and for all activity that occurs under your account. You must be
              at least 18 years old to create an account. Drivers must
              additionally possess a valid driver&apos;s license, maintain
              appropriate vehicle insurance, and pass identity verification.
              You agree to notify SprintCargo immediately of any unauthorized
              use of your account. SprintCargo is not liable for any loss
              arising from unauthorized use of your account.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0F172A]">
              4. User Responsibilities
            </h2>
            <div className="mt-4 space-y-4">
              <p>
                <strong className="text-[#0F172A]">Shippers</strong> are
                responsible for accurately describing the items to be
                delivered, including dimensions, weight, and any special
                handling requirements. Shippers must ensure items are legal to
                transport, properly packaged, and ready for pickup at the
                specified time and location. Shippers must be available or have
                a designated representative present at both the pickup and
                delivery locations.
              </p>
              <p>
                <strong className="text-[#0F172A]">Drivers</strong> are
                responsible for maintaining a safe and appropriate vehicle,
                carrying valid insurance, and completing deliveries in a
                professional and timely manner. Drivers must take photographs
                of items at both pickup and delivery as required by the
                Platform. Drivers are responsible for the care and safety of
                items from the point of pickup to the point of delivery.
                Drivers must comply with all applicable traffic laws,
                transportation regulations, and local ordinances.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0F172A]">
              5. Payment Terms
            </h2>
            <div className="mt-4 space-y-4">
              <p>
                <strong className="text-[#0F172A]">
                  Shipper Payments:
                </strong>{" "}
                Shippers pay the delivery price quoted by and agreed upon with
                their selected Driver. Payments are processed securely through
                our third-party payment processor, Stripe. Funds are held in
                escrow until the Shipper confirms delivery or until automatic
                confirmation occurs 48 hours after the Driver marks the
                delivery as complete. SprintCargo does not charge Shippers any
                platform fees.
              </p>
              <p>
                <strong className="text-[#0F172A]">
                  Driver Subscription:
                </strong>{" "}
                Drivers pay a monthly subscription fee of $99.00 to access the
                Platform. The subscription is billed monthly and renews
                automatically unless cancelled. New Drivers receive a 7-day
                free trial. SprintCargo does not take any commission or
                percentage from delivery payments. Standard credit card
                processing fees (currently 2.9% + $0.30 per transaction) are
                deducted from delivery payments by the payment processor.
              </p>
              <p>
                <strong className="text-[#0F172A]">Driver Payouts:</strong>{" "}
                Delivery earnings minus payment processing fees are deposited
                to the Driver&apos;s linked bank account within 1-3 business
                days after delivery confirmation. Drivers are responsible for
                their own tax obligations, including income tax and
                self-employment tax. SprintCargo provides annual earnings
                summaries and 1099 forms as required by law.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0F172A]">
              6. Cancellation Policies
            </h2>
            <div className="mt-4 space-y-4">
              <p>
                <strong className="text-[#0F172A]">
                  Delivery Cancellations:
                </strong>{" "}
                Shippers may cancel a delivery request at any time before a
                Driver accepts a quote at no charge. Once a Driver has been
                assigned and is en route to pickup, the Shipper may cancel but
                a cancellation fee equivalent to 20% of the quoted delivery
                price (minimum $10) may be charged to compensate the Driver for
                time and fuel. Cancellations after pickup require mutual
                agreement between the Shipper and Driver and may involve
                partial payment.
              </p>
              <p>
                <strong className="text-[#0F172A]">
                  Driver Cancellations:
                </strong>{" "}
                Drivers may decline to quote on any job. Once a quote is
                accepted, Drivers are expected to complete the delivery.
                Repeated cancellations after quote acceptance may result in
                reduced visibility on the Platform or account suspension.
              </p>
              <p>
                <strong className="text-[#0F172A]">
                  Subscription Cancellation:
                </strong>{" "}
                Drivers may cancel their monthly subscription at any time
                through their account settings. Cancellation takes effect at
                the end of the current billing period. No refunds are provided
                for partial billing periods. There are no cancellation fees or
                long-term commitments.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0F172A]">
              7. Limitation of Liability
            </h2>
            <p className="mt-4">
              SprintCargo provides a technology platform to connect Shippers
              and Drivers. To the maximum extent permitted by applicable law,
              SprintCargo shall not be liable for any direct, indirect,
              incidental, special, consequential, or punitive damages arising
              out of or relating to the delivery services performed by Drivers,
              including but not limited to damage to or loss of items during
              delivery, personal injury, property damage, delays, or failure to
              complete deliveries. SprintCargo&apos;s total liability for any
              claim arising from or related to the Platform shall not exceed
              the amount of fees paid by you to SprintCargo during the twelve
              (12) months preceding the claim. SprintCargo does not guarantee
              the availability of Drivers in any area, the timeliness of
              deliveries, or the quality of Driver services.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0F172A]">
              8. Dispute Resolution
            </h2>
            <p className="mt-4">
              In the event of a dispute between a Shipper and a Driver,
              SprintCargo will facilitate communication and review available
              evidence, including delivery photos, GPS tracking data, and
              in-app messages, to help resolve the issue. SprintCargo&apos;s
              determination is advisory and not binding. If a dispute cannot be
              resolved through our internal process, parties may pursue
              resolution through binding arbitration in accordance with the
              rules of the American Arbitration Association. Both parties waive
              the right to participate in class action lawsuits against
              SprintCargo. Small claims court actions are exempt from the
              arbitration requirement.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0F172A]">
              9. Prohibited Activities
            </h2>
            <p className="mt-4">
              Users may not use the Platform to transport illegal, hazardous,
              or prohibited items, including but not limited to controlled
              substances, explosives, firearms (unless legally permitted and
              properly declared), live animals, or stolen property. Users may
              not create false or misleading delivery listings, submit
              fraudulent quotes, manipulate ratings or reviews, harass other
              users, use the Platform for any purpose other than legitimate
              delivery services, attempt to circumvent the Platform to arrange
              direct transactions, share account credentials with third
              parties, or use automated systems (bots, scrapers) to access the
              Platform. Violation of these prohibitions may result in immediate
              account termination without refund.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0F172A]">
              10. Intellectual Property
            </h2>
            <p className="mt-4">
              The SprintCargo name, logo, and all related names, logos, product
              and service names, designs, and slogans are trademarks of
              SprintCargo, LLC. All content on the Platform, including text,
              graphics, logos, icons, images, audio clips, software, and
              compilations of data, is the property of SprintCargo or its
              content suppliers and is protected by intellectual property laws.
              Users retain ownership of content they submit to the Platform
              (such as delivery descriptions and photos) but grant SprintCargo
              a non-exclusive, worldwide, royalty-free license to use, display,
              and distribute such content in connection with the operation and
              promotion of the Platform.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0F172A]">
              11. Data Usage and Privacy
            </h2>
            <p className="mt-4">
              Your use of the Platform is also governed by our Privacy Policy,
              which is incorporated into these Terms by reference. By using the
              Platform, you consent to the collection, use, and sharing of your
              information as described in our Privacy Policy. GPS location data
              collected during deliveries is used for real-time tracking,
              delivery verification, dispute resolution, and platform
              improvement. Delivery photos are stored securely and retained for
              a minimum of 90 days after delivery completion.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0F172A]">
              12. Termination
            </h2>
            <p className="mt-4">
              SprintCargo reserves the right to suspend or terminate any user
              account at any time, with or without cause, and with or without
              notice. Grounds for termination include but are not limited to
              violation of these Terms, fraudulent activity, repeated poor
              ratings, failure to maintain required Driver qualifications,
              abusive behavior toward other users, or inactivity for an
              extended period. Upon termination, your right to use the Platform
              ceases immediately. Any pending payouts will be processed in
              accordance with our normal payout schedule. Provisions of these
              Terms that by their nature should survive termination shall
              survive, including limitation of liability, dispute resolution,
              and intellectual property provisions.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0F172A]">
              13. Indemnification
            </h2>
            <p className="mt-4">
              You agree to indemnify, defend, and hold harmless SprintCargo,
              its officers, directors, employees, agents, and affiliates from
              and against any and all claims, liabilities, damages, losses,
              costs, and expenses (including reasonable attorneys&apos; fees)
              arising out of or related to your use of the Platform, your
              violation of these Terms, your violation of any rights of another
              person or entity, or the delivery services you provide or receive
              through the Platform.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0F172A]">
              14. Governing Law
            </h2>
            <p className="mt-4">
              These Terms shall be governed by and construed in accordance with
              the laws of the State of Texas, without regard to its conflict of
              law provisions. Any legal action or proceeding arising under
              these Terms shall be brought exclusively in the federal or state
              courts located in Travis County, Texas, and you consent to
              personal jurisdiction and venue in such courts.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0F172A]">
              15. Contact Information
            </h2>
            <p className="mt-4">
              If you have questions about these Terms of Service, please
              contact us at{" "}
              <a
                href="mailto:legal@sprintcargo.com"
                className="text-[#3B82F6] hover:underline"
              >
                legal@sprintcargo.com
              </a>{" "}
              or by mail at SprintCargo, LLC, Austin, TX 78701.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
