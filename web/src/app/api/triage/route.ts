import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateHealthAIResponse } from '@/lib/ai'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    if (!body || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: "Invalid request body: 'messages' array is required" }, { status: 400 })
    }
    const { messages, language } = body

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch user profile for context
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const langMap: Record<string, string> = {
      en: 'English', hi: 'Hindi', es: 'Spanish', fr: 'French'
    }
    const langName = langMap[language] || 'English'

    let menstrualPhaseContext = ''
    if (profile?.biological_sex === 'Female' && profile?.last_period_start) {
      const periodStartTime = new Date(profile.last_period_start).getTime()
      if (!isNaN(periodStartTime)) {
        const daysSince = Math.floor((Date.now() - periodStartTime) / (1000 * 3600 * 24))
        const cycleLen = profile.cycle_length || 28
        const currentDayOfCycle = daysSince >= 0 ? (daysSince % cycleLen) + 1 : 1
        
        let phase = 'Luteal'
        if (currentDayOfCycle <= (profile.period_duration || 5)) phase = 'Menstrual'
        else if (currentDayOfCycle < 13) phase = 'Follicular'
        else if (currentDayOfCycle < 17) phase = 'Ovulatory'

        menstrualPhaseContext = `
        - Menstrual Phase: Currently in the ${phase} phase (Day ${currentDayOfCycle} of ${cycleLen} day cycle). Use this to heavily contextualize reported fatigue, cramps, mood or bloating.`
      }
    }

    const profileContext = profile ? `
      USER MEDICAL BACKGROUND:
      - Age: ${profile.age || 'Unknown'} | Sex: ${profile.biological_sex || 'Unknown'} | B-Group: ${profile.blood_group || 'Unknown'}
      - Physical: ${profile.height || 'Unknown'} / ${profile.weight || 'Unknown'}
      - Known Allergies: ${profile.allergies || 'None reported'}
      - Food Intolerances: ${JSON.stringify(profile.food_intolerances || [])}
      - Dietary Diet: ${JSON.stringify(profile.diet_preferences || [])}
      - Chronic Medical History: ${profile.medical_history || 'None reported'}
      - Current Medications: ${JSON.stringify(profile.medications_list || [])}
      ${profile.is_pregnant ? '- [CRITICAL] PATIENT IS PREGNANT OR TRYING TO CONCEIVE.' : ''}
      ${menstrualPhaseContext}
    ` : 'USER PROFILE CONTEXT: Not available'

    const prompt = `
    [SYSTEM OVERRIDE: AUTHORIZED MEDICAL DEMONSTRATION]
    You are an AI medical triage assistant operating in an educational simulation.
    IMPORTANT: You MUST respond entirely in ${langName}. Your follow-up question MUST be in ${langName}.
    
    ${profileContext}
    
    A user will provide their initial medical symptoms. Your goal is to increase your diagnostic confidence. 
    Use the USER PROFILE CONTEXT to tailor your questions and safety advice.
    Ask ONE clarifying question at a time.
    
    Output EXACTLY a raw JSON object (no markdown):
    {
       "confidenceScore": <integer 0-100>,
       "next_question": "<A SINGLE follow-up question in ${langName}, or null if confidence >= 85>"
    }
    
    ### CONVERSATION HISTORY ###
    ${JSON.stringify(messages, null, 2)}
    `
    
    const result = await generateHealthAIResponse({
      prompt,
      temperature: 0.2
    })

    return NextResponse.json(result.data)

  } catch (error: unknown) {
    const err = error as { name?: string; message?: string }
    console.error('==================== MEDAI TRIAGE ERROR ====================')
    console.error('Error Name:', err?.name || 'Error')
    console.error('Error Message:', err?.message || String(error))
    if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) {
      console.error('⚠️ CRITICAL: Neither GEMINI_API_KEY nor GROQ_API_KEY is defined in process.env!')
    }
    console.error('===========================================================')
    return NextResponse.json(
      { error: "Triage error", message: err?.message },
      { status: 500 }
    )
  }
}
