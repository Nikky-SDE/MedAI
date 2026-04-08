'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function saveProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const jsonParseSafe = (val: any) => { try { return JSON.parse(val?.toString() || '[]') } catch { return [] } }

  const age = formData.get('age')
  const height = formData.get('height')
  const weight = formData.get('weight')
  const biological_sex = formData.get('biological_sex')
  const bloodGroup = formData.get('bloodGroup')
  const medicalHistory = formData.get('medicalHistory')
  const water_intake = formData.get('water_intake')
  const meal_frequency = formData.get('meal_frequency')
  
  const allergies = jsonParseSafe(formData.get('allergies_tags'))
  const diet_preferences = jsonParseSafe(formData.get('diet_preferences'))
  const food_intolerances = jsonParseSafe(formData.get('food_intolerances'))
  const cycle_symptoms = jsonParseSafe(formData.get('cycle_symptoms'))
  const medications_list = jsonParseSafe(formData.get('medications_list'))
  
  const last_period_start = formData.get('last_period_start')?.toString() || null
  const cycle_length = formData.get('cycle_length')
  const period_duration = formData.get('period_duration')
  const is_pregnant = formData.get('is_pregnant') === 'true'

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      age: age ? parseInt(age.toString()) : null,
      height: height?.toString() || null,
      weight: weight?.toString() || null,
      biological_sex: biological_sex?.toString() || null,
      blood_group: bloodGroup?.toString() || null,
      allergies: allergies.join(', '), // fall back to string for old column compatibility
      medical_history: medicalHistory?.toString() || null,
      water_intake: water_intake?.toString() || null,
      meal_frequency: meal_frequency?.toString() || null,
      diet_preferences,
      food_intolerances,
      cycle_symptoms,
      medications_list,
      last_period_start,
      cycle_length: cycle_length ? parseInt(cycle_length.toString()) : null,
      period_duration: period_duration ? parseInt(period_duration.toString()) : null,
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
