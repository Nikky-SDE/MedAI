'use client'

import { useState, useMemo, useEffect } from 'react'
import { User, Droplet, AlertCircle, FileText, Activity, Apple, CalendarHeart, Plus, X } from 'lucide-react'
import { saveProfile } from './actions'

interface ProfileRecord {
  age?: number | string | null
  height?: string | null
  weight?: string | null
  biological_sex?: string | null
  blood_group?: string | null
  medical_history?: string | null
  medications_list?: { name: string; dosage: string }[] | null
  allergies?: string | string[] | null
  diet_preferences?: string[] | null
  food_intolerances?: string[] | null
  cycle_symptoms?: string[] | null
  water_intake?: string | null
  meal_frequency?: string | null
  last_period_start?: string | null
  cycle_length?: number | null
  period_duration?: number | null
  is_pregnant?: boolean | null
}

interface ProfileFormClientProps {
  initialProfile: ProfileRecord | null
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
  const useTagState = (initialStr: string | string[] | null | undefined) => {
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

  // Track client-side timestamp in state to guarantee pure render and avoid hydration mismatch
  const [currentTimestamp, setCurrentTimestamp] = useState<number | null>(null)

  useEffect(() => {
    queueMicrotask(() => {
      setCurrentTimestamp(Date.now())
    })
  }, [])

  // Phase Computer (consistent with backend triage)
  const cyclePhase = useMemo(() => {
    if (!lastPeriodStart || biologicalSex !== 'Female' || !currentTimestamp) return null
    const startTime = new Date(lastPeriodStart).getTime()
    if (isNaN(startTime)) return null
    const daysSince = Math.floor((currentTimestamp - startTime) / (1000 * 3600 * 24))
    if (daysSince < 0) return null
    const cycleLen = cycleLength || 28
    const currentDayOfCycle = (daysSince % cycleLen) + 1
    
    if (currentDayOfCycle <= (periodDuration || 5)) return 'Menstrual'
    if (currentDayOfCycle < 13) return 'Follicular'
    if (currentDayOfCycle < 17) return 'Ovulatory'
    return 'Luteal'
  }, [lastPeriodStart, cycleLength, periodDuration, biologicalSex, currentTimestamp])

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
      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Profile Completion</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Detailed baseline metrics improve clinical AI assessment accuracy</p>
          </div>
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300 ease-out" style={{ width: `${completionPercentage}%` }} />
        </div>
      </div>

      {/* --- Basic Body Metrics --- */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Basic Demographics</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Age</label>
            <input name="age" type="number" value={age} onChange={e => setAge(e.target.value)}
              className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-slate-900 dark:text-slate-100 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-600" placeholder="Years" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Biological Sex</label>
            <select name="biological_sex" value={biologicalSex} onChange={e => setBiologicalSex(e.target.value)}
              className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-slate-900 dark:text-slate-100 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-600 appearance-none">
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Height</label>
            <div className="relative flex items-center">
              <input
                name="height"
                type="text"
                value={height}
                onChange={e => setHeight(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-3 pr-9 text-slate-900 dark:text-slate-100 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                placeholder="175"
              />
              <span className="absolute right-3 text-xs font-medium text-slate-400 dark:text-slate-500 pointer-events-none select-none">
                cm
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Weight</label>
            <div className="relative flex items-center">
              <input
                name="weight"
                type="text"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-3 pr-9 text-slate-900 dark:text-slate-100 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                placeholder="70"
              />
              <span className="absolute right-3 text-xs font-medium text-slate-400 dark:text-slate-500 pointer-events-none select-none">
                kg
              </span>
            </div>
          </div>
        </div>

        {/* Blood Group Chips */}
        <div className="space-y-2 pt-1">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Droplet className="w-3.5 h-3.5 text-red-500" />
            <span>Blood Group</span>
          </label>
          <input type="hidden" name="bloodGroup" value={bloodGroup} />
          <div className="flex flex-wrap gap-1.5">
            {bloodGroupsList.map(bg => (
              <button key={bg} type="button" onClick={() => setBloodGroup(bg)}
                className={`h-8 px-3 rounded-md text-xs font-medium border transition-colors ${bloodGroup === bg ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                {bg}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- Clinical --- */}
      <div className="space-y-5 pt-8 border-t-2 border-slate-100 dark:border-slate-800/80">
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Clinical Baseline</span>
        </h3>
        
        {/* Allergies Tags */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Known Allergies</span>
          </label>
          <div className="flex rounded-md shadow-xs">
            <input
              type="text"
              value={allergies.input}
              onChange={e => allergies.setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), allergies.addTag())}
              className="flex-1 h-9 rounded-l-md rounded-r-none border border-r-0 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:z-10"
              placeholder="Type allergy & press Enter..."
            />
            <button
              type="button"
              onClick={allergies.addTag}
              className="inline-flex items-center justify-center gap-1 h-9 px-3.5 rounded-r-md rounded-l-none border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-600 focus:z-10 flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
          {allergies.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {allergies.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 text-blue-700 dark:text-blue-300"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => allergies.removeTag(tag)}
                    className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-200 focus:outline-none"
                    aria-label={`Remove ${tag}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Medications */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Current Medications & Dosages</label>
          <div className="space-y-2">
            {medications.map((med, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input type="text" value={med.name} onChange={e => updateMedication(idx, 'name', e.target.value)} placeholder="Medicine name (e.g. Lisinopril)" 
                  className="flex-[2] h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-slate-900 dark:text-slate-100 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-600" />
                <input type="text" value={med.dosage} onChange={e => updateMedication(idx, 'dosage', e.target.value)} placeholder="Dosage (e.g. 10mg daily)" 
                  className="flex-[1] h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-slate-900 dark:text-slate-100 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-600" />
                <button type="button" onClick={() => removeMedication(idx)} aria-label={`Remove ${med.name || 'medication'}`} className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors flex-shrink-0"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addMedication} className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline pt-0.5"><Plus className="w-3.5 h-3.5"/> Add Medication</button>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Chronic Medical History</span>
          </label>
          <textarea name="medicalHistory" rows={3} value={medicalHistory} onChange={e => setMedicalHistory(e.target.value)}
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-slate-900 dark:text-slate-100 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none" placeholder="e.g. Type 2 Diabetes, Asthma, Hypertension..."></textarea>
        </div>
      </div>

      {/* --- Dietary Preferences --- */}
      <div className="space-y-5 pt-8 border-t-2 border-slate-100 dark:border-slate-800/80">
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Apple className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Nutrition & Lifestyle</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Dietary Preferences</label>
            <div className="flex rounded-md shadow-xs">
              <input
                type="text"
                value={dietPrefs.input}
                onChange={e => dietPrefs.setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), dietPrefs.addTag())}
                className="flex-1 h-9 rounded-l-md rounded-r-none border border-r-0 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:z-10"
                placeholder="Vegan, Low Sodium..."
              />
              <button
                type="button"
                onClick={dietPrefs.addTag}
                className="inline-flex items-center justify-center gap-1 h-9 px-3.5 rounded-r-md rounded-l-none border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-600 focus:z-10 flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
            {dietPrefs.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {dietPrefs.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 text-blue-700 dark:text-blue-300"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => dietPrefs.removeTag(tag)}
                      className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-200 focus:outline-none"
                      aria-label={`Remove ${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Food Intolerances</label>
            <div className="flex rounded-md shadow-xs">
              <input
                type="text"
                value={intolerances.input}
                onChange={e => intolerances.setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), intolerances.addTag())}
                className="flex-1 h-9 rounded-l-md rounded-r-none border border-r-0 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:z-10"
                placeholder="Lactose, Gluten..."
              />
              <button
                type="button"
                onClick={intolerances.addTag}
                className="inline-flex items-center justify-center gap-1 h-9 px-3.5 rounded-r-md rounded-l-none border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-600 focus:z-10 flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
            {intolerances.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {intolerances.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 text-blue-700 dark:text-blue-300"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => intolerances.removeTag(tag)}
                      className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-200 focus:outline-none"
                      aria-label={`Remove ${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Daily Water</label>
            <select name="water_intake" value={waterIntake} onChange={e => setWaterIntake(e.target.value)} className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-slate-900 dark:text-slate-100 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-600 appearance-none">
              <option value="">Select...</option><option value="Low">Low (&lt; 1L)</option><option value="Moderate">Moderate (1-2L)</option><option value="High">High (2L+)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Meal Frequency</label>
            <select name="meal_frequency" value={mealFrequency} onChange={e => setMealFrequency(e.target.value)} className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-slate-900 dark:text-slate-100 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-600 appearance-none">
               <option value="">Select...</option><option value="1-2 meals">1-2 meals</option><option value="3 meals">3 meals</option><option value="4+ small meals">4+ small meals</option>
            </select>
          </div>
        </div>
      </div>

      {/* --- Menstrual Tracker (Conditional) --- */}
      {biologicalSex === 'Female' && (
        <div className="space-y-4 pt-6 border-t-2 border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 p-5 rounded-lg border border-slate-200/80 dark:border-slate-800">
          <div className="flex justify-between items-center">
             <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
               <CalendarHeart className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
               <span>Cycle Tracker</span>
             </h3>
             {cyclePhase && (
               <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-700/10">
                 Phase: {cyclePhase}
               </span>
             )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Last Period Start</label>
              <input name="last_period_start" type="date" value={lastPeriodStart} onChange={e => setLastPeriodStart(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-slate-900 dark:text-slate-100 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-600" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex justify-between">Cycle Length <span>{cycleLength} days</span></label>
              <input type="range" name="cycle_length" min="21" max="35" value={cycleLength} onChange={e => setCycleLength(Number(e.target.value))}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer mt-3" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex justify-between">Duration <span>{periodDuration} days</span></label>
              <input type="range" name="period_duration" min="2" max="8" value={periodDuration} onChange={e => setPeriodDuration(Number(e.target.value))}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer mt-3" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Cycle Symptoms (Tags)</label>
            <div className="flex rounded-md shadow-xs">
              <input
                type="text"
                value={cycleSymptoms.input}
                onChange={e => cycleSymptoms.setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), cycleSymptoms.addTag())}
                className="flex-1 h-9 rounded-l-md rounded-r-none border border-r-0 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:z-10"
                placeholder="Cramps, fatigue, bloating..."
              />
              <button
                type="button"
                onClick={cycleSymptoms.addTag}
                className="inline-flex items-center justify-center gap-1 h-9 px-3.5 rounded-r-md rounded-l-none border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-600 focus:z-10 flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
            {cycleSymptoms.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {cycleSymptoms.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 text-blue-700 dark:text-blue-300"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => cycleSymptoms.removeTag(tag)}
                      className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-200 focus:outline-none"
                      aria-label={`Remove ${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 pt-1">
            <input type="checkbox" id="pregnant" defaultChecked={isPregnant} name="is_pregnant_cb" onChange={e => setIsPregnant(e.target.checked)} className="w-4 h-4 accent-blue-600 rounded border-slate-300" />
            <input type="hidden" name="is_pregnant" value={isPregnant ? 'true' : 'false'} />
            <label htmlFor="pregnant" className="text-xs font-medium text-slate-700 dark:text-slate-300">Currently Pregnant or Trying to Conceive</label>
          </div>
        </div>
      )}

      {/* --- Disclaimer & Submit --- */}
      <div className="pt-8 border-t-2 border-slate-100 dark:border-slate-800/80 space-y-4">
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-3.5 rounded-md flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wider">Emergency Medical Disclaimer</h4>
            <p className="text-xs text-amber-800 dark:text-amber-400/90 mt-0.5 leading-relaxed">
              MedAI is an informational triage aid. All AI insights do not constitute certified diagnosis. 
              If you are experiencing a severe emergency, contact local emergency services immediately.
            </p>
          </div>
        </div>

        <div>
          <button type="submit" className="w-full h-10 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-xs transition-colors flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-blue-600">
            Save Comprehensive Profile
          </button>
        </div>
      </div>
    </form>
  )
}
