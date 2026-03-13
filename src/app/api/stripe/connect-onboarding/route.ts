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

    // Verify driver role and Connect account
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, stripe_connected_account_id')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'driver') {
      return NextResponse.json(
        { error: 'Only drivers can onboard to Connect' },
        { status: 403 },
      );
    }

    if (!profile.stripe_connected_account_id) {
      return NextResponse.json(
        { error: 'Create a Connect account first' },
        { status: 400 },
      );
    }

    const origin = request.nextUrl.origin;

    const accountLink = await stripe.accountLinks.create({
      account: profile.stripe_connected_account_id,
      refresh_url: `${origin}/dashboard/driver/settings?connect=refresh`,
      return_url: `${origin}/dashboard/driver/settings?connect=complete`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    console.error('POST /api/stripe/connect-onboarding error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
