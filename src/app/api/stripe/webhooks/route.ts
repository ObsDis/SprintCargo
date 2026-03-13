import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import type Stripe from 'stripe';
import type { SubscriptionStatus } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    if (!sig) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 },
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET env var');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 },
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Webhook signature verification failed:', message);
      return NextResponse.json(
        { error: `Webhook Error: ${message}` },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    switch (event.type) {
      // -----------------------------------------------------------------
      // Subscription lifecycle
      // -----------------------------------------------------------------
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        if (!userId) break;

        // Determine if trial or active
        const subscription = session.subscription
          ? await stripe.subscriptions.retrieve(session.subscription as string)
          : null;

        const status: SubscriptionStatus =
          subscription?.status === 'trialing' ? 'trial' : 'active';

        await supabase
          .from('profiles')
          .update({
            subscription_status: status,
            stripe_customer_id:
              typeof session.customer === 'string'
                ? session.customer
                : undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === 'string'
            ? invoice.customer
            : invoice.customer?.toString() ?? null;
        if (!customerId) break;

        await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === 'string'
            ? invoice.customer
            : invoice.customer?.toString() ?? null;
        if (!customerId) break;

        await supabase
          .from('profiles')
          .update({
            subscription_status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId);

        // Notify user
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (userProfile) {
          await supabase.from('notifications').insert({
            user_id: userProfile.id,
            type: 'subscription_warning',
            title: 'Payment Failed',
            body: 'Your subscription payment failed. Please update your payment method.',
            data: null,
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.toString() ?? null;
        if (!customerId) break;

        const statusMap: Record<string, SubscriptionStatus> = {
          active: 'active',
          trialing: 'trial',
          past_due: 'past_due',
          canceled: 'cancelled',
          unpaid: 'past_due',
          incomplete: 'inactive',
          incomplete_expired: 'inactive',
          paused: 'inactive',
        };

        const mappedStatus: SubscriptionStatus =
          statusMap[subscription.status] ?? 'inactive';

        await supabase
          .from('profiles')
          .update({
            subscription_status: mappedStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.toString() ?? null;
        if (!customerId) break;

        await supabase
          .from('profiles')
          .update({
            subscription_status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId);
        break;
      }

      // -----------------------------------------------------------------
      // Payment lifecycle
      // -----------------------------------------------------------------
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const jobId = pi.metadata?.job_id;
        if (!jobId) break;

        await supabase
          .from('jobs')
          .update({
            stripe_payment_intent_id: pi.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', jobId);

        // Notify shipper
        if (pi.metadata?.shipper_id) {
          await supabase.from('notifications').insert({
            user_id: pi.metadata.shipper_id,
            type: 'payment_sent',
            title: 'Payment Successful',
            body: `Your payment of $${(pi.amount / 100).toFixed(2)} was processed successfully.`,
            data: { job_id: jobId, payment_intent_id: pi.id },
          });
        }
        break;
      }

      case 'transfer.created': {
        const transfer = event.data.object as Stripe.Transfer;
        const jobId = transfer.metadata?.job_id;
        if (!jobId) break;

        await supabase
          .from('jobs')
          .update({
            stripe_transfer_id: transfer.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', jobId);
        break;
      }

      // -----------------------------------------------------------------
      // Connect account
      // -----------------------------------------------------------------
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        const userId = account.metadata?.supabase_user_id;
        if (!userId) break;

        const chargesEnabled = account.charges_enabled ?? false;
        const payoutsEnabled = account.payouts_enabled ?? false;
        const onboardingComplete = chargesEnabled && payoutsEnabled;

        await supabase
          .from('profiles')
          .update({
            stripe_connect_onboarding_complete: onboardingComplete,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
        break;
      }

      default:
        // Unhandled event type -- acknowledge receipt
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('POST /api/stripe/webhooks error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
