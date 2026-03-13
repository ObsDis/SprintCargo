import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify driver role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'driver') {
      return NextResponse.json(
        { error: 'Only drivers can subscribe' },
        { status: 403 },
      );
    }

    const priceId = process.env.STRIPE_PRICE_ID_DRIVER_MONTHLY;
    if (!priceId) {
      console.error('Missing STRIPE_PRICE_ID_DRIVER_MONTHLY env var');
      return NextResponse.json(
        { error: 'Subscription price not configured' },
        { status: 500 },
      );
    }

    // Create or reuse Stripe customer
    let customerId = profile.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    const origin = request.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: { supabase_user_id: user.id },
      },
      success_url: `${origin}/dashboard/driver?checkout=success`,
      cancel_url: `${origin}/dashboard/driver?checkout=cancelled`,
      metadata: { supabase_user_id: user.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('POST /api/stripe/create-checkout error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
