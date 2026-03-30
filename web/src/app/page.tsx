import Link from 'next/link'
import { Activity, ShieldCheck, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center text-slate-900">
      <main className="flex-grow flex flex-col items-center justify-center p-6 md:p-24 w-full">
        
        {/* Hero Section */}
        <div className="z-10 max-w-5xl w-full flex flex-col items-center text-center font-mono text-sm lg:flex mb-16">
          <div className="inline-flex items-center justify-center p-4 bg-blue-100 rounded-full mb-8 shadow-sm border border-blue-200">
            <Activity className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl md:text-5xl font-extrabold text-blue-900 tracking-tight font-sans">
              medAI
            </h1>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 font-sans px-4">
            Preliminary Health Insights,<br className="hidden md:block" />Powered by Multimodal AI.
          </h2>
          
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-12 font-sans px-4">
            Upload a photo of your symptom or describe how you feel. Get instant, AI-driven guidance and structured condition reports designed to help you decide your next steps.
          </p>

          <Link href="/login" className="font-sans text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 px-10 py-5 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center">
            Start Your Assessment
            <svg className="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full px-4 font-sans mb-12">
          
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center text-center hover:shadow-md transition">
            <div className="bg-blue-50 p-4 rounded-2xl mb-6">
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Multimodal Analysis</h3>
            <p className="text-slate-600">Simultaneously analyzes your photos and text descriptions using the advanced Gemini API for high accuracy.</p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center text-center hover:shadow-md transition">
            <div className="bg-amber-50 p-4 rounded-2xl mb-6">
              <Zap className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Emergency Detection</h3>
            <p className="text-slate-600">Instantly flags symptoms resembling critical conditions and strongly advises contacting emergency services.</p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center text-center hover:shadow-md transition">
            <div className="bg-green-50 p-4 rounded-2xl mb-6">
              <ShieldCheck className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Secure & Private</h3>
            <p className="text-slate-600">Powered by Supabase. Your symptom data and images are securely stored with strict access controls.</p>
          </div>

        </div>

      </main>
    </div>
  )
}
