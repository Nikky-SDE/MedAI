'use client'

import { useState } from 'react'
import { Mail, Lock, User, ArrowRight } from 'lucide-react'
import { login, signup } from './actions'

interface AuthFormProps {
  error?: string
  message?: string
}

export function AuthForm({ error, message }: AuthFormProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login')

  return (
    <div className="w-full">
      {/* Segmented Tab Switcher */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-6 border border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setActiveTab('login')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'login'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('signup')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'signup'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Create Account
        </button>
      </div>

      {message && (
        <div className="mb-5 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-sm rounded-md flex items-start gap-2.5 leading-relaxed">
          <span>✉️</span>
          <span>{decodeURIComponent(message)}</span>
        </div>
      )}

      {error && (
        <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 text-sm rounded-md flex items-start gap-2.5 leading-relaxed">
          <span>⚠️</span>
          <span>{decodeURIComponent(error)}</span>
        </div>
      )}

      {/* Sign In Form */}
      {activeTab === 'login' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
              Welcome back
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Enter your credentials to access your health records.
            </p>
          </div>

          <form action={login} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email_login" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="email_login"
                  name="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full h-10 pl-10 pr-3.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password_login" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="password_login"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full h-10 pl-10 pr-3.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-10 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm sm:text-base shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 flex items-center justify-center gap-2 mt-1"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => setActiveTab('signup')}
              className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Create account
            </button>
          </div>
        </div>
      )}

      {/* Sign Up Form */}
      {activeTab === 'signup' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
              Create your account
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Start evaluating symptoms with AI-powered clinical guidance.
            </p>
          </div>

          <form action={signup} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fullName" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  placeholder="Dr. Jane Doe"
                  className="w-full h-10 pl-10 pr-3.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email_signup" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="email_signup"
                  name="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full h-10 pl-10 pr-3.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password_signup" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Create password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="password_signup"
                  name="password"
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  className="w-full h-10 pl-10 pr-3.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-10 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm sm:text-base shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 flex items-center justify-center gap-2 mt-1"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Sign in
            </button>
          </div>
        </div>
      )}

      <p className="mt-8 text-xs text-center text-slate-500 dark:text-slate-400 leading-relaxed">
        By continuing, you acknowledge that MedAI provides preliminary educational triage insights and is not a substitute for certified medical care.
      </p>
    </div>
  )
}
