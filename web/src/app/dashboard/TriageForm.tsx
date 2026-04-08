'use client'

import { useState, useRef } from 'react'
import { analyzeSymptoms } from './actions'
import { ImageUpload } from './ImageUpload'
import { Activity, ArrowUp, Paperclip } from 'lucide-react'
import { t, getSuggestions, Language } from '@/lib/i18n'
import { MicButton } from './MicButton'

interface TriageFormProps {
  language: Language
}

export function TriageForm({ language }: TriageFormProps) {
  const [turnCount, setTurnCount] = useState(0)
  const [confidenceScore, setConfidenceScore] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTriaging, setIsTriaging] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)

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
          setCurrentQuestion(t('triage_complete', language))
          const doneMsg = { role: 'ai', text: t('triage_complete', language) }
          setMessages([...updatedMessages, doneMsg])
          setTimeout(() => formRef.current?.requestSubmit(), 600)
        } else {
          const aiQuestion = data.next_question || t('greeting', language)
          setCurrentQuestion(aiQuestion)
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
    <form ref={formRef} action={analyzeSymptoms} onSubmit={handleTriageSubmit} className="flex flex-col">
      <input type="hidden" name="symptoms" value={compiledSymptoms} />
      <input type="hidden" name="language" value={language} />

      {/* ===== Confidence Meter ===== */}
      <div className="px-6 pt-6 pb-4 border-b border-[var(--border)]">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5 uppercase tracking-widest">
            <Activity className="w-3.5 h-3.5" />
            {t('confidence', language)}
          </span>
          <span className="text-sm font-bold" style={{ color: confidenceScore >= 85 ? '#22C55E' : confidenceScore >= 50 ? '#F59E0B' : '#C8856A' }}>
            {confidenceScore}%
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-white/8 rounded-full h-1.5 overflow-hidden">
          <div
            className="confidence-bar h-1.5 rounded-full"
            style={{ width: `${confidenceScore}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-medium">
          <span>{t('triage_turn', language)}: {turnCount} / 3</span>
          <span>{t('target', language)}: 85%</span>
        </div>
      </div>

      {/* ===== Message History ===== */}
      {messages.length > 0 && (
        <div className="px-6 py-4 space-y-3 max-h-64 overflow-y-auto">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
            >
              <div
                className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user' ? 'message-user' : 'message-ai'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isTriaging && (
            <div className="flex justify-start">
              <div className="message-ai px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* ===== Suggestion Chips ===== */}
      {showSuggestions && (
        <div className="px-6 pt-4 pb-2 flex flex-wrap gap-2">
          {suggestions.map(chip => (
            <button
              key={chip}
              type="button"
              onClick={() => setInputValue(chip)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:border-[#C8856A] hover:text-[#C8856A] dark:hover:border-indigo-400 dark:hover:text-indigo-400 transition-all duration-150 bg-[var(--bg-sidebar)]"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* ===== Image Upload (collapsible) ===== */}
      {showImageUpload && (
        <div className="px-6 py-3 border-t border-[var(--border)] animate-slide-up">
          <ImageUpload />
        </div>
      )}

      {/* ===== Medications (shown only on first turn) ===== */}
      {turnCount === 0 && !isDone && (
        <div className="px-6 py-3 border-t border-[var(--border)]">
          <input
            name="medications"
            type="text"
            className="w-full text-sm bg-transparent text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] outline-none input-focus border border-[var(--border)] rounded-xl px-4 py-2.5"
            placeholder={`💊 ${t('medications', language)} (${t('medications_placeholder', language)})`}
            disabled={isTriaging || isDone}
          />
        </div>
      )}

      {/* ===== Bottom Input Bar ===== */}
      <div className="px-4 py-4 border-t border-[var(--border)] bg-[var(--bg-card)]">
        <div className="flex items-end gap-2 bg-[var(--bg-sidebar)] rounded-2xl border border-[var(--border)] px-3 py-2 focus-within:border-[#C8856A] dark:focus-within:border-indigo-500 transition-colors">

          {/* Attach photo */}
          <button
            type="button"
            onClick={() => setShowImageUpload(!showImageUpload)}
            disabled={isDone || turnCount > 0}
            className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[#C8856A] dark:hover:text-indigo-400 hover:bg-[var(--border)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            title="Attach photo"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Textarea */}
          <textarea
            id="symptom-input"
            rows={1}
            value={inputValue}
            onChange={e => {
              setInputValue(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                formRef.current?.requestSubmit()
              }
            }}
            disabled={isTriaging || isDone}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] py-1.5 max-h-32 disabled:opacity-50"
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
            className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center btn-gradient disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none shadow-md"
            title="Send"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>

        <p className="text-center text-[10px] text-[var(--text-muted)] mt-2">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </form>
  )
}
