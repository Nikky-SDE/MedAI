'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic } from 'lucide-react'

interface MicButtonProps {
  value: string
  onChange: (val: string) => void
  disabled?: boolean
}

export function MicButton({ value, onChange, disabled }: MicButtonProps) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  const valueRef = useRef(value)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    valueRef.current = value
    onChangeRef.current = onChange
  }, [value, onChange])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: any) => {
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
      className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed ${
        isListening
          ? 'mic-listening'
          : 'text-[var(--text-muted)] hover:text-[#C8856A] dark:hover:text-cyan-400 hover:bg-[var(--border)]'
      }`}
      title={isListening ? 'Stop recording' : 'Voice dictation'}
    >
      <Mic className="w-4 h-4" />
    </button>
  )
}
