'use client'

import { useState, useRef } from 'react'
import { analyzeSymptoms } from './actions'
import { ImageUpload } from './ImageUpload'
import { Activity, ArrowUp, Paperclip, Pill } from 'lucide-react'
import { t, getSuggestions, Language } from '@/lib/i18n'
import { MicButton } from './MicButton'

interface TriageFormProps {
  language: Language
}

export function TriageForm({ language }: TriageFormProps) {
  const [turnCount, setTurnCount] = useState(0)
  const [confidenceScore, setConfidenceScore] = useState(0)
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTriaging, setIsTriaging] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [hasImage, setHasImage] = useState(false)

  const formRef = useRef<HTMLFormElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleTriageSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (isDone) return
    e.preventDefault()
    if (!inputValue.trim()) return

    setIsTriaging(true)
    const userMessage = { role: 'user', text: inputValue }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInputValue('')
    setTimeout(scrollToBottom, 50)

    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ messages: updatedMessages, language }),
      })

      const contentType = res.headers.get('content-type')
      if (res.ok && contentType?.includes('application/json')) {
        const data = await res.json()
        const newScore = data.confidenceScore || confidenceScore
        setConfidenceScore(newScore)

        const nextTurn = turnCount + 1
        setTurnCount(nextTurn)

        // Stop after 3 follow-up questions to prevent an infinite loop, or if AI reaches high confidence
        if (newScore >= 85 || nextTurn >= 3) {
          setIsDone(true)
          const doneMsg = { role: 'ai', text: t('triage_complete', language) }
          setMessages([...updatedMessages, doneMsg])
          setTimeout(() => formRef.current?.requestSubmit(), 600)
        } else {
          const aiQuestion = data.next_question || t('greeting', language)
          const aiMsg = { role: 'ai', text: aiQuestion }
          setMessages([...updatedMessages, aiMsg])
          setTimeout(scrollToBottom, 50)
        }
      } else {
        setIsDone(true)
        setTimeout(() => formRef.current?.requestSubmit(), 300)
      }
    } catch {
      setIsDone(true)
      setTimeout(() => formRef.current?.requestSubmit(), 300)
    } finally {
      setIsTriaging(false)
    }
  }

  const compiledSymptoms =
    messages.map(m => `[${m.role.toUpperCase()}]: ${m.text}`).join('\n') +
    (inputValue ? `\n[USER]: ${inputValue}` : '')

  const suggestions = getSuggestions(language)
  const showSuggestions = messages.length === 0 && !inputValue

  return (
    <form ref={formRef} action={analyzeSymptoms} onSubmit={handleTriageSubmit} className="flex flex-col p-5 sm:p-6 gap-5">
      <input type="hidden" name="symptoms" value={compiledSymptoms} />
      <input type="hidden" name="language" value={language} />

      {/* ===== Confidence Meter ===== */}
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 uppercase tracking-wide">
            <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            {t('confidence', language)}
          </span>
          <span className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white tabular-nums">
            {confidenceScore}%
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 shadow-xs"
            style={{ width: `${confidenceScore}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          <span>{t('triage_turn', language)}: <strong className="text-slate-700 dark:text-slate-200 font-semibold">{turnCount} / 3</strong></span>
          <span>{t('target', language)}: <strong className="text-slate-700 dark:text-slate-200 font-semibold">85%</strong></span>
        </div>
      </div>

      {/* ===== Message History ===== */}
      {messages.length > 0 && (
        <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 text-sm sm:text-base leading-relaxed rounded-lg shadow-xs ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isTriaging && (
            <div className="flex justify-start">
              <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-lg shadow-xs">
                <div className="flex gap-2 items-center">
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* ===== Suggestion Chips ===== */}
      {showSuggestions && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map(chip => (
            <button
              key={chip}
              type="button"
              onClick={() => setInputValue(chip)}
              className="inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-xs cursor-pointer"
            >
              +{chip}
            </button>
          ))}
        </div>
      )}

      {/* ===== Medications (shown only on first turn) ===== */}
      {turnCount === 0 && !isDone && (
        <div className="relative flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3.5 py-1 transition-colors focus-within:ring-1 focus-within:ring-blue-500/20 focus-within:border-blue-600">
          <Pill className="w-4 h-4 text-slate-400 flex-shrink-0 mr-2.5" />
          <input
            name="medications"
            type="text"
            className="w-full bg-transparent border-0 outline-none text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 py-1.5 focus:ring-0"
            placeholder={`${t('medications', language)} (${t('medications_placeholder', language)})`}
            disabled={isTriaging || isDone}
          />
        </div>
      )}

      {/* ===== Bottom Input Bar & Dropzone ===== */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 p-2 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20 transition-all shadow-xs">

          {/* Attach photo */}
          <button
            type="button"
            onClick={() => setShowImageUpload(!showImageUpload)}
            disabled={isDone}
            className={`relative flex-shrink-0 w-9 h-9 rounded-md flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
              showImageUpload
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-900'
                : hasImage
                ? 'bg-blue-50/50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700'
            }`}
            title={hasImage ? 'Clinical photo attached (click to view)' : 'Attach clinical photo'}
            aria-label={hasImage ? 'Clinical photo attached (click to view)' : 'Attach clinical photo'}
          >
            <Paperclip className="w-4 h-4" />
            {hasImage && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {/* Textarea */}
          <textarea
            id="symptom-input"
            rows={1}
            value={inputValue}
            onChange={e => {
              setInputValue(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                formRef.current?.requestSubmit()
              }
            }}
            disabled={isTriaging || isDone}
            className="flex-1 bg-transparent resize-none outline-none text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 py-1.5 px-2 max-h-36 disabled:opacity-50"
            placeholder={isDone ? t('generating_report', language) : t('placeholder', language)}
            style={{ lineHeight: '1.5' }}
          />

          {/* Mic Button */}
          <MicButton
            value={inputValue}
            onChange={setInputValue}
            disabled={isTriaging || isDone}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={isTriaging || isDone || !inputValue.trim()}
            className="flex-shrink-0 w-9 h-9 rounded-md flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors"
            title="Send"
            aria-label="Send symptom description"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>

        {/* ===== Image Upload Zone (expands below input) ===== */}
        <div className={showImageUpload ? 'animate-slide-up' : 'hidden'}>
          <ImageUpload onFileSelected={setHasImage} />
        </div>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-0.5">
          Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-600 dark:text-slate-300">Enter</kbd> to send · <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-600 dark:text-slate-300">Shift+Enter</kbd> for new line
        </p>
      </div>
    </form>
  )
}
