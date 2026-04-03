'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function saveProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const age = formData.get('age')
  const bloodGroup = formData.get('bloodGroup')
  const allergies = formData.get('allergies')
  const medicalHistory = formData.get('medicalHistory')

  const { error } = await supabase
    .from('profiles')
    .update({
      age: age ? parseInt(age.toString()) : null,
      blood_group: bloodGroup,
      allergies: allergies,
      medical_history: medicalHistory,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    redirect('/profile?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  redirect('/profile?success=Health+profile+updated+successfully')
}
