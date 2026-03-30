import { login, signup } from './actions'
import { Activity, ShieldCheck, Mail, Lock, User } from 'lucide-react'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="flex bg-slate-900 min-h-screen items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Decorative background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 hidden md:block animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 hidden md:block animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative z-10">
        
        {/* Left Side: Branding & Info */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-10 md:p-14 text-white flex flex-col justify-between hidden md:flex">
          <div>
            <Link href="/" className="inline-flex items-center text-white/90 hover:text-white transition-colors mb-12">
              <Activity className="w-8 h-8 mr-3" />
              <span className="text-3xl font-extrabold tracking-tight">medAI</span>
            </Link>
            
            <h2 className="text-4xl font-bold mb-6 leading-tight">Your health journey, <br/>powered by intelligence.</h2>
            <p className="text-blue-100 text-lg mb-8 leading-relaxed">
              Join thousands of users getting instant multimodal health insights before visiting their doctor.
            </p>
          </div>
          
          <div className="bg-white/10 p-6 rounded-2xl border border-white/20">
            <div className="flex items-center mb-3">
              <ShieldCheck className="w-6 h-6 mr-3 text-green-300" />
              <h3 className="font-semibold text-lg">Secure & Private</h3>
            </div>
            <p className="text-blue-100 text-sm">
              Your medical data is encrypted and securely stored using enterprise-grade infrastructure.
            </p>
          </div>
        </div>

        {/* Right Side: Auth Forms */}
        <div className="p-8 md:p-14 bg-white">
          <div className="md:hidden flex items-center justify-center mb-8">
            <Activity className="w-8 h-8 text-blue-600 mr-2" />
            <span className="text-2xl font-extrabold text-slate-800">medAI</span>
          </div>

          <h2 className="text-3xl font-bold text-slate-800 mb-2">Welcome</h2>
          <p className="text-slate-500 mb-8">Sign in or create a new account to continue.</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg shadow-sm flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
              <span>{decodeURIComponent(error)}</span>
            </div>
          )}

          {/* Login Form */}
          <form action={login} className="space-y-5 mb-8">
            <div className="relative">
              <label htmlFor="email_login" className="sr-only">Email Address</label>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email_login"
                name="email"
                type="email"
                required
                placeholder="Email address"
                className="w-full pl-11 pr-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all"
              />
            </div>

            <div className="relative">
              <label htmlFor="password_login" className="sr-only">Password</label>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password_login"
                name="password"
                type="password"
                required
                placeholder="Password"
                className="w-full pl-11 pr-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 rounded-xl transition-colors shadow-lg hover:shadow-xl active:scale-[0.98] flex justify-center items-center"
            >
              Sign In
            </button>
          </form>

          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-medium">New to medAI? Register below</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Signup Form */}
          <form action={signup} className="space-y-5 mt-8 border border-slate-100 bg-slate-50 p-6 rounded-2xl">
            <h3 className="font-semibold text-slate-700 mb-2">Create an account</h3>
            
            <div className="relative">
              <label htmlFor="fullName" className="sr-only">Full Name</label>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                placeholder="Full Name"
                className="w-full pl-11 pr-4 py-3 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div className="relative">
              <label htmlFor="email_signup" className="sr-only">Email Address</label>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email_signup"
                name="email"
                type="email"
                required
                placeholder="Email address"
                className="w-full pl-11 pr-4 py-3 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div className="relative">
              <label htmlFor="password_signup" className="sr-only">Password</label>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password_signup"
                name="password"
                type="password"
                required
                placeholder="Create Password"
                className="w-full pl-11 pr-4 py-3 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors shadow-lg hover:shadow-xl active:scale-[0.98] flex justify-center items-center"
            >
              Sign Up for Free
            </button>
          </form>

          <p className="mt-8 text-xs text-center text-slate-500 leading-relaxed">
            By signing in or registering, you acknowledge our medical disclaimer. <br/> <span className="font-semibold text-slate-700">medAI is for informational purposes only.</span>
          </p>
        </div>
      </div>
    </div>
  )
}
