const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
]

const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export function validateUpload(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Format file tidak didukung (Gunakan JPG, PNG, WEBP, atau PDF)'
  }

  if (file.size > MAX_SIZE) {
    return 'Ukuran file maksimal 5MB'
  }

  return null
}
