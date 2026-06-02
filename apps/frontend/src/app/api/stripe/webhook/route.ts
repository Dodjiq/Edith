import { NextResponse } from 'next/server';

export async function POST() {
  if (process.env.BILLING_DISABLED !== 'false') {
    return NextResponse.json({ received: true, mode: 'mock' });
  }

  return NextResponse.json({ error: 'Stripe webhook verification is not implemented yet.' }, { status: 501 });
}
