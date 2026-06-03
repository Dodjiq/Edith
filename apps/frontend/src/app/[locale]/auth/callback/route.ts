import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next');

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/auth/login?error=callback_failed`);
  }

  const safeNext = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')
    ? nextParam
    : '/dashboard';

  return NextResponse.redirect(`${origin}${safeNext}`);
}
