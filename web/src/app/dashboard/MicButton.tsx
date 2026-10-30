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
  onerror: () => void
  onend: () => void
  start: () => void
  stop: () => void
}

interface MicButtonProps {
  value: string
  onChange: (val: string) => void
  disabled?: boolean
}

export function MicButton({ value, onChange, disabled }: MicButtonProps) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const valueRef = useRef(value)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    valueRef.current = value
    onChangeRef.current = onChange
  }, [value, onChange])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const windowWithSpeech = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance
    }
    const SR = windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const word = event.results[i][0].transcript.trim()
          if (word) {
            const currentVal = valueRef.current
            onChangeRef.current(currentVal.length > 0 && !currentVal.endsWith(' ') ? `${currentVal} ${word} ` : `${currentVal}${word} `)
          }
        }
      }
    }

    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognitionRef.current = recognition

    return () => {
      try {
        recognition.stop()
      } catch {
        // Recognition might already be stopped
      }
    }
  }, [])

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!recognitionRef.current) {
      alert('Voice dictation requires Google Chrome, Safari, or Microsoft Edge.')
      return
    }
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else if (!disabled) {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      className={`flex-shrink-0 w-9 h-9 rounded-md flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        isListening
          ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 animate-pulse'
          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800'
      }`}
      title={isListening ? 'Stop recording' : 'Voice dictation'}
      aria-label={isListening ? 'Stop recording' : 'Voice dictation'}
    >
      <Mic className="w-4 h-4" />
    </button>
  )
}
