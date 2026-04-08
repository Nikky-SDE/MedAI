'use client'

import { useState, useMemo } from 'react'
import { User, Droplet, AlertCircle, FileText, Activity, Apple, CalendarHeart, Plus, X } from 'lucide-react'
import { saveProfile } from './actions'

interface ProfileFormClientProps {
  initialProfile: any
}

export function ProfileFormClient({ initialProfile }: ProfileFormClientProps) {
  // --- Core State ---
  const [age, setAge] = useState(initialProfile?.age || '')
  const [height, setHeight] = useState(initialProfile?.height || '')
  const [weight, setWeight] = useState(initialProfile?.weight || '')
  const [biologicalSex, setBiologicalSex] = useState(initialProfile?.biological_sex || '')
  const [bloodGroup, setBloodGroup] = useState(initialProfile?.blood_group || '')
  const [medicalHistory, setMedicalHistory] = useState(initialProfile?.medical_history || '')
  
  // --- Medications List ---
  const [medications, setMedications] = useState<{name: string, dosage: string}[]>(
    initialProfile?.medications_list || []
  )

  const addMedication = () => setMedications([...medications, { name: '', dosage: '' }])
  const updateMedication = (index: number, field: 'name'|'dosage', value: string) => {
    const newMeds = [...medications]
    newMeds[index][field] = value
    setMedications(newMeds)
  }
  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index))
  }

  // --- Tags Engine ---
  const useTagState = (initialStr: string | any[]) => {
    const defaultTags = Array.isArray(initialStr) 
      ? initialStr 
      : (typeof initialStr === 'string' && initialStr ? initialStr.split(',').map(s => s.trim()) : [])
    const [tags, setTags] = useState<string[]>(defaultTags)
    const [input, setInput] = useState('')

    const addTag = () => {
      if (input.trim() && !tags.includes(input.trim())) {
        setTags([...tags, input.trim()])
        setInput('')
      }
    }
    const removeTag = (t: string) => setTags(tags.filter(tag => tag !== t))
    
    return { tags, input, setInput, addTag, removeTag }
  }

  const allergies = useTagState(initialProfile?.allergies || [])
  const dietPrefs = useTagState(initialProfile?.diet_preferences || [])
  const intolerances = useTagState(initialProfile?.food_intolerances || [])
  const cycleSymptoms = useTagState(initialProfile?.cycle_symptoms || [])

  // --- Lifestyle ---
  const [waterIntake, setWaterIntake] = useState(initialProfile?.water_intake || '')
  const [mealFrequency, setMealFrequency] = useState(initialProfile?.meal_frequency || '')

  // --- Cycle Tracker ---
  const [lastPeriodStart, setLastPeriodStart] = useState(initialProfile?.last_period_start || '')
  const [cycleLength, setCycleLength] = useState(initialProfile?.cycle_length || 28)
  const [periodDuration, setPeriodDuration] = useState(initialProfile?.period_duration || 5)
  const [isPregnant, setIsPregnant] = useState(initialProfile?.is_pregnant || false)

  // --- Progress Computation ---
  const completionPercentage = useMemo(() => {
    let filled = 0
    let total = 8 // base fields
    if (age) filled++
    if (height) filled++
    if (weight) filled++
    if (biologicalSex) filled++
    if (bloodGroup) filled++
    if (allergies.tags.length > 0) filled++
    if (medicalHistory) filled++
    if (medications.length > 0 && medications[0].name !== '') filled++

    if (biologicalSex === 'Female') {
      total += 4
      if (lastPeriodStart) filled++
      if (cycleLength) filled++
      if (periodDuration) filled++
      if (cycleSymptoms.tags.length > 0) filled++
    }

    total += 3 // diet block
    if (dietPrefs.tags.length > 0) filled++
    if (waterIntake) filled++
    if (mealFrequency) filled++

    return Math.round((filled / total) * 100)
  }, [age, height, weight, biologicalSex, bloodGroup, allergies.tags, medicalHistory, medications, lastPeriodStart, cycleLength, periodDuration, cycleSymptoms.tags, dietPrefs.tags, waterIntake, mealFrequency])

  // Optional: Phase Computer
  const cyclePhase = useMemo(() => {
    if (!lastPeriodStart || biologicalSex !== 'Female') return null
    const daysSince = Math.floor((new Date().getTime() - new Date(lastPeriodStart).getTime()) / (1000 * 3600 * 24))
    const currentDayOfCycle = daysSince % cycleLength
    
    if (currentDayOfCycle < periodDuration) return 'Menstrual'
    if (currentDayOfCycle < 13) return 'Follicular'
    if (currentDayOfCycle < 17) return 'Ovulatory'
    return 'Luteal'
  }, [lastPeriodStart, cycleLength, periodDuration, biologicalSex])

  const bloodGroupsList = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

  return (
    <form action={saveProfile} className="space-y-10">
      
      {/* Hidden inputs to pass complex states back to server action */}
      <input type="hidden" name="allergies_tags" value={JSON.stringify(allergies.tags)} />
      <input type="hidden" name="diet_preferences" value={JSON.stringify(dietPrefs.tags)} />
      <input type="hidden" name="food_intolerances" value={JSON.stringify(intolerances.tags)} />
      <input type="hidden" name="cycle_symptoms" value={JSON.stringify(cycleSymptoms.tags)} />
      <input type="hidden" name="medications_list" value={JSON.stringify(medications)} />

      {/* --- Completion Bar --- */}
      <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-slate-200 dark:border-white/10 relative overflow-hidden">
        <div className="flex justify-between items-end mb-3 relative z-10">
          <div>
            <h3 className="font-bold text-[var(--text-primary)]">Profile Strength</h3>
            <p className="text-xs text-[var(--text-secondary)]">A fuller profile = significantly better AI insights</p>
          </div>
          <span className="font-black text-2xl" style={{ color: completionPercentage > 80 ? '#22C55E' : '#C8856A' }}>{completionPercentage}%</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 relative z-10">
          <div className="bg-gradient-to-r from-[#C8856A] to-[#1B2A6B] h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${completionPercentage}%` }} />
        </div>
      </div>

      {/* --- Basic Body Metrics --- */}
      <div className="space-y-6">
        <h3 className="text-lg font-black text-[#1B2A6B] dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2">
          <User className="w-5 h-5" /> Basics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-[var(--text-secondary)] tracking-wider">Age</label>
            <input name="age" type="number" value={age} onChange={e => setAge(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-sidebar)] px-4 py-3 text-[var(--text-primary)] text-sm input-focus" placeholder="Years" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-[var(--text-secondary)] tracking-wider">Biological Sex</label>
            <select name="biological_sex" value={biologicalSex} onChange={e => setBiologicalSex(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-sidebar)] px-4 py-3 text-[var(--text-primary)] text-sm input-focus appearance-none">
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-[var(--text-secondary)] tracking-wider">Height (cm/in)</label>
            <input name="height" type="text" value={height} onChange={e => setHeight(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-sidebar)] px-4 py-3 text-[var(--text-primary)] text-sm input-focus" placeholder="e.g. 175cm" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-[var(--text-secondary)] tracking-wider">Weight (kg/lb)</label>
            <input name="weight" type="text" value={weight} onChange={e => setWeight(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-sidebar)] px-4 py-3 text-[var(--text-primary)] text-sm input-focus" placeholder="e.g. 70kg" />
          </div>
        </div>

        {/* Blood Group Pills */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-bold uppercase text-[var(--text-secondary)] tracking-wider flex items-center gap-1"><Droplet className="w-3.5 h-3.5 text-red-500" /> Blood Group</label>
          <input type="hidden" name="bloodGroup" value={bloodGroup} />
          <div className="flex flex-wrap gap-2">
            {bloodGroupsList.map(bg => (
              <button key={bg} type="button" onClick={() => setBloodGroup(bg)}
                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${bloodGroup === bg ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-500/20' : 'bg-transparent text-[var(--text-secondary)] border-[var(--border)] hover:border-red-300'}`}>
                {bg}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- Clinical --- */}
      <div className="space-y-6 pt-6 border-t border-[var(--border)]">
        <h3 className="text-lg font-black text-[#1B2A6B] dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2">
          <Activity className="w-5 h-5" /> Clinical Profile
        </h3>
        
        {/* Allergies Tags */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase text-[var(--text-secondary)] tracking-wider flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 text-amber-500"/> Known Allergies</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {allergies.tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded-full text-xs font-bold flex items-center gap-1 border border-amber-200 dark:border-amber-700/50">
                {tag} <X className="w-3 h-3 cursor-pointer hover:text-amber-900" onClick={() => allergies.removeTag(tag)} />
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" value={allergies.input} onChange={e => allergies.setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), allergies.addTag())}
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-sidebar)] px-4 py-2.5 text-[var(--text-primary)] text-sm input-focus" placeholder="Type allergy & press Enter..." />
            <button type="button" onClick={allergies.addTag} className="px-4 py-2 bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-xl text-sm font-medium hover:border-[#C8856A]">Add</button>
          </div>
        </div>

        {/* Medications */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase text-[var(--text-secondary)] tracking-wider">Current Medications & Dosages</label>
          <div className="space-y-2">
            {medications.map((med, idx) => (
              <div key={idx} className="flex gap-2 relative group">
                <input type="text" value={med.name} onChange={e => updateMedication(idx, 'name', e.target.value)} placeholder="Medicine name (e.g. Lisinopril)" 
                  className="flex-[2] rounded-xl border border-[var(--border)] bg-[var(--bg-sidebar)] px-4 py-2.5 text-[var(--text-primary)] text-sm input-focus" />
                <input type="text" value={med.dosage} onChange={e => updateMedication(idx, 'dosage', e.target.value)} placeholder="Dosage (e.g. 10mg / daily)" 
                  className="flex-[1] rounded-xl border border-[var(--border)] bg-[var(--bg-sidebar)] px-4 py-2.5 text-[var(--text-primary)] text-sm input-focus" />
                <button type="button" onClick={() => removeMedication(idx)} className="p-2.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addMedication} className="text-xs font-bold text-[#C8856A] flex items-center gap-1 hover:underline"><Plus className="w-3.5 h-3.5"/> Add Medication</button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-[var(--text-secondary)] tracking-wider flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Chronic Medical History</label>
          <textarea name="medicalHistory" rows={3} value={medicalHistory} onChange={e => setMedicalHistory(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-sidebar)] p-4 text-[var(--text-primary)] text-sm input-focus resize-none" placeholder="e.g. Type 2 Diabetes, Asthma..."></textarea>
        </div>
      </div>

      {/* --- Dietary Preferences --- */}
      <div className="space-y-6 pt-6 border-t border-[var(--border)]">
        <h3 className="text-lg font-black text-[#1B2A6B] dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2">
          <Apple className="w-5 h-5" /> Diet & Nutrition
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
             <label className="text-xs font-bold uppercase text-[var(--text-secondary)] tracking-wider">Dietary Preferences</label>
             <div className="flex gap-2">
               <input type="text" value={dietPrefs.input} onChange={e => dietPrefs.setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), dietPrefs.addTag())}
                 className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-sidebar)] px-4 py-2 text-[var(--text-primary)] text-sm input-focus" placeholder="Vegan, Keto..." />
               <button type="button" onClick={dietPrefs.addTag} className="px-3 py-2 bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-xl text-sm font-medium"><Plus className="w-4 h-4"/></button>
             </div>
             <div className="flex flex-wrap gap-1.5 mt-2">
               {dietPrefs.tags.map(tag => (
                 <span key={tag} className="px-2.5 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-lg text-[11px] font-bold flex items-center gap-1">{tag} <X className="w-3 h-3 cursor-pointer" onClick={() => dietPrefs.removeTag(tag)} /></span>
               ))}
             </div>
          </div>
          
          <div className="space-y-3">
             <label className="text-xs font-bold uppercase text-[var(--text-secondary)] tracking-wider">Food Intolerances</label>
             <div className="flex gap-2">
               <input type="text" value={intolerances.input} onChange={e => intolerances.setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), intolerances.addTag())}
                 className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-sidebar)] px-4 py-2 text-[var(--text-primary)] text-sm input-focus" placeholder="Lactose, Gluten..." />
               <button type="button" onClick={intolerances.addTag} className="px-3 py-2 bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-xl text-sm font-medium"><Plus className="w-4 h-4"/></button>
             </div>
             <div className="flex flex-wrap gap-1.5 mt-2">
               {intolerances.tags.map(tag => (
                 <span key={tag} className="px-2.5 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 rounded-lg text-[11px] font-bold flex items-center gap-1">{tag} <X className="w-3 h-3 cursor-pointer" onClick={() => intolerances.removeTag(tag)} /></span>
               ))}
             </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-[var(--text-secondary)] tracking-wider">Daily Water</label>
            <select name="water_intake" value={waterIntake} onChange={e => setWaterIntake(e.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-sidebar)] px-4 py-3 text-[var(--text-primary)] text-sm input-focus appearance-none">
              <option value="">Select...</option><option value="Low">Low (&lt; 1L)</option><option value="Moderate">Moderate (1-2L)</option><option value="High">High (2L+)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-[var(--text-secondary)] tracking-wider">Meal Freq</label>
            <select name="meal_frequency" value={mealFrequency} onChange={e => setMealFrequency(e.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-sidebar)] px-4 py-3 text-[var(--text-primary)] text-sm input-focus appearance-none">
               <option value="">Select...</option><option value="1-2 meals">1-2 meals</option><option value="3 meals">3 meals</option><option value="4+ small meals">4+ small meals</option>
            </select>
          </div>
        </div>
      </div>

      {/* --- Menstrual Tracker (Conditional) --- */}
      {biologicalSex === 'Female' && (
        <div className="space-y-6 pt-6 border-t border-[var(--border)] bg-pink-50/30 dark:bg-pink-950/10 p-6 -mx-6 sm:rounded-3xl border-x-0 sm:border-x">
          <div className="flex justify-between items-center">
             <h3 className="text-lg font-black text-pink-600 dark:text-pink-400 uppercase tracking-widest flex items-center gap-2">
               <CalendarHeart className="w-5 h-5" /> Cycle Tracker
             </h3>
             {cyclePhase && (
               <span className="px-3 py-1 bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300 rounded-full text-xs font-bold shadow-sm">
                 Phase: {cyclePhase}
               </span>
             )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-[var(--text-secondary)] tracking-wider">Last Period Start</label>
              <input name="last_period_start" type="date" value={lastPeriodStart} onChange={e => setLastPeriodStart(e.target.value)}
                className="w-full rounded-xl border border-pink-200 dark:border-pink-900/30 bg-white dark:bg-white/5 px-4 py-3 text-[var(--text-primary)] text-sm input-focus" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-[var(--text-secondary)] tracking-wider flex justify-between">Cycle Length <span>{cycleLength} days</span></label>
              <input type="range" name="cycle_length" min="21" max="35" value={cycleLength} onChange={e => setCycleLength(Number(e.target.value))}
                className="w-full accent-pink-500 h-2 bg-pink-200 rounded-lg appearance-none cursor-pointer mt-2" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-[var(--text-secondary)] tracking-wider flex justify-between">Duration <span>{periodDuration} days</span></label>
              <input type="range" name="period_duration" min="2" max="8" value={periodDuration} onChange={e => setPeriodDuration(Number(e.target.value))}
                className="w-full accent-pink-500 h-2 bg-pink-200 rounded-lg appearance-none cursor-pointer mt-2" />
            </div>
          </div>

          <div className="space-y-3">
             <label className="text-xs font-bold uppercase text-[var(--text-secondary)] tracking-wider">Cycle Symptoms (Tags)</label>
             <div className="flex gap-2">
               <input type="text" value={cycleSymptoms.input} onChange={e => cycleSymptoms.setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), cycleSymptoms.addTag())}
                 className="flex-1 rounded-xl border border-pink-200 dark:border-pink-900/30 bg-white dark:bg-white/5 px-4 py-2 text-[var(--text-primary)] text-sm input-focus" placeholder="Cramps, fatigue, bloating..." />
               <button type="button" onClick={cycleSymptoms.addTag} className="px-3 py-2 bg-white dark:bg-white/5 border border-pink-200 dark:border-pink-900/30 rounded-xl text-sm font-medium"><Plus className="w-4 h-4"/></button>
             </div>
             <div className="flex flex-wrap gap-1.5 mt-2">
               {cycleSymptoms.tags.map(tag => (
                 <span key={tag} className="px-2.5 py-1 bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 rounded-lg text-[11px] font-bold flex items-center gap-1">{tag} <X className="w-3 h-3 cursor-pointer" onClick={() => cycleSymptoms.removeTag(tag)} /></span>
               ))}
             </div>
          </div>
          
          <div className="flex items-center gap-3 pt-2">
            <input type="checkbox" id="pregnant" defaultChecked={isPregnant} name="is_pregnant_cb" onChange={e => setIsPregnant(e.target.checked)} className="w-5 h-5 accent-pink-500 rounded border-gray-300" />
            <input type="hidden" name="is_pregnant" value={isPregnant ? 'true' : 'false'} />
            <label htmlFor="pregnant" className="text-sm font-semibold text-[var(--text-primary)]">Currently Pregnant or Trying to Conceive</label>
          </div>
        </div>
      )}


      {/* --- Disclaimer --- */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 p-4 rounded-r-xl flex items-start gap-3 mt-8">
        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400">Emergency Medical Disclaimer</h4>
          <p className="text-xs text-amber-700 dark:text-amber-500 mt-1 leading-relaxed">
            MedAI is an educational tool. All AI insights are for informational purposes only and do not constitute professional diagnosis. 
            If you are experiencing a severe medical emergency, call <strong className="font-black">108</strong> immediately.
          </p>
        </div>
      </div>

      <div className="pt-6 border-t border-[var(--border)]">
        <button type="submit" className="w-full btn-gradient py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
          Save Comprehensive Profile
        </button>
      </div>
    </form>
  )
}
