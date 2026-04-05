'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic } from 'lucide-react'

export function SymptomInput() {
  const [isListening, setIsListening] = useState(false)
  const [text, setText] = useState('')
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check for browser support
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        // Optional: set language explicitly if requested in the future
        // recognition.lang = 'en-US'

        recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              const newWord = event.results[i][0].transcript.trim()
              if (newWord) {
                // Ensure there is a space if the previous text doesn't end with one
                setText(prev => prev.length > 0 && !prev.endsWith(' ') ? `${prev} ${newWord} ` : `${prev}${newWord} `)
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
  }, [])

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
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  return (
    <div className="relative">
      <textarea
        id="symptoms"
        name="symptoms"
        rows={5}
        required
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full rounded-xl border border-slate-300 p-4 pb-14 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none resize-none shadow-sm text-slate-800"
        placeholder="E.g., I have had a persistent headache for the last 2 days accompanied by mild nausea..."
      />
      
      <button
        onClick={toggleListening}
        type="button"
        className={`absolute bottom-4 right-4 p-3 rounded-full transition-all shadow-sm flex items-center justify-center ${
          isListening 
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-red-200 shadow-md ring-4 ring-red-100' 
            : 'bg-white hover:bg-slate-50 text-indigo-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-700'
        }`}
        title={isListening ? "Stop Recording" : "Dictate Symptoms with Voice"}
      >
        <Mic className="w-5 h-5" />
      </button>
      
      {isListening && (
        <span className="absolute bottom-7 right-16 text-xs font-bold text-red-500 animate-pulse tracking-wide select-none">
          LISTENING...
        </span>
      )}
    </div>
  )
}
