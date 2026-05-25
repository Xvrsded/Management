// Payment Gateway Abstraction Layer Interfaces
// Ready to be extended to Midtrans, Xendit, or Tripay SDKs in the future.

export interface CreateTransactionParams {
  paymentId: string
  profileId: string
  amount: number
  paymentMethod: string // 'manual_transfer' | 'qris' | 'gopay' | 'va_bank'
  email?: string
  fullName?: string
}

export interface TransactionResponse {
  success: boolean
  transactionCode: string
  paymentStatus: 'pending' | 'waiting_verification' | 'verified' | 'rejected' | 'expired'
  amount: number
  paymentMethod: string
  qrCodeUrl?: string // Dummy QRIS display
  bankTransferDetails?: {
    bankName: string
    accountNumber: string
    accountHolder: string
  }
  proofUrl?: string
  error?: string
}

export interface VerifyPaymentResponse {
  success: boolean
  transactionCode: string
  paymentStatus: 'pending' | 'waiting_verification' | 'verified' | 'rejected' | 'expired'
  paidAt?: string
}

export interface PaymentGateway {
  createTransaction(params: CreateTransactionParams): Promise<TransactionResponse>
  verifyPayment(transactionCode: string): Promise<VerifyPaymentResponse>
  paymentCallback(payload: any): Promise<{ success: boolean; transactionCode: string }>
}
