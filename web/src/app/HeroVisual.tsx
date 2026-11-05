'use client'

import {
  Activity,
  Shield,
  FileText,
  Mic,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from 'lucide-react'

export function HeroVisual() {
  return (
    <div className="relative w-full max-w-xl mx-auto flex items-center justify-center py-6 sm:py-10">
      {/* Background radial glow */}
      <div 
        aria-hidden="true" 
        className="absolute -inset-4 bg-gradient-to-tr from-blue-600/20 via-indigo-500/15 to-transparent blur-3xl rounded-3xl -z-10" 
      />

      {/* ===== CENTRAL CONSOLE MOCKUP ===== */}
      <div className="w-full bg-slate-900 text-white rounded-xl border border-slate-800 shadow-2xl overflow-hidden relative transition-all duration-300">
        {/* Window Chrome Header */}
        <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            <span className="text-xs font-mono text-slate-400 ml-2">clinical-triage-session.ai</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-medium text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span>AI Engine Online</span>
          </div>
        </div>

        {/* Dashboard Vitals Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-b from-slate-900 to-slate-900/90 border-b border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-blue-400" />
                <h4 className="text-sm font-semibold text-white">Triage Assessment Certainty</h4>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Interactive Symptom Clarification</p>
            </div>
            <div className="text-right">
              <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">85%</span>
              <span className="text-[11px] font-medium text-emerald-400 block">Target Threshold Met</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
            <div
              style={{ width: '85%' }}
              className="bg-gradient-to-r from-blue-600 via-blue-500 to-teal-400 h-2 rounded-full transition-all duration-700 ease-out"
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 font-medium">
            <span>Triage Phase: 3 of 3 Completed</span>
            <span>Target Certainty: 85%</span>
          </div>
        </div>

        {/* Interactive Triage Dialogue Mockup */}
        <div className="p-4 sm:p-5 space-y-3 bg-slate-950/40 text-xs sm:text-sm">
          {/* User Message */}
          <div className="flex justify-end">
            <div className="bg-blue-600 text-white rounded-lg px-3.5 py-2 max-w-[85%] shadow-xs leading-relaxed">
              <p className="font-normal">
                &ldquo;Throbbing headache on my left temple since yesterday, worsens with bright lights.&rdquo;
              </p>
            </div>
          </div>

          {/* AI Response Preview */}
          <div className="flex justify-start">
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-lg p-3.5 max-w-[90%] shadow-xs space-y-2">
              <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>MedAI Preliminary Triage</span>
              </div>
              <p className="text-slate-200 leading-relaxed text-xs sm:text-sm">
                Symptoms align with a moderate migraine pattern with photophobia. No emergency neurological red flags detected.
              </p>

              {/* Differential Preview Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-medium">
                  <CheckCircle2 className="w-3 h-3 text-blue-400" />
                  Primary Match: Migraine (88%)
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-700/60 text-slate-300 text-[11px]">
                  Rule-out: Tension Headache
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Console Status Bar */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Groq LLM Latency: ~1.2s</span>
          </div>
          <div className="flex items-center gap-1 text-blue-400 font-medium">
            <span>Summary Ready</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* ===== SATELLITE FLOATING CARDS ===== */}

      {/* Top Right: Smart Triage Card */}
      <div className="absolute -top-3 -right-2 sm:-right-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-lg z-20 hidden xs:block sm:block transition-all">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-900 dark:text-white">Smart Triage</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Target Reached: 85%</p>
          </div>
        </div>
      </div>

      {/* Bottom Left: AI Clinical Report Card */}
      <div className="absolute -bottom-4 -left-2 sm:-left-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-lg z-20 hidden xs:block sm:block transition-all">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-900 dark:text-white">AI Health Report</span>
              <span className="px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[9px] font-semibold">PRINT</span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Summary & Next Steps</p>
          </div>
        </div>
      </div>

      {/* Middle/Bottom Right: Voice Dictation Card */}
      <div className="absolute bottom-12 -right-4 sm:-right-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 shadow-lg z-20 hidden md:block transition-all">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
            <Mic className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white">Voice Dictation</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Web Speech Recognition</p>
          </div>
        </div>
      </div>
    </div>
  )
}
