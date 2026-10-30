'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic } from 'lucide-react'

interface SpeechRecognitionEventLike {
  resultIndex: number
  results: {
    length: number
    [index: number]: {
      isFinal: boolean
      [index: number]: { transcript: string }
    }
  }
}

interface SpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  onresult: (event: SpeechRecognitionEventLike) => void
  onerror: (event: { error: string }) => void
  onend: () => void
  start: () => void
  stop: () => void
}

interface SymptomInputProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export function SymptomInput({ value, onChange, disabled }: SymptomInputProps) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const windowWithSpeech = window as unknown as {
        SpeechRecognition?: new () => SpeechRecognitionInstance
        webkitSpeechRecognition?: new () => SpeechRecognitionInstance
      }
      const SpeechRecognition = windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true

        recognition.onresult = (event: SpeechRecognitionEventLike) => {
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

        recognition.onerror = (event: { error: string }) => {
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
        className="w-full rounded-md border border-slate-300 dark:border-slate-700 p-3.5 pb-14 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 shadow-xs resize-none disabled:bg-slate-50 disabled:text-slate-400"
        placeholder="E.g., I have had a persistent headache for the last 2 days accompanied by mild nausea..."
      />
      
      <button
        onClick={toggleListening}
        type="button"
        disabled={disabled}
        className={`absolute bottom-3.5 right-3.5 h-9 px-3 rounded-md text-sm font-medium transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
          isListening 
            ? 'bg-red-600 text-white shadow-xs animate-pulse ring-1 ring-red-500' 
            : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
        }`}
        title={isListening ? "Stop Recording" : "Dictate Symptoms with Voice"}
      >
        <Mic className="w-4 h-4" />
        <span>{isListening ? "Listening..." : "Dictate"}</span>
      </button>
    </div>
  )
}
