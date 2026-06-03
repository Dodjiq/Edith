import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  await supabase.auth.signOut().catch((signOutError) => {
    console.error('[auth/sign-out] signOut failed', signOutError);
  });

  revalidatePath('/', 'layout');

  return NextResponse.redirect(`${request.nextUrl.origin}/`, { status: 303 });
}
