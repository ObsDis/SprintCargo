import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "SprintCargo Privacy Policy. Learn how we collect, use, and protect your personal information.",
};

export default function PrivacyPage() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-gray-500">
          Last updated: March 1, 2026
        </p>

        <div className="mt-12 space-y-10 text-base leading-7 text-gray-600">
          <div>
            <h2 className="text-xl font-semibold text-[#0F172A]">
              1. Introduction
            </h2>
            <p className="mt-4">
              SprintCargo, LLC (&ldquo;SprintCargo,&rdquo; &ldquo;we,&rdquo;
              &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is committed to
              protecting your privacy. This Privacy Policy explains how we
              collect, use, disclose, and safeguard your information when you
              use our website, mobile application, and delivery marketplace
              platform (collectively, the &ldquo;Platform&rdquo;). Please read
              this Privacy Policy carefully. By using the Platform, you consent
              to the data practices described in this policy. If you do not
              agree with the terms of this Privacy Policy, please do not access
              or use the Platform.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0F172A]">
              2. Information We Collect
            </h2>
            <div className="mt-4 space-y-4">
              <p>
                <strong className="text-[#0F172A]">
                  Personal Information:
                </strong>{" "}
                When you create an account, we collect your full name, email
                address, phone number, and mailing address. Drivers
                additionally provide their driver&apos;s license number, vehicle
                information (make, model, year, license plate), and insurance
                details. For payment processing, we collect bank account
                information for Driver payouts and payment card information for
                Shipper payments and Driver subscriptions, which is processed
                and stored securely by our payment processor, Stripe.
              </p>
              <p>
                <strong className="text-[#0F172A]">Location Data:</strong> When
                Drivers are actively completing deliveries, we collect
                real-time GPS location data to provide live tracking to
                Shippers, verify delivery routes, and resolve disputes.
                Location data is collected only when the Driver has an active
                delivery or has opted in to background location sharing for job
                matching purposes. Shippers provide pickup and delivery
                addresses as part of their delivery requests.
              </p>
              <p>
                <strong className="text-[#0F172A]">
                  Photos and Media:
                </strong>{" "}
                Drivers capture photographs of items at pickup and delivery
                points. These photos are uploaded to our servers and associated
                with the relevant delivery record. Photos are used for delivery
                verification, dispute resolution, and quality assurance.
              </p>
              <p>
                <strong className="text-[#0F172A]">Usage Data:</strong> We
                automatically collect information about how you interact with
                the Platform, including your IP address, browser type, device
                type, operating system, pages visited, time spent on pages,
                links clicked, and actions taken within the app. We use this
                information to improve the Platform, identify technical issues,
                and analyze user behavior.
              </p>
              <p>
                <strong className="text-[#0F172A]">
                  Communications:
                </strong>{" "}
                We retain in-app messages exchanged between Shippers and
                Drivers, customer support communications, and feedback or
                reviews submitted through the Platform.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0F172A]">
              3. How We Use Your Information
            </h2>
            <div className="mt-4">
              <p>We use the information we collect to:</p>
              <ul className="mt-3 list-inside list-disc space-y-2">
                <li>
                  Create and manage your account and verify your identity
                </li>
                <li>
                  Facilitate delivery transactions between Shippers and Drivers
                </li>
                <li>
                  Process payments, subscriptions, and Driver payouts
                </li>
                <li>
                  Provide real-time delivery tracking and status updates
                </li>
                <li>
                  Enable communication between Shippers and Drivers
                </li>
                <li>
                  Resolve disputes using delivery photos, GPS data, and
                  messaging records
                </li>
                <li>
                  Send transactional notifications (delivery updates, payment
                  confirmations, account alerts)
                </li>
                <li>
                  Send promotional communications (with your opt-in consent,
                  and you can unsubscribe at any time)
                </li>
                <li>
                  Improve the Platform through analytics, user research, and
                  feature development
                </li>
                <li>
                  Detect and prevent fraud, abuse, and security threats
                </li>
                <li>
                  Comply with legal obligations and respond to lawful requests
                  from authorities
                </li>
                <li>
                  Generate anonymized, aggregated statistics about Platform
                  usage
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0F172A]">
              4. How We Share Your Information
            </h2>
            <div className="mt-4 space-y-4">
              <p>
                <strong className="text-[#0F172A]">
                  Between Users:
                </strong>{" "}
                When a Shipper and Driver are matched for a delivery, we share
                limited information between them to facilitate the transaction.
                Shippers see the Driver&apos;s first name, profile photo,
                vehicle description, ratings, and real-time location during
                active deliveries. Drivers see the Shipper&apos;s first name,
                pickup and delivery addresses, item descriptions, and ratings.
                Full contact information (phone numbers, email addresses) is
                not shared directly; in-app messaging is provided instead.
              </p>
              <p>
                <strong className="text-[#0F172A]">
                  Service Providers:
                </strong>{" "}
                We share information with third-party service providers who
                perform services on our behalf, including Stripe for payment
                processing, cloud hosting providers for data storage, mapping
                services for navigation and tracking, email service providers
                for transactional communications, and analytics providers for
                Platform improvement. These providers are contractually
                obligated to use your information only for the purposes of
                providing their services to us and to maintain appropriate
                security measures.
              </p>
              <p>
                <strong className="text-[#0F172A]">Legal Requirements:</strong>{" "}
                We may disclose your information if required to do so by law or
                in response to a valid legal process, such as a subpoena, court
                order, or government investigation. We may also disclose
                information if we believe in good faith that disclosure is
                necessary to protect the rights, property, or safety of
                SprintCargo, our users, or the public.
              </p>
              <p>
                <strong className="text-[#0F172A]">
                  Business Transfers:
                </strong>{" "}
                In the event of a merger, acquisition, bankruptcy, or sale of
                all or a portion of our assets, your information may be
                transferred to the acquiring entity. We will provide notice
                before your information is transferred and becomes subject to a
                different privacy policy.
              </p>
              <p>
                We do not sell your personal information to third parties for
                advertising or marketing purposes.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0F172A]">
              5. Cookies and Tracking Technologies
            </h2>
            <p className="mt-4">
              We use cookies, web beacons, and similar tracking technologies to
              collect usage data and improve the Platform. Essential cookies are
              required for the Platform to function and cannot be disabled.
              Analytics cookies help us understand how users interact with the
              Platform so we can improve it. Preference cookies remember your
              settings and preferences. You can control cookie preferences
              through your browser settings. Note that disabling certain
              cookies may affect the functionality of the Platform. Our
              Platform does not respond to &ldquo;Do Not Track&rdquo; signals
              from browsers at this time.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0F172A]">
              6. Third-Party Services
            </h2>
            <p className="mt-4">
              The Platform integrates with third-party services including
              Google Maps for navigation and address verification, Stripe for
              payment processing, and various analytics tools. These services
              have their own privacy policies governing how they collect and
              use your data. We encourage you to review the privacy policies of
              these third-party services. SprintCargo is not responsible for
              the privacy practices of third-party services.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0F172A]">
              7. Your Rights and Choices
            </h2>
            <div className="mt-4 space-y-4">
              <p>Depending on your jurisdiction, you may have the right to:</p>
              <ul className="list-inside list-disc space-y-2">
                <li>
                  Access the personal information we hold about you and request
                  a copy
                </li>
                <li>
                  Correct inaccurate or incomplete personal information
                </li>
                <li>
                  Delete your personal information, subject to certain
                  exceptions (such as legal obligations or active disputes)
                </li>
                <li>
                  Restrict or object to certain processing of your personal
                  information
                </li>
                <li>
                  Port your data to another service in a machine-readable
                  format
                </li>
                <li>
                  Withdraw consent for optional data processing (such as
                  marketing emails)
                </li>
                <li>
                  Opt out of the sale of personal information (note: we do not
                  sell personal information)
                </li>
              </ul>
              <p>
                To exercise any of these rights, please contact us at{" "}
                <a
                  href="mailto:privacy@sprintcargo.com"
                  className="text-[#3B82F6] hover:underline"
                >
                  privacy@sprintcargo.com
                </a>
                . We will respond to your request within 30 days. We may need
                to verify your identity before processing your request.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0F172A]">
              8. Data Retention
            </h2>
            <p className="mt-4">
              We retain your personal information for as long as your account
              is active or as needed to provide you with the Platform&apos;s
              services. After account deletion, we retain certain information
              for the following periods: delivery records and associated photos
              for 3 years (for dispute resolution and legal compliance),
              financial transaction records for 7 years (as required by tax
              law), anonymized and aggregated data indefinitely (for analytics
              and Platform improvement). You may request deletion of your
              account and personal information at any time, subject to the
              retention requirements described above.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0F172A]">
              9. Data Security
            </h2>
            <p className="mt-4">
              We implement industry-standard security measures to protect your
              personal information, including encryption of data in transit
              (TLS/SSL) and at rest, secure cloud infrastructure with access
              controls and monitoring, regular security audits and
              vulnerability assessments, employee access restricted on a
              need-to-know basis, and PCI DSS compliance for payment data
              handling (managed by Stripe). However, no method of transmission
              over the Internet or method of electronic storage is 100%
              secure. While we strive to protect your personal information, we
              cannot guarantee its absolute security. If we become aware of a
              data breach that affects your personal information, we will
              notify you in accordance with applicable law.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0F172A]">
              10. Children&apos;s Privacy
            </h2>
            <p className="mt-4">
              The Platform is not intended for use by individuals under the age
              of 18. We do not knowingly collect personal information from
              children under 18. If we become aware that we have collected
              personal information from a child under 18, we will take steps
              to delete that information promptly. If you believe we have
              inadvertently collected information from a child under 18, please
              contact us at{" "}
              <a
                href="mailto:privacy@sprintcargo.com"
                className="text-[#3B82F6] hover:underline"
              >
                privacy@sprintcargo.com
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0F172A]">
              11. California Privacy Rights
            </h2>
            <p className="mt-4">
              If you are a California resident, the California Consumer Privacy
              Act (CCPA) and the California Privacy Rights Act (CPRA) provide
              you with additional rights regarding your personal information.
              You have the right to know what personal information we collect,
              how we use it, and with whom we share it. You have the right to
              request deletion of your personal information. You have the right
              to opt out of the sale or sharing of your personal information
              (note: we do not sell personal information). You have the right
              to non-discrimination for exercising your privacy rights. To
              exercise your California privacy rights, contact us at{" "}
              <a
                href="mailto:privacy@sprintcargo.com"
                className="text-[#3B82F6] hover:underline"
              >
                privacy@sprintcargo.com
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0F172A]">
              12. International Users
            </h2>
            <p className="mt-4">
              SprintCargo is based in the United States and the Platform is
              primarily intended for use within the United States. If you
              access the Platform from outside the United States, please be
              aware that your information may be transferred to, stored, and
              processed in the United States, where data protection laws may
              differ from those in your country of residence. By using the
              Platform, you consent to the transfer of your information to the
              United States.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0F172A]">
              13. Changes to This Privacy Policy
            </h2>
            <p className="mt-4">
              We may update this Privacy Policy from time to time to reflect
              changes in our practices, technology, legal requirements, or
              other factors. We will notify you of material changes by posting
              the updated policy on the Platform with a new &ldquo;Last
              Updated&rdquo; date, sending an email notification to your
              registered email address, or displaying an in-app notification.
              We encourage you to review this Privacy Policy periodically. Your
              continued use of the Platform after the revised Privacy Policy
              becomes effective constitutes your acceptance of the changes.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0F172A]">
              14. Contact Us
            </h2>
            <p className="mt-4">
              If you have questions, concerns, or requests regarding this
              Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="mt-4 rounded-xl bg-[#F8FAFC] p-6 text-sm">
              <p className="font-semibold text-[#0F172A]">
                SprintCargo, LLC
              </p>
              <p className="mt-1">Privacy Team</p>
              <p>
                Email:{" "}
                <a
                  href="mailto:privacy@sprintcargo.com"
                  className="text-[#3B82F6] hover:underline"
                >
                  privacy@sprintcargo.com
                </a>
              </p>
              <p>Austin, TX 78701</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
