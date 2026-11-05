import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Shield, Activity, Zap, ShieldCheck, ArrowRight } from 'lucide-react'
import { HeroVisual } from './HeroVisual'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">

      {/* Background ambient lighting */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-blue-100/40 via-transparent to-transparent dark:from-blue-950/20 dark:via-transparent dark:to-transparent -z-10" 
      />

      {/* Navbar for landing page */}
      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between max-w-7xl mx-auto border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Shield className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">MedAI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-9 px-4 py-2 rounded-md text-sm font-medium border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs leading-none"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-9 px-4 py-2 rounded-md text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-xs gap-1.5 transition-colors leading-none"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-20 sm:pt-16 sm:pb-24 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

        {/* Left Column: Heading, Value Prop & CTAs */}
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300 mb-6 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
            Preliminary AI Triage · Educational Health Assistant
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-6">
            Your Health Intelligence,{' '}
            <span className="text-blue-600 dark:text-blue-400">Understood.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
            Describe your symptoms or attach a reference photo. MedAI conducts an adaptive follow-up triage session to help organize your symptoms before you consult a licensed medical professional.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <Link
              href="/login"
              className="w-full sm:w-auto h-11 px-6 rounded-md text-base font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center justify-center gap-2 group transition-colors"
            >
              <span>Start Free Assessment</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>No credit card required · Instant triage</span>
            </div>
          </div>

          {/* Architecture & Feature highlights row (honest, verifiable specs) */}
          <div className="flex items-center gap-6 sm:gap-10 mt-10 justify-center lg:justify-start flex-wrap pt-6 border-t border-slate-200 dark:border-slate-800">
            {[
              { label: 'Clarification Loop', value: 'Up to 3 Turns' },
              { label: 'Supported Locales', value: '4 Languages' },
              { label: 'Input Channels', value: 'Text & Photos' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{stat.value}</div>
                <div className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Central Dashboard Mockup & Floating Badges */}
        <div className="flex-1 w-full flex items-center justify-center">
          <HeroVisual />
        </div>
      </main>

      {/* Feature Highlights Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-20 pt-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">
            Intelligent Preliminary Triage
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300">
            Engineered for structured symptom guidance, patient privacy, and clear clinical summaries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Activity,
              title: 'Multimodal Symptom Intake',
              desc: 'Analyze natural language symptoms alongside reference symptom photos to provide contextualized preliminary assessments.',
            },
            {
              icon: Zap,
              title: 'Adaptive Follow-Up Loop',
              desc: 'Engages in up to 3 targeted clarifying questions, narrowing down diagnostic context before compiling your summary report.',
            },
            {
              icon: ShieldCheck,
              title: 'Row-Level Data Security',
              desc: 'Patient health records and profile details are protected with Supabase Row Level Security (RLS) scoped strictly to authenticated users.',
            },
          ].map(feature => (
            <div
              key={feature.title}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div className="w-11 h-11 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-5 shadow-xs">
                <feature.icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Medical disclaimer footer */}
      <footer className="relative z-10 text-center px-6 pb-12 pt-6 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400 max-w-7xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-2 font-medium text-slate-700 dark:text-slate-300">
          <ShieldCheck className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>Medical Disclaimer</span>
        </div>
        <p className="max-w-2xl mx-auto leading-relaxed">
          MedAI is an informational triage support platform. It is not a substitute for professional clinical medical advice, emergency care, diagnosis, or treatment. Always consult a licensed healthcare provider for medical concerns.
        </p>
      </footer>
    </div>
  )
}
