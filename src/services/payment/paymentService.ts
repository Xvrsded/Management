import { createClient } from '@/services/supabase/client'
import { 
  PaymentGateway, 
  CreateTransactionParams, 
  TransactionResponse, 
  VerifyPaymentResponse 
} from './paymentInterface'
import { storageUtils } from '@/lib/storage/storage-utils'
import { STORAGE_BUCKETS } from '@/lib/storage/buckets'

export class DummyPaymentGateway implements PaymentGateway {
  // 1. Create Transaction (manual or QRIS)
  async createTransaction(params: CreateTransactionParams): Promise<TransactionResponse> {
    const supabase = createClient()
    const transactionCode = `TRX-${params.paymentId.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-6)}`
    
    const transactionData = {
      payment_id: params.paymentId,
      profile_id: params.profileId,
      transaction_code: transactionCode,
      amount: params.amount,
      payment_method: params.paymentMethod,
      payment_status: 'pending',
      created_at: new Date().toISOString()
    }

    try {
      const { error } = await supabase
        .from('payment_transactions')
        .insert(transactionData)

      if (error) throw error
    } catch (err) {
      console.warn('Failed to insert transaction into database, using local simulation:', err)
      // Save locally to session storage if database table is not created yet
      const simulatedTrxs = JSON.parse(sessionStorage.getItem('simulated_trxs') || '[]')
      simulatedTrxs.push(transactionData)
      sessionStorage.setItem('simulated_trxs', JSON.stringify(simulatedTrxs))
    }

    // Return structured payment configuration ready for citizen view
    return {
      success: true,
      transactionCode,
      paymentStatus: 'pending',
      amount: params.amount,
      paymentMethod: params.paymentMethod,
      qrCodeUrl: params.paymentMethod === 'qris' 
        ? 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=qris-dummy-pay-rt03' 
        : undefined,
      bankTransferDetails: params.paymentMethod === 'manual_transfer' ? {
        bankName: 'Bank Mandiri',
        accountNumber: '131-00-1428394-0',
        accountHolder: 'KAS RT 03 GUNTUR'
      } : undefined
    }
  }

  // 2. Verify Transaction Status
  async verifyPayment(transactionCode: string): Promise<VerifyPaymentResponse> {
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('payment_status, paid_at')
        .eq('transaction_code', transactionCode)
        .single()

      if (error) throw error
      
      return {
        success: true,
        transactionCode,
        paymentStatus: (data.payment_status || 'pending') as any,
        paidAt: data.paid_at
      }
    } catch (err) {
      // Local simulation check
      const simulatedTrxs = JSON.parse(sessionStorage.getItem('simulated_trxs') || '[]')
      const matched = simulatedTrxs.find((t: any) => t.transaction_code === transactionCode)
      return {
        success: true,
        transactionCode,
        paymentStatus: matched ? matched.payment_status : 'pending'
      }
    }
  }

  // 3. Webhook Callback Mock
  async paymentCallback(payload: any): Promise<{ success: boolean; transactionCode: string }> {
    return {
      success: true,
      transactionCode: payload.transaction_code || ''
    }
  }
}

// Global payment services management (supports transaction uploads, verifications, and approvals)
export const paymentService = {
  getGateway(type: string = 'dummy'): PaymentGateway {
    return new DummyPaymentGateway()
  },

  // A. Upload Transfer Proof & Submit for Verification
  async uploadProof(paymentId: string, transactionCode: string, file: File, userId: string) {
    const supabase = createClient()
    
    try {
      // 1. Upload receipt to storage bucket via storage-utils
      const uploadRes = await storageUtils.uploadFile(
        STORAGE_BUCKETS.PAYMENT_PROOFS,
        userId,
        file
      )

      if (!uploadRes.success || !uploadRes.url) {
        throw new Error(uploadRes.error || 'Gagal mengunggah bukti pembayaran')
      }

      const publicUrl = uploadRes.url

      // 3. Update payment_transactions status
      try {
        const { error: trxErr } = await supabase
          .from('payment_transactions')
          .update({
            payment_status: 'waiting_verification',
            proof_url: publicUrl,
            paid_at: new Date().toISOString()
          })
          .eq('transaction_code', transactionCode)

        if (trxErr) throw trxErr
      } catch (err) {
        console.warn('Could not update payment_transactions table directly, syncing simulation state.')
        // Sync simulated local state
        const simulatedTrxs = JSON.parse(sessionStorage.getItem('simulated_trxs') || '[]')
        const idx = simulatedTrxs.findIndex((t: any) => t.transaction_code === transactionCode)
        if (idx !== -1) {
          simulatedTrxs[idx].payment_status = 'waiting_verification'
          simulatedTrxs[idx].proof_url = publicUrl
          simulatedTrxs[idx].paid_at = new Date().toISOString()
          sessionStorage.setItem('simulated_trxs', JSON.stringify(simulatedTrxs))
        }
      }

      // 4. Sync outstanding due_payments status to pending_verification
      const { error: dueErr } = await supabase
        .from('due_payments')
        .update({
          status: 'pending_verification',
          proof_url: publicUrl,
          rejection_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)

      if (dueErr) throw dueErr

      // 5. Send automated account alert
      try {
        await supabase.from('notifications').insert({
          profile_id: userId,
          title: 'Bukti Pembayaran Dikirim',
          message: `Bukti transfer Anda untuk transaksi "${transactionCode}" telah diunggah dan sedang ditinjau pengurus RT.`,
          is_read: false
        })
      } catch (notifErr) {
        console.warn('Notification log silent bypass')
      }

      return { success: true, proofUrl: publicUrl }
    } catch (err: any) {
      console.error('Proof upload service failed:', err)
      return { success: false, error: err.message || 'Gagal mengunggah bukti pembayaran.' }
    }
  },

  // B. Approve and Verify Citizen Transaction
  async approveTransaction(paymentId: string, transactionCode: string, verifierId: string) {
    const supabase = createClient()

    try {
      // 1. Update payment_transactions status
      try {
        await supabase
          .from('payment_transactions')
          .update({
            payment_status: 'verified',
            approved_by: verifierId
          })
          .eq('transaction_code', transactionCode)
      } catch (e) {
        // Sync local storage simulated state
        const simulatedTrxs = JSON.parse(sessionStorage.getItem('simulated_trxs') || '[]')
        const idx = simulatedTrxs.findIndex((t: any) => t.transaction_code === transactionCode)
        if (idx !== -1) {
          simulatedTrxs[idx].payment_status = 'verified'
          simulatedTrxs[idx].approved_by = verifierId
          sessionStorage.setItem('simulated_trxs', JSON.stringify(simulatedTrxs))
        }
      }

      // 2. Update due_payments status to verified
      const { data: due, error: dueErr } = await supabase
        .from('due_payments')
        .update({
          status: 'verified',
          verified_by: verifierId,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select('profile_id, dues(title)')
        .single()

      if (dueErr) throw dueErr

      // 3. Notify citizen of approval
      if (due) {
        try {
          await supabase.from('notifications').insert({
            profile_id: due.profile_id,
            title: 'Pembayaran Iuran Disetujui',
            message: `Pembayaran iuran "${(due as any).dues?.title || 'Iuran'}" Anda telah berhasil diverifikasi oleh Ketua RT.`,
            is_read: false
          })
        } catch (e) {
          console.warn('Notification log silent bypass')
        }
      }

      return { success: true }
    } catch (err: any) {
      console.error('Approve service failed:', err)
      return { success: false, error: err.message || 'Gagal menyetujui transaksi.' }
    }
  },

  // C. Reject and Decline Citizen Transaction
  async rejectTransaction(paymentId: string, transactionCode: string, verifierId: string, reason: string) {
    const supabase = createClient()

    try {
      // 1. Update payment_transactions status
      try {
        await supabase
          .from('payment_transactions')
          .update({
            payment_status: 'rejected',
            rejection_reason: reason
          })
          .eq('transaction_code', transactionCode)
      } catch (e) {
        // Sync local storage simulated state
        const simulatedTrxs = JSON.parse(sessionStorage.getItem('simulated_trxs') || '[]')
        const idx = simulatedTrxs.findIndex((t: any) => t.transaction_code === transactionCode)
        if (idx !== -1) {
          simulatedTrxs[idx].payment_status = 'rejected'
          simulatedTrxs[idx].rejection_reason = reason
          sessionStorage.setItem('simulated_trxs', JSON.stringify(simulatedTrxs))
        }
      }

      // 2. Update due_payments status to rejected
      const { data: due, error: dueErr } = await supabase
        .from('due_payments')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select('profile_id, dues(title)')
        .single()

      if (dueErr) throw dueErr

      // 3. Notify citizen of rejection
      if (due) {
        try {
          await supabase.from('notifications').insert({
            profile_id: due.profile_id,
            title: 'Pembayaran Iuran Ditolak',
            message: `Pembayaran iuran "${(due as any).dues?.title || 'Iuran'}" Anda ditolak. Alasan: "${reason}"`,
            is_read: false
          })
        } catch (e) {
          console.warn('Notification log silent bypass')
        }
      }

      return { success: true }
    } catch (err: any) {
      console.error('Reject service failed:', err)
      return { success: false, error: err.message || 'Gagal menolak transaksi.' }
    }
  }
}
