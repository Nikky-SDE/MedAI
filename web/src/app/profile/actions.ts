'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function saveProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const jsonParseSafe = (val: FormDataEntryValue | null) => {
    try {
      const parsed = JSON.parse(val?.toString() || '[]')
      return Array.isArray(parsed) ? parsed.slice(0, 50).map(s => String(s).slice(0, 100)) : []
    } catch {
      return []
    }
  }

  const cleanString = (val: FormDataEntryValue | null, maxLen: number) => {
    if (!val) return null
    const str = val.toString().trim()
    return str.length > 0 ? str.slice(0, maxLen) : null
  }

  const parseIntClamped = (val: FormDataEntryValue | null, min: number, max: number) => {
    if (!val) return null
    const parsed = parseInt(val.toString(), 10)
    if (isNaN(parsed)) return null
    return Math.max(min, Math.min(max, parsed))
  }

  const age = parseIntClamped(formData.get('age'), 0, 130)
  const height = cleanString(formData.get('height'), 30)
  const weight = cleanString(formData.get('weight'), 30)
  const biological_sex = cleanString(formData.get('biological_sex'), 30)
  const bloodGroup = cleanString(formData.get('bloodGroup'), 10)
  const medicalHistory = cleanString(formData.get('medicalHistory'), 2000)
  const water_intake = cleanString(formData.get('water_intake'), 50)
  const meal_frequency = cleanString(formData.get('meal_frequency'), 50)
  
  const allergies = jsonParseSafe(formData.get('allergies_tags'))
  const diet_preferences = jsonParseSafe(formData.get('diet_preferences'))
  const food_intolerances = jsonParseSafe(formData.get('food_intolerances'))
  const cycle_symptoms = jsonParseSafe(formData.get('cycle_symptoms'))
  const medications_list = jsonParseSafe(formData.get('medications_list'))
  
  const rawDate = formData.get('last_period_start')?.toString()?.trim() || null
  const last_period_start = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : null
  const cycle_length = parseIntClamped(formData.get('cycle_length'), 10, 100)
  const period_duration = parseIntClamped(formData.get('period_duration'), 1, 30)
  const is_pregnant = formData.get('is_pregnant') === 'true'

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      age,
      height,
      weight,
      biological_sex,
      blood_group: bloodGroup,
      allergies: allergies.join(', ').slice(0, 1000), // fall back to string for old column compatibility
      medical_history: medicalHistory,
      water_intake,
      meal_frequency,
      diet_preferences,
      food_intolerances,
      cycle_symptoms,
      medications_list,
      last_period_start,
      cycle_length,
      period_duration,
      is_pregnant,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })

  if (error) {
    console.error('Profile Save Error:', error)
    redirect('/profile?error=' + encodeURIComponent('Database error: ' + error.message))
  }

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  redirect('/profile?success=' + encodeURIComponent('Health profile updated successfully!'))
}
