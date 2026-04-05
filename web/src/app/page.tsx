import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Shield, Activity, Zap, ShieldCheck, ArrowRight, Mic, FileText } from 'lucide-react'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen relative overflow-hidden hero-gradient-light dark:hero-gradient-dark">

      {/* Navbar for landing page */}
      <header className="relative z-10 w-full px-6 py-5 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#C8856A] to-[#1B2A6B] shadow-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">MedAI</span>
        </div>
        <Link
          href="/login"
          className="btn-gradient px-5 py-2 rounded-full text-sm font-semibold shadow-md"
        >
          Get Started
        </Link>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24 flex flex-col lg:flex-row items-center gap-16">

        {/* Left: Text */}
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 dark:bg-white/8 border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-slate-300 mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            AI-Powered Smart Triage — Now Live
          </div>

          <h1 className="text-5xl lg:text-7xl font-black tracking-tight leading-none mb-6">
            <span className="text-[var(--text-primary)]">Your Health,</span>
            <br />
            <span className="gradient-text">Understood.</span>
          </h1>

          <p className="text-lg lg:text-xl text-[var(--text-secondary)] max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
            Describe your symptoms or upload a photo. Our AI conducts a smart triage interview, building diagnostic confidence before delivering a comprehensive health report.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <Link
              href="/login"
              className="btn-gradient px-8 py-4 rounded-full text-base font-bold shadow-xl flex items-center gap-2 group"
            >
              Start Free Assessment
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              No credit card required
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-8 mt-12 justify-center lg:justify-start">
            {[
              { label: 'Active Users', value: '12K+' },
              { label: 'Reports Generated', value: '50K+' },
              { label: 'AI Accuracy', value: '94%' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-2xl font-black gradient-text">{stat.value}</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: AI Orb + floating cards */}
        <div className="flex-1 relative flex items-center justify-center min-h-[420px] w-full">

          {/* Central AI Orb */}
          <div className="relative z-10 animate-float">
            <div
              className="ai-orb w-52 h-52 lg:w-64 lg:h-64 rounded-full"
              style={{ filter: 'blur(0px)' }}
            />
            <div className="absolute inset-4 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-sm flex items-center justify-center">
              <Shield className="w-16 h-16 text-white drop-shadow-xl" />
            </div>
          </div>

          {/* Floating info cards */}
          <div className="absolute top-8 right-4 lg:right-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 shadow-xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
                <Activity className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-semibold">Smart Triage</p>
                <p className="text-xs font-bold text-[var(--text-primary)]">Confidence: 94%</p>
              </div>
            </div>
          </div>

          <div className="absolute bottom-12 left-4 lg:left-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 shadow-xl animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#C8856A] to-[#1B2A6B] flex items-center justify-center shadow-sm">
                <Mic className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-semibold">Voice Dictation</p>
                <p className="text-xs font-bold text-[var(--text-primary)]">Speak Your Symptoms</p>
              </div>
            </div>
          </div>

          <div className="absolute top-1/2 left-0 -translate-y-1/2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 shadow-xl animate-fade-in hidden lg:block" style={{ animationDelay: '0.6s' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-sm">
                <FileText className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-semibold">AI Report</p>
                <p className="text-xs font-bold text-[var(--text-primary)]">Instant Analysis</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Feature Cards */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Activity,
              color: 'from-blue-500 to-indigo-500',
              title: 'Multimodal Analysis',
              desc: 'Simultaneously analyzes your photos and symptoms using Gemini for unmatched diagnostic accuracy.',
            },
            {
              icon: Zap,
              color: 'from-[#C8856A] to-[#E8A98B]',
              title: 'Smart Triage Loop',
              desc: 'AI asks up to 3 targeted follow-up questions, raising diagnostic confidence before your final report.',
            },
            {
              icon: ShieldCheck,
              color: 'from-emerald-500 to-teal-500',
              title: 'Secure & Private',
              desc: 'Your health data is encrypted end-to-end with Supabase. Only you can access your reports.',
            },
          ].map(feature => (
            <div
              key={feature.title}
              className="card-hover bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200/80 dark:border-white/8 rounded-3xl p-8 shadow-sm"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-md mb-6`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">{feature.title}</h3>
              <p className="text-[var(--text-secondary)] leading-relaxed text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Medical disclaimer footer */}
      <footer className="relative z-10 text-center px-6 pb-10 text-xs text-[var(--text-muted)]">
        <ShieldCheck className="w-4 h-4 inline mr-1.5 text-amber-500" />
        <strong>Medical Disclaimer:</strong> MedAI is an informational tool. It is NOT a substitute for professional medical diagnosis. Always consult a certified healthcare professional.
      </footer>
    </div>
  )
}
