'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export async function analyzeSymptoms(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const symptoms = formData.get('symptoms') as string
  const medications = formData.get('medications') as string
  const imageFile = formData.get('image') as File | null

  let imageUrl = null
  let imageBase64 = null
  let mimeType = null

  if (imageFile && imageFile.size > 0) {
    // 1. Upload to Supabase Storage
    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('symptoms')
      .upload(fileName, imageFile)

    if (!uploadError && uploadData) {
      const { data: publicUrlData } = supabase.storage
        .from('symptoms')
        .getPublicUrl(uploadData.path)
      imageUrl = publicUrlData.publicUrl
    }

    // Prepare for Gemini inlineData
    const arrayBuffer = await imageFile.arrayBuffer()
    imageBase64 = Buffer.from(arrayBuffer).toString('base64')
    mimeType = imageFile.type
  }

  // 2. Call Gemini API
  const prompt = `
  You are an AI medical assistant. A user has reported the following symptoms:
  Symptoms: "${symptoms}"
  ${medications ? `Current Medications: "${medications}"` : ''}

  Please analyze these symptoms and any attached image.
  
  IMPORTANT INSTRUCTIONS:
  - Respond ONLY in valid JSON format.
  - Do not include markdown codeblocks (like \`\`\`json). Just return the raw JSON object.
  - Structure your JSON as follows:
  {
    "condition": "Probable condition name",
    "confidenceLevel": "High" | "Medium" | "Low",
    "explanation": "A detailed but easy to understand explanation of the possible causes.",
    "isEmergency": true/false (true ONLY IF these symptoms suggest a life-threatening or immediate critical emergency like stroke, heart attack, severe breathing issue, etc),
    "otcMedicineAdvice": "General advice about over-the-counter medication classes (e.g. 'Ibuprofen for pain') that might help, if any.",
    "recommendation": "What the user should do next (e.g. 'Rest and hydrate', 'Visit a general physician', 'Go to ER immediately')."
  }
  `

  const parts: any[] = [{ text: prompt }]

  if (imageBase64 && mimeType) {
    parts.push({
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    })
  }

  let aiResponse = null
  let isEmergency = false

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
      config: {
        responseMimeType: "application/json",
      }
    })

    const responseText = response.text
    if (responseText) {
      aiResponse = JSON.parse(responseText)
      isEmergency = aiResponse.isEmergency || false
    }
  } catch (error) {
    console.error('Gemini API Error:', error)
    // Fallback if AI fails
    aiResponse = {
      condition: "Error Analyzing",
      confidenceLevel: "Low",
      explanation: "We could not process the medical report at this time.",
      isEmergency: false,
      otcMedicineAdvice: "None",
      recommendation: "Please consult a doctor or try again later."
    }
  }

  // 3. Save report to Supabase DB
  const { data: reportData, error: dbError } = await supabase
    .from('reports')
    .insert({
      user_id: user.id,
      symptom_description: symptoms,
      image_url: imageUrl,
      ai_response: aiResponse,
      is_emergency: isEmergency,
    })
    .select('id')
    .single()

  if (dbError || !reportData) {
    console.error("Database Insert Error:", dbError)
    // Just display a dummy report ID or handle error gracefully
    redirect('/dashboard?error=Could not save report')
  }

  // 4. Redirect to Report page
  redirect(`/report/${reportData.id}`)
}
