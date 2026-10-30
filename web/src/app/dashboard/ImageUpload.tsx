'use client'

import { useState, useRef } from 'react'
import { Upload, X, CheckCircle2 } from 'lucide-react'

interface ImageUploadProps {
  onFileSelected?: (hasFile: boolean) => void
}

export function ImageUpload({ onFileSelected }: ImageUploadProps = {}) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      onFileSelected?.(true)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && fileInputRef.current) {
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      fileInputRef.current.files = dataTransfer.files
      handleFileChange({ target: fileInputRef.current } as React.ChangeEvent<HTMLInputElement>)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const clearFile = () => {
    setFileName(null)
    setPreview(null)
    onFileSelected?.(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`mt-2 flex justify-center px-4 py-6 border-2 border-dashed rounded-lg transition-colors group relative text-center ${
        isDragging
          ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30'
          : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/60 dark:hover:bg-slate-750'
      }`}
    >
      {/* Single persistent file input that is always submitted with FormData */}
      <input
        ref={fileInputRef}
        id="image"
        name="image"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
      />

      <div className="space-y-2 flex flex-col items-center justify-center w-full">
        {preview ? (
          <div className="relative flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={preview} 
              alt="Preview" 
              className="h-36 max-w-[220px] object-cover rounded-md shadow-xs mb-3 border border-slate-200 dark:border-slate-800" 
            />
            <button 
              type="button" 
              onClick={clearFile} 
              aria-label="Remove image"
              className="absolute -top-3 -right-3 h-7 w-7 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-md shadow-xs flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-600/20">
              <CheckCircle2 className="w-4 h-4" />
              <span>{fileName} attached</span>
            </span>
          </div>
        ) : (
          <>
            <Upload className="mx-auto h-8 w-8 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1" />
            <div>
              <label 
                htmlFor="image" 
                className="cursor-pointer h-9 px-3.5 rounded-md text-sm font-medium bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 shadow-xs inline-flex items-center gap-2 transition-colors focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-600"
              >
                <span>Select clinical photo</span>
              </label>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">PNG, JPG, or WEBP up to 5MB</p>
          </>
        )}
      </div>
    </div>
  )
}
