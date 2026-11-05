'use client'

import { useState, useRef } from 'react'
import { Upload, X, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'

interface ImageUploadProps {
  onFileSelected?: (hasFile: boolean) => void
}

/**
 * Client-side canvas downscaler:
 * - Resizes image so maximum dimension <= 1280px (maintaining aspect ratio)
 * - Automatically strips all EXIF metadata (camera serial, GPS coordinates, date stamps)
 * - Re-encodes as optimized JPEG (0.85 quality)
 */
async function downscaleAndStripExif(
  file: File,
  maxDimension = 1280
): Promise<{ file: File; originalSize: number; compressedSize: number }> {
  // If not an image, return untouched
  if (!file.type.startsWith('image/')) {
    return { file, originalSize: file.size, compressedSize: file.size }
  }

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onerror = () => resolve({ file, originalSize: file.size, compressedSize: file.size })
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => resolve({ file, originalSize: file.size, compressedSize: file.size })
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          return resolve({ file, originalSize: file.size, compressedSize: file.size })
        }

        // Drawing into a fresh canvas drops all camera EXIF headers and GPS metadata
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve({ file, originalSize: file.size, compressedSize: file.size })
            }
            const safeName = file.name.replace(/\.[^/.]+$/, '') + '.jpg'
            const downscaled = new File([blob], safeName, { type: 'image/jpeg' })
            resolve({
              file: downscaled,
              originalSize: file.size,
              compressedSize: downscaled.size,
            })
          },
          'image/jpeg',
          0.85
        )
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

export function ImageUpload({ onFileSelected }: ImageUploadProps = {}) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [compressionMetrics, setCompressionMetrics] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processAndSetFile = async (rawFile: File) => {
    setIsProcessing(true)
    try {
      const { file: optimizedFile, originalSize, compressedSize } = await downscaleAndStripExif(rawFile)

      if (fileInputRef.current && typeof DataTransfer !== 'undefined') {
        const dt = new DataTransfer()
        dt.items.add(optimizedFile)
        fileInputRef.current.files = dt.files
      }

      setFileName(optimizedFile.name)
      const origKb = Math.round(originalSize / 1024)
      const compKb = Math.round(compressedSize / 1024)
      const savedPct = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
      
      setCompressionMetrics(
        origKb > compKb
          ? `${compKb} KB (saved ${savedPct}%, EXIF stripped)`
          : `${compKb} KB (EXIF stripped)`
      )

      onFileSelected?.(true)

      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(optimizedFile)
    } catch {
      setFileName(rawFile.name)
      onFileSelected?.(true)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(rawFile)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processAndSetFile(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      processAndSetFile(file)
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
    setCompressionMetrics(null)
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
      {/* Persistent file input that is submitted with FormData */}
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
        {isProcessing ? (
          <div className="flex flex-col items-center py-4 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Optimizing photo & removing EXIF metadata...</p>
          </div>
        ) : preview ? (
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
              className="absolute -top-3 -right-3 h-7 w-7 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-md shadow-xs flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="flex flex-col items-center gap-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-600/20">
                <CheckCircle2 className="w-4 h-4" />
                <span>{fileName}</span>
              </span>
              {compressionMetrics && (
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{compressionMetrics}</span>
                </span>
              )}
            </div>
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
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">PNG, JPG, or WEBP up to 5MB (auto-downscaled & EXIF stripped)</p>
          </>
        )}
      </div>
    </div>
  )
}
