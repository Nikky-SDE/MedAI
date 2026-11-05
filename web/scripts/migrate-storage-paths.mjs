#!/usr/bin/env node
/**
 * migrate-storage-paths.mjs
 * 
 * Safely migrates legacy flat symptom photos into user-isolated directories (<user_id>/<file>).
 * Defaults to DRY-RUN mode. Run with --execute to perform changes.
 * 
 * Usage:
 *   node scripts/migrate-storage-paths.mjs [--dry-run]
 *   node scripts/migrate-storage-paths.mjs --execute
 * 
 * Requirements:
 *   NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your environment
 *   (or passed when executing the script).
 */

import { createClient } from '@supabase/supabase-js'

const isExecute = process.argv.includes('--execute')
const isDryRun = !isExecute

console.log('==================================================================')
console.log(` MedAI Storage Path Migration (${isDryRun ? 'DRY-RUN MODE' : '*** LIVE EXECUTION ***'})`)
console.log('==================================================================\n')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.log('Note: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL is not set in environment.')
  console.log('This script can generate the equivalent SQL migration for manual execution in the Supabase Dashboard.\n')
}

console.log('Legacy format:  <user_id>-<timestamp>.<ext>')
console.log('Hardened format: <user_id>/<timestamp>.<ext>\n')

console.log('--- PLANNED SQL MIGRATION FOR STORED PATHS (Idempotent) ---')
console.log(`
-- 1. Update full public URLs in public.reports that reference legacy unpartitioned symptom photos:
UPDATE public.reports
SET image_url = regexp_replace(
  image_url,
  '/symptoms/([0-9a-fA-F-]{36})-([0-9]+)\.([a-zA-Z0-9]+)$',
  '/symptoms/\\1/\\2.\\3'
)
WHERE image_url ~ '/symptoms/([0-9a-fA-F-]{36})-([0-9]+)\.([a-zA-Z0-9]+)$';

-- 2. Update relative paths (if any exist):
UPDATE public.reports
SET image_url = regexp_replace(
  image_url,
  '^([0-9a-fA-F-]{36})-([0-9]+)\.([a-zA-Z0-9]+)$',
  '\\1/\\2.\\3'
)
WHERE image_url ~ '^([0-9a-fA-F-]{36})-([0-9]+)\.([a-zA-Z0-9]+)$';
`)

console.log('--- ROLLBACK SQL PLAN ---')
console.log(`
-- Rollback 1: Re-enable public bucket access if needed during emergency rollback:
UPDATE storage.buckets SET public = true WHERE id = 'symptoms';

-- Rollback 2: Revert reports table image_url paths from folder to hyphen format:
UPDATE public.reports
SET image_url = regexp_replace(
  image_url,
  '/symptoms/([0-9a-fA-F-]{36})/([0-9]+)\.([a-zA-Z0-9]+)$',
  '/symptoms/\\1-\\2.\\3'
)
WHERE image_url ~ '/symptoms/([0-9a-fA-F-]{36})/([0-9]+)\.([a-zA-Z0-9]+)$';
`)

if (supabaseUrl && serviceRoleKey) {
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  async function runMigration() {
    console.log('Fetching files from storage bucket "symptoms"...')
    const { data: objects, error } = await supabase.storage.from('symptoms').list('', { limit: 1000 })

    if (error) {
      console.error('Error reading storage bucket:', error.message)
      process.exit(1)
    }

    const legacyFiles = (objects || []).filter(o => /^[0-9a-fA-F-]{36}-\d+\.\w+$/.test(o.name))
    console.log(`Found ${legacyFiles.length} legacy unpartitioned file(s).\n`)

    for (const file of legacyFiles) {
      const match = file.name.match(/^([0-9a-fA-F-]{36})-(\d+\.\w+)$/)
      if (!match) continue
      const [, userId, rest] = match
      const targetPath = `${userId}/${rest}`

      console.log(`Plan: ${file.name} -> ${targetPath}`)

      if (isExecute) {
        const { error: moveError } = await supabase.storage.from('symptoms').move(file.name, targetPath)
        if (moveError) {
          console.error(`  [FAILED] ${file.name}: ${moveError.message}`)
        } else {
          console.log(`  [SUCCESS] Moved to ${targetPath}`)
        }
      }
    }

    if (isDryRun) {
      console.log('\nDRY-RUN completed. No files or database records were modified.')
      console.log('To perform the live move, re-run with --execute.')
    } else {
      console.log('\nLive migration completed successfully.')
    }
  }

  runMigration().catch(err => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
} else {
  console.log('DRY-RUN simulation finished. Use the SQL statements above in the Supabase Dashboard SQL editor.')
}
