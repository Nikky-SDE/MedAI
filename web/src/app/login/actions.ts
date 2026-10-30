'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface AuthErrorLike {
  message?: string
  cause?: {
    message?: string
    code?: string
  }
}

function formatAuthError(error: unknown): string {
  const err = error as AuthErrorLike
  const msg = err?.message?.toLowerCase() || ''
  const causeMsg = err?.cause?.message?.toLowerCase() || ''
  const causeCode = err?.cause?.code || ''

  if (
    msg.includes('fetch failed') ||
    msg.includes('timeout') ||
    msg.includes('network') ||
    causeMsg.includes('timeout') ||
    causeCode.includes('UND_ERR_CONNECT_TIMEOUT') ||
    causeCode.includes('ECONNREFUSED') ||
    causeCode.includes('ENOTFOUND')
  ) {
    return 'Unable to connect to the authentication server. Please check your internet connection and try again.'
  }

  return err?.message || 'An unexpected authentication error occurred.'
}

export async function login(formData: FormData) {
  let errorMessage: string | null = null

  try {
    const supabase = await createClient()

    const email = (formData.get('email') as string || '').trim()
    const password = (formData.get('password') as string || '')

    const data = {
      email,
      password,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
      errorMessage = formatAuthError(error)
    }
  } catch (err: unknown) {
    errorMessage = formatAuthError(err)
  }

  if (errorMessage) {
    redirect('/login?error=' + encodeURIComponent(errorMessage))
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  let errorMessage: string | null = null
  let requiresEmailConfirmation = false

  try {
    const supabase = await createClient()

    const email = (formData.get('email') as string || '').trim()
    const password = (formData.get('password') as string || '')
    const fullName = (formData.get('fullName') as string || '').trim()

    const data = {
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    }

    const { error, data: authData } = await supabase.auth.signUp(data)

    if (error) {
      errorMessage = formatAuthError(error)
    } else if (authData.user && !authData.session) {
      requiresEmailConfirmation = true
    }
  } catch (err: unknown) {
    errorMessage = formatAuthError(err)
  }

  if (errorMessage) {
    redirect('/login?error=' + encodeURIComponent(errorMessage))
  }

  if (requiresEmailConfirmation) {
    redirect('/login?message=' + encodeURIComponent('Account created! Please check your email to confirm your account before logging in.'))
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
