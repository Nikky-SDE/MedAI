import { login, signup } from './actions'
import { Activity, ShieldCheck, Mail, Lock, User, Shield } from 'lucide-react'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 hero-gradient-light dark:hero-gradient-dark" />

      {/* Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#C8856A] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#1B2A6B] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-[var(--bg-card)]/80 backdrop-blur-xl border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden relative z-10 animate-slide-up">

        {/* Left: Branding */}
        <div className="bg-gradient-to-br from-[#C8856A] to-[#1B2A6B] p-10 md:p-14 text-white hidden md:flex flex-col justify-between">
          <div>
            <Link href="/" className="inline-flex items-center text-white/90 hover:text-white transition-colors mb-12 gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-extrabold">MedAI</span>
            </Link>

            <h2 className="text-4xl font-bold mb-6 leading-tight">
              Your health journey,<br />powered by intelligence.
            </h2>
            <p className="text-white/80 text-lg mb-8 leading-relaxed">
              Get instant AI-driven health insights before visiting your doctor.
            </p>

            <div className="space-y-3">
              {[
                'Smart conversational triage',
                'Voice symptom dictation',
                'Downloadable health reports',
              ].map(item => (
                <div key={item} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-white/85 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/10 p-5 rounded-2xl border border-white/20 mt-8">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-green-300" />
              <h3 className="font-semibold">Secure & Private</h3>
            </div>
            <p className="text-white/70 text-sm">Your medical data is encrypted and secured with enterprise-grade Supabase infrastructure.</p>
          </div>
        </div>

        {/* Right: Forms */}
        <div className="p-8 md:p-12 bg-[var(--bg-card)]">
          {/* Mobile logo */}
          <div className="md:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C8856A] to-[#1B2A6B] flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">MedAI</span>
          </div>

          <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-1">Welcome</h2>
          <p className="text-[var(--text-secondary)] mb-8">Sign in or create an account to continue.</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm rounded-r-xl flex items-start gap-2">
              ⚠️ <span>{decodeURIComponent(error)}</span>
            </div>
          )}

          {/* Login Form */}
          <form action={login} className="space-y-4 mb-8">
            <div className="relative">
              <label htmlFor="email_login" className="sr-only">Email</label>
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                id="email_login" name="email" type="email" required
                placeholder="Email address"
                className="w-full pl-11 pr-4 py-3.5 border border-[var(--border)] bg-[var(--bg-sidebar)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm input-focus"
              />
            </div>

            <div className="relative">
              <label htmlFor="password_login" className="sr-only">Password</label>
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                id="password_login" name="password" type="password" required
                placeholder="Password"
                className="w-full pl-11 pr-4 py-3.5 border border-[var(--border)] bg-[var(--bg-sidebar)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm input-focus"
              />
            </div>

            <button type="submit" className="w-full btn-gradient py-3.5 rounded-xl font-semibold text-sm shadow-lg">
              Sign In
            </button>
          </form>

          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-[var(--border)]" />
            <span className="flex-shrink-0 mx-4 text-[var(--text-muted)] text-sm">New to MedAI?</span>
            <div className="flex-grow border-t border-[var(--border)]" />
          </div>

          {/* Signup Form */}
          <form action={signup} className="space-y-4 mt-4 border border-[var(--border)] bg-[var(--bg-sidebar)] p-6 rounded-2xl">
            <h3 className="font-semibold text-[var(--text-secondary)] text-sm mb-1">Create a free account</h3>

            <div className="relative">
              <label htmlFor="fullName" className="sr-only">Full Name</label>
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                id="fullName" name="fullName" type="text" required
                placeholder="Full Name"
                className="w-full pl-11 pr-4 py-3.5 border border-[var(--border)] bg-[var(--bg-card)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm input-focus"
              />
            </div>

            <div className="relative">
              <label htmlFor="email_signup" className="sr-only">Email</label>
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                id="email_signup" name="email" type="email" required
                placeholder="Email address"
                className="w-full pl-11 pr-4 py-3.5 border border-[var(--border)] bg-[var(--bg-card)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm input-focus"
              />
            </div>

            <div className="relative">
              <label htmlFor="password_signup" className="sr-only">Password</label>
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                id="password_signup" name="password" type="password" required
                placeholder="Create Password"
                className="w-full pl-11 pr-4 py-3.5 border border-[var(--border)] bg-[var(--bg-card)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm input-focus"
              />
            </div>

            <button type="submit" className="w-full btn-gradient py-3.5 rounded-xl font-semibold text-sm shadow-lg">
              Sign Up for Free
            </button>
          </form>

          <p className="mt-6 text-xs text-center text-[var(--text-muted)]">
            By continuing, you acknowledge our medical disclaimer. MedAI is for informational purposes only.
          </p>
        </div>
      </div>
    </div>
  )
}
