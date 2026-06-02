import { NextResponse } from 'next/server';

export async function POST() {
  if (process.env.BILLING_DISABLED !== 'false') {
    return NextResponse.json({ mode: 'mock', message: 'Billing is disabled for the MVP.' });
  }

  return NextResponse.json({ error: 'Stripe checkout is not implemented yet.' }, { status: 501 });
}
