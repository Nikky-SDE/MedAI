'use client'

import { useState } from 'react'
import { Upload, X, CheckCircle2 } from 'lucide-react'

export function ImageUpload() {
  const [fileName, setFileName] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const clearFile = () => {
    setFileName(null)
    setPreview(null)
    const input = document.getElementById('image') as HTMLInputElement
    if (input) input.value = ''
  }

  return (
    <div className="mt-1 flex justify-center px-6 pt-10 pb-12 border-2 text-center border-slate-300 border-dashed rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors group relative min-h-[200px]">
      <div className="space-y-2 flex flex-col items-center justify-center w-full">
        {preview ? (
          <div className="relative flex flex-col items-center">
            <img 
              src={preview} 
              alt="Preview" 
              className="h-40 max-w-[250px] object-cover rounded-xl shadow-md mb-4 border border-slate-200" 
            />
            <button 
              type="button" 
              onClick={clearFile} 
              className="absolute -top-4 -right-4 bg-white border border-red-200 hover:bg-red-50 text-red-500 p-2 rounded-full shadow-lg transition transform hover:scale-105"
            >
              <X className="w-5 h-5" />
            </button>
            <p className="text-sm font-semibold text-green-600 flex items-center justify-center bg-green-50 px-3 py-1 rounded-full">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {fileName} attached successfully!
            </p>
            {/* The hidden input is needed to submit the file with the form data */}
            <input id="image" name="image" type="file" className="sr-only" onChange={handleFileChange} />
          </div>
        ) : (
          <>
            <Upload className="mx-auto h-16 w-16 text-slate-400 group-hover:text-blue-500 transition-colors mb-3" />
            <div className="text-sm text-slate-600">
              <label 
                htmlFor="image" 
                className="relative cursor-pointer bg-blue-50 px-4 py-2 rounded-lg font-medium text-blue-700 hover:bg-blue-100 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 transition-colors shadow-sm inline-block"
              >
                <span>Select a photo from device</span>
                <input id="image" name="image" type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
              </label>
            </div>
            <p className="text-xs text-slate-500 mt-4 font-medium uppercase tracking-wider">PNG, JPG, GIF up to 5MB</p>
          </>
        )}
      </div>
    </div>
  )
}
