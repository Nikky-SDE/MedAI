'use client'

import { useState, useRef } from 'react'
import { analyzeSymptoms } from './actions'
import { ImageUpload } from './ImageUpload'
import { SymptomInput } from './SymptomInput'
import { Bot, Activity } from 'lucide-react'

export function TriageForm() {
  const [turnCount, setTurnCount] = useState(0)
  const [confidenceScore, setConfidenceScore] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState("How are you feeling today?")
  const [messages, setMessages] = useState<{role: string, text: string}[]>([])
  
  const [inputValue, setInputValue] = useState('')
  const [isTriaging, setIsTriaging] = useState(false)
  const [isDone, setIsDone] = useState(false)
  
  const formRef = useRef<HTMLFormElement>(null)

  const handleTriageSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // If the loop is finished, allow the native server action to run
    if (isDone) return; 

    e.preventDefault();
    if (!inputValue.trim()) return;

    setIsTriaging(true)

    const userMessage = { role: 'user', text: inputValue }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)

    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Ensure Supabase Auth cookies securely travel with the request
        body: JSON.stringify({ messages: updatedMessages }),
      })

      // Check if Next.js accidentally returned an HTML redirect or 404 page (Turbopack bug)
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.indexOf("application/json") !== -1) {
        const data = await res.json()
        const newScore = data.confidenceScore || confidenceScore
        setConfidenceScore(newScore)
        
        const nextTurn = turnCount + 1
        setTurnCount(nextTurn)

        // The Triggers: Exit loop if confidence >= 85 or we hit 3 follow-ups
        if (newScore >= 85 || nextTurn >= 3) {
          setIsDone(true)
          setCurrentQuestion("Triage Complete. Compiling final diagnostic report...")
          
          // Yield to let React re-render, then programmatically submit the form
          setTimeout(() => {
            if (formRef.current) {
              formRef.current.requestSubmit()
            }
          }, 300)
        } else {
          // Continue loop
          const aiQuestion = data.next_question || "Can you provide a bit more detail?"
          setCurrentQuestion(aiQuestion)
          setMessages([...updatedMessages, { role: 'ai', text: aiQuestion }])
          setInputValue('') 
        }
      } else {
        // If it's an HTML page or 500 error, skip the triage and jump directly to the final report!
        console.warn("Triage API unavailable or returned HTML, safely bypassing...")
        setIsDone(true)
        setTimeout(() => formRef.current?.requestSubmit(), 300)
      }
    } catch (err) {
      console.error(err)
      setIsDone(true)
      setTimeout(() => formRef.current?.requestSubmit(), 300)
    } finally {
      setIsTriaging(false)
    }
  }

  // Compile the context for the backend `analyzeSymptoms` action once the loop closes
  const compiledSymptoms = messages.map(m => `[${m.role.toUpperCase()}]: ${m.text}`).join('\n') + `\n[USER]: ${inputValue}`;

  return (
    <form ref={formRef} action={analyzeSymptoms} onSubmit={handleTriageSubmit} className="space-y-8 flex flex-col">
      <input type="hidden" name="symptoms" value={compiledSymptoms} />

      {/* Dynamic Confidence Meter */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-center mb-3 relative z-10">
          <span className="text-sm font-bold text-slate-700 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-indigo-600" />
            Diagnostic Confidence
          </span>
          <span className="text-lg font-bold text-indigo-600">{confidenceScore}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden relative z-10">
          <div 
            className="bg-indigo-600 h-3 rounded-full transition-all duration-1000 ease-out" 
            style={{ width: `${confidenceScore}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-3 text-xs text-slate-400 font-medium tracking-wide uppercase relative z-10">
          <span>Triage Turn: {turnCount} / 3</span>
          <span>Target: 85%</span>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-xl font-bold text-slate-800 flex items-start leading-tight">
          <Bot className="w-7 h-7 mr-3 text-blue-500 flex-shrink-0 mt-0.5" />
          {currentQuestion}
        </label>
        
        <SymptomInput value={inputValue} onChange={setInputValue} disabled={isTriaging || isDone} />
      </div>

      <div className={`space-y-3 transition-opacity duration-500 ${turnCount > 0 ? 'opacity-40 pointer-events-none hidden md:block' : 'opacity-100'}`}>
        <label htmlFor="medications" className="block text-lg font-semibold text-slate-800">
          Current Medications <span className="text-slate-400 font-normal text-sm block sm:inline sm:ml-2">(Optional)</span>
        </label>
        <input
          id="medications"
          name="medications"
          type="text"
          className="w-full rounded-xl border border-slate-300 p-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none shadow-sm"
          placeholder="E.g., Ibuprofen, Vitamin D3..."
          disabled={isTriaging || isDone}
        />
      </div>

      <div className={`space-y-3 transition-opacity duration-500 ${turnCount > 0 ? 'opacity-40 pointer-events-none hidden md:block' : 'opacity-100'}`}>
        <label className="block text-lg font-semibold text-slate-800">
          Upload a Photo <span className="text-slate-400 font-normal text-sm block sm:inline sm:ml-2">(e.g., skin rash, minor injury)</span>
        </label>
        <ImageUpload />
      </div>

      <div className="pt-6 border-t border-slate-100">
        <button
          type="submit"
          disabled={isTriaging || isDone || !inputValue.trim()}
          className={`w-full font-bold text-lg rounded-xl px-8 py-4 transition-all shadow-lg flex items-center justify-center ${
            isTriaging || isDone || !inputValue.trim()
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-xl hover:-translate-y-0.5'
          }`}
        >
          {isDone ? 'Generating Final Report...' : isTriaging ? 'Processing Analysis...' : turnCount === 0 ? 'Start Diagnostic Triage' : 'Submit Answer'}
        </button>
      </div>
    </form>
  )
}
