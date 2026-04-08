import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { messages, language } = await req.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Initialize Groq inside the function to ensure the fresh GROQ_API_KEY is used
    const { default: Groq } = await import('groq-sdk')
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY as string })

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
      const daysSince = Math.floor((new Date().getTime() - new Date(profile.last_period_start).getTime()) / (1000 * 3600 * 24))
      const currentDayOfCycle = daysSince % (profile.cycle_length || 28)
      
      let phase = 'Luteal'
      if (currentDayOfCycle < (profile.period_duration || 5)) phase = 'Menstrual'
      else if (currentDayOfCycle < 13) phase = 'Follicular'
      else if (currentDayOfCycle < 17) phase = 'Ovulatory'

      menstrualPhaseContext = `
      - Menstrual Phase: Currently in the ${phase} phase (Day ${currentDayOfCycle} of ${profile.cycle_length || 28} day cycle). Use this to heavily contextualize reported fatigue, cramps, mood or bloating.`
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
    
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    })

    const responseText = response.choices[0]?.message?.content
    if (responseText) {
      // Clean up markdown code blocks if the AI accidentally included them
      const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim()
      const triageData = JSON.parse(cleanedText)
      return NextResponse.json(triageData)
    } else {
      throw new Error("Empty response from AI")
    }

  } catch (error: any) {
    console.error("Triage API Error:", error)
    return NextResponse.json(
      { error: "Triage error", message: error?.message },
      { status: 500 }
    )
  }
}
