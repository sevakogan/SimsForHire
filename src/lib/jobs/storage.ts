import { createClient } from '@supabase/supabase-js'

const JOB_IMAGES_BUCKET = 'job-images'
const APPLICATION_FILES_BUCKET = 'application-files'
const SIGNED_URL_EXPIRY_SECONDS = 3600

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Upload a job image to the public job-images bucket.
 * Returns the public URL of the uploaded image.
 */
export async function uploadJobImage(
  jobId: string,
  file: File
): Promise<string> {
  const client = getServiceClient()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${jobId}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await client.storage
    .from(JOB_IMAGES_BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (error) throw new Error(`Upload failed: ${error.message}`)

  const { data: { publicUrl } } = client.storage
    .from(JOB_IMAGES_BUCKET)
    .getPublicUrl(path)

  return publicUrl
}

/**
 * Upload an application file (resume or image) to the private bucket.
 * Returns the storage path (not a URL — use getSignedUrl to generate access).
 */
export async function uploadApplicationFile(
  applicationId: string,
  file: File,
  subfolder: 'resume' | 'images'
): Promise<string> {
  const client = getServiceClient()
  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `${applicationId}/${subfolder}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await client.storage
    .from(APPLICATION_FILES_BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (error) throw new Error(`Upload failed: ${error.message}`)

  return path
}

/**
 * Generate a signed URL for a private application file (1 hour expiry).
 */
export async function getSignedUrl(path: string): Promise<string> {
  const client = getServiceClient()

  const { data, error } = await client.storage
    .from(APPLICATION_FILES_BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS)

  if (error || !data?.signedUrl) {
    throw new Error(`Signed URL failed: ${error?.message ?? 'Unknown error'}`)
  }

  return data.signedUrl
}

/**
 * Delete a job image from the public bucket.
 * Expects the path segment after the bucket URL (e.g. "jobId/filename.jpg").
 */
export async function deleteJobImage(path: string): Promise<void> {
  const client = getServiceClient()

  const { error } = await client.storage
    .from(JOB_IMAGES_BUCKET)
    .remove([path])

  if (error) throw new Error(`Delete failed: ${error.message}`)
}
