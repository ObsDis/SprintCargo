import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

export async function POST(_request: NextRequest) {
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
      .select('role, stripe_connected_account_id')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'driver') {
      return NextResponse.json(
        { error: 'Only drivers can create Connect accounts' },
        { status: 403 },
      );
    }

    // Return existing if already created
    if (profile.stripe_connected_account_id) {
      return NextResponse.json({
        account_id: profile.stripe_connected_account_id,
      });
    }

    const account = await stripe.accounts.create({
      type: 'express',
      email: user.email,
      metadata: { supabase_user_id: user.id },
      capabilities: {
        transfers: { requested: true },
      },
    });

    // Store account ID in profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        stripe_connected_account_id: account.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to save Connect account' },
        { status: 500 },
      );
    }

    return NextResponse.json({ account_id: account.id }, { status: 201 });
  } catch (err) {
    console.error('POST /api/stripe/create-connect-account error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
