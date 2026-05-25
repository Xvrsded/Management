export type LetterType = 
  | 'surat_pengantar'
  | 'surat_keterangan_domisili'
  | 'surat_keterangan_tidak_mampu'
  | 'surat_keterangan_usaha'

export type LetterStatus = 
  | 'pending_rt'
  | 'approved_rt'
  | 'approved_rw'
  | 'finished'
  | 'rejected'

export interface CitizenProfile {
  id: string
  nik: string
  kk: string
  phone?: string
  address: string
  rt: string
  rw: string
  gender?: 'L' | 'P'
  place_of_birth?: string
  date_of_birth?: string
  religion?: string
  occupation?: string
  marital_status?: string
  nationality?: string
  updated_at?: string
}

export interface LetterApproval {
  id: string
  letter_request_id: string
  role: 'rt' | 'rw'
  approver_id: string
  status: 'approved' | 'rejected'
  note?: string
  created_at: string
  profiles?: {
    full_name: string
    email: string
    role: string
  }
}

export interface LetterRequest {
  id: string
  profile_id: string
  letter_type: LetterType
  purpose: string
  custom_fields: Record<string, any>
  status: LetterStatus
  support_document_url?: string
  letter_number?: string
  request_code?: string
  rejection_reason?: string
  approved_by?: string
  approved_at?: string
  submitted_at?: string
  processed_at?: string
  pdf_url?: string
  qr_token?: string
  category_id?: string
  created_at: string
  updated_at: string
  profiles?: {
    full_name: string
    email: string
    role: string
  }
  letter_approvals?: LetterApproval[]
}
