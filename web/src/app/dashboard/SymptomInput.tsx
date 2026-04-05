'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic } from 'lucide-react'

interface SymptomInputProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export function SymptomInput({ value, onChange, disabled }: SymptomInputProps) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true

        recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              const newWord = event.results[i][0].transcript.trim()
              if (newWord) {
                // Update outer state 
                onChange(value.length > 0 && !value.endsWith(' ') ? `${value} ${newWord} ` : `${value}${newWord} `)
              }
            }
          }
        }

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error)
          setIsListening(false)
        }

        recognition.onend = () => {
          setIsListening(false)
        }
        
        recognitionRef.current = recognition
      }
    }
  }, [value, onChange]) // Hook dependencies

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault()
    
    if (!recognitionRef.current) {
      alert("Your browser does not support Voice Dictation. Please use Google Chrome, Safari, or Microsoft Edge.")
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      if (!disabled) {
        recognitionRef.current.start()
        setIsListening(true)
      }
    }
  }

  return (
    <div className="relative">
      <textarea
        id="symptoms"
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-300 p-4 pb-14 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none resize-none shadow-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
        placeholder="E.g., I have had a persistent headache for the last 2 days accompanied by mild nausea..."
      />
      
      <button
        onClick={toggleListening}
        type="button"
        disabled={disabled}
        className={`absolute bottom-4 right-4 p-3 rounded-full transition-all shadow-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
          isListening 
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-red-200 shadow-md ring-4 ring-red-100' 
            : 'bg-white hover:bg-slate-50 text-indigo-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-700'
        }`}
        title={isListening ? "Stop Recording" : "Dictate Symptoms with Voice"}
      >
        <Mic className="w-5 h-5" />
      </button>
      
      {isListening && !disabled && (
        <span className="absolute bottom-7 right-16 text-xs font-bold text-red-500 animate-pulse tracking-wide select-none">
          LISTENING...
        </span>
      )}
    </div>
  )
}
