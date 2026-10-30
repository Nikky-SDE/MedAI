import { ShieldCheck, Shield } from 'lucide-react'
import Link from 'next/link'
import { AuthForm } from './AuthForm'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const { error, message } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950 font-sans">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">

        {/* Left: Brand Blue Panel in Light Mode, Dark Slate in Dark Mode */}
        <div className="md:col-span-5 bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 dark:from-slate-900 dark:to-slate-900 p-8 sm:p-10 lg:p-12 text-white hidden md:flex flex-col justify-between border-r border-blue-500/30 dark:border-slate-800">
          <div>
            <Link href="/" className="inline-flex items-center text-white hover:text-blue-100 dark:text-slate-100 dark:hover:text-white transition-colors mb-12 gap-3 group">
              <div className="w-9 h-9 rounded-md bg-white text-blue-600 dark:bg-slate-800 dark:text-blue-400 dark:border dark:border-slate-700 flex items-center justify-center shadow-xs group-hover:bg-blue-50 dark:group-hover:bg-slate-700 transition-colors">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white dark:text-slate-100">MedAI</span>
            </Link>

            <h2 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight text-white dark:text-slate-100 leading-tight">
              Clinical intelligence,<br />at your fingertips.
            </h2>
            <p className="text-blue-100 dark:text-slate-400 text-sm sm:text-base mb-8 leading-relaxed">
              Preliminary medical guidance and intelligent symptom triage built for patients and enterprise healthcare workflows.
            </p>

            <div className="space-y-4">
              {[
                { title: 'Multimodal symptom evaluation', desc: 'Describe or dictate symptoms freely' },
                { title: 'Smart follow-up triage loop', desc: 'AI refines assessment with context' },
                { title: 'Verified regional facility mapping', desc: 'Instant access to nearby emergency care' },
              ].map(item => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded bg-blue-500/40 dark:bg-slate-800 border border-blue-400/40 dark:border-slate-700 flex items-center justify-center flex-shrink-0 text-white dark:text-blue-400 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white dark:text-slate-200 block leading-snug">{item.title}</span>
                    <span className="text-xs text-blue-100 dark:text-slate-400 block mt-0.5">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-700/50 dark:bg-slate-800/80 p-5 rounded-lg border border-blue-500/40 dark:border-slate-700 mt-10">
            <div className="flex items-center gap-2.5 mb-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-300 dark:text-emerald-400 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-white dark:text-slate-200">Privacy & Security</h3>
            </div>
            <p className="text-blue-100 dark:text-slate-400 text-xs leading-relaxed">
              Medical assessments are stored in encrypted Supabase containers with strict Row Level Security.
            </p>
          </div>
        </div>

        {/* Right: Authentication Forms (Proportionate, h-10 sizing, clear hierarchy) */}
        <div className="md:col-span-7 p-6 sm:p-10 lg:p-12 bg-white dark:bg-slate-900 flex flex-col justify-center">
          {/* Mobile Logo */}
          <div className="md:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">MedAI</span>
          </div>

          <AuthForm error={error} message={message} />
        </div>
      </div>
    </div>
  )
}
