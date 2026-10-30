'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui'
import { Sparkles } from 'lucide-react'

export function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      variant="primary"
      size="lg"
      isLoading={pending}
      leftIcon={!pending ? <Sparkles className="w-4 h-4" /> : undefined}
      className="w-full h-11 text-base font-medium shadow-sm"
    >
      {pending ? 'Analyzing Symptoms...' : 'Analyze Symptoms with AI'}
    </Button>
  )
}
