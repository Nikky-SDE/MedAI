import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Validate that "next" is a safe relative internal route to prevent open redirects
  const requestedNext = searchParams.get('next')
  const safeNext = (requestedNext && requestedNext.startsWith('/') && !requestedNext.startsWith('//') && !requestedNext.includes('\\'))
    ? requestedNext
    : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not verify session`)
}
