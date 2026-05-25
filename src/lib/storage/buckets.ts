export const STORAGE_BUCKETS = {
  PAYMENT_PROOFS: 'payment-proofs',
  LETTER_DOCUMENTS: 'letter-documents',
  REPORT_IMAGES: 'report-images',
} as const

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS]
