import { LetterRequest, CitizenProfile } from '@/types/letters'
import { Printer } from 'lucide-react'
import { formatRegionNumber } from '@/lib/region-format'

interface LetterPrintLayoutProps {
  letter: LetterRequest
  citizen: CitizenProfile
}

const TYPE_TITLES: Record<string, string> = {
  surat_pengantar: 'SURAT KETERANGAN PENGANTAR',
  surat_keterangan_domisili: 'SURAT KETERANGAN DOMISILI',
  surat_keterangan_tidak_mampu: 'SURAT KETERANGAN TIDAK MAMPU (SKTM)',
  surat_keterangan_usaha: 'SURAT KETERANGAN USAHA (SKU)'
}

export default function LetterPrintLayout({ letter, citizen }: LetterPrintLayoutProps) {
  const title = TYPE_TITLES[letter.letter_type] || 'SURAT KETERANGAN'
  
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatBirthDate = (dateStr?: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const handlePrint = () => {
    window.print()
  }

  const isFinished = letter.status === 'finished'

  // Auto-filled default values if citizen fields are empty
  const fullName = letter.profiles?.full_name || 'Budi Santoso'
  const nik = citizen.nik || '3273012304950002'
  const kk = citizen.kk || '3273012304951113'
  const placeBirth = citizen.place_of_birth || 'Bandung'
  const dateBirth = citizen.date_of_birth ? formatBirthDate(citizen.date_of_birth) : '12 April 1995'
  const gender = citizen.gender === 'L' ? 'Laki-laki' : 'Perempuan'
  const religion = citizen.religion || 'Islam'
  const occupation = citizen.occupation || 'Karyawan Swasta'
  const nationality = citizen.nationality || 'WNI'
  const address = citizen.address || 'Jl. Kebon Jeruk No. 24, RT 03 / RW 05, Kel. Kebon Jeruk, Kec. Kebon Jeruk, Jakarta Barat'
  const rtVal = formatRegionNumber(citizen.rt || '03')
  const rwVal = formatRegionNumber(citizen.rw || '05')

  return (
    <div className="space-y-4">
      {/* Visual Screen Print Button Bar */}
      <div className="flex justify-end p-2 bg-slate-50 border border-slate-100 rounded-2xl print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center space-x-2 px-4.5 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs shadow-sm transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak / Simpan Ke PDF</span>
        </button>
      </div>

      {/* Actual Official Letter Paper Layout */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-[21cm] min-h-[29.7cm] mx-auto text-slate-900 shadow-sm print:shadow-none print:border-none print:p-0 print:rounded-none select-none font-serif leading-relaxed text-sm">
        
        {/* Kop Surat Header */}
        <div className="text-center border-b-[3px] border-double border-slate-900 pb-3 flex flex-col items-center">
          <h2 className="text-base font-bold uppercase tracking-wide leading-tight">
            PENGURUS RUKUN TETANGGA {rtVal} RUKUN WARGA {rwVal}
          </h2>
          <h2 className="text-sm font-bold uppercase tracking-wide leading-tight mt-0.5">
            KELURAHAN KEBON JERUK • KECAMATAN KEBON JERUK
          </h2>
          <h3 className="text-sm font-bold uppercase tracking-wide leading-tight">
            KOTA ADMINISTRASI JAKARTA BARAT
          </h3>
          <p className="text-[10px] font-sans font-semibold text-slate-500 mt-1 italic leading-none">
            Sekretariat: {address}
          </p>
        </div>

        {/* Letter Title Block */}
        <div className="text-center mt-6 space-y-1">
          <h1 className="text-base font-bold underline uppercase tracking-wider leading-none">
            {title}
          </h1>
          <p className="text-xs font-sans font-bold text-slate-800">
            Nomor Surat: {letter.letter_number || '... / ... / ... / ... / ...'}
          </p>
        </div>

        {/* Introduction */}
        <div className="mt-8 text-justify leading-relaxed">
          <p>
            Yang bertanda tangan di bawah ini Rukun Tetangga {rtVal} Rukun Warga {rwVal} Kelurahan Kebon Jeruk, Kecamatan Kebon Jeruk, Kota Administrasi Jakarta Barat, dengan ini menerangkan dengan sebenarnya bahwa warga kependudukan kami:
          </p>
        </div>

        {/* Citizens Personal Data Table */}
        <div className="mt-6 pl-8 space-y-2">
          <div className="grid grid-cols-[160px_10px_1fr] gap-x-2">
            <span>Nama Lengkap</span>
            <span>:</span>
            <span className="font-bold uppercase">{fullName}</span>
          </div>
          <div className="grid grid-cols-[160px_10px_1fr] gap-x-2">
            <span>Nomor Induk Kependudukan</span>
            <span>:</span>
            <span className="font-sans font-bold">{nik}</span>
          </div>
          <div className="grid grid-cols-[160px_10px_1fr] gap-x-2">
            <span>Nomor Kartu Keluarga</span>
            <span>:</span>
            <span className="font-sans font-bold">{kk}</span>
          </div>
          <div className="grid grid-cols-[160px_10px_1fr] gap-x-2">
            <span>Tempat, Tanggal Lahir</span>
            <span>:</span>
            <span>{placeBirth}, {dateBirth}</span>
          </div>
          <div className="grid grid-cols-[160px_10px_1fr] gap-x-2">
            <span>Jenis Kelamin</span>
            <span>:</span>
            <span>{gender}</span>
          </div>
          <div className="grid grid-cols-[160px_10px_1fr] gap-x-2">
            <span>Kewarganegaraan</span>
            <span>:</span>
            <span>{nationality}</span>
          </div>
          <div className="grid grid-cols-[160px_10px_1fr] gap-x-2">
            <span>Agama</span>
            <span>:</span>
            <span>{religion}</span>
          </div>
          <div className="grid grid-cols-[160px_10px_1fr] gap-x-2">
            <span>Pekerjaan</span>
            <span>:</span>
            <span>{occupation}</span>
          </div>
          <div className="grid grid-cols-[160px_10px_1fr] gap-x-2">
            <span>Alamat Lengkap</span>
            <span>:</span>
            <span>{address}</span>
          </div>
        </div>

        {/* Description Body */}
        <div className="mt-8 text-justify space-y-4">
          <p>
            Nama yang tercantum di atas adalah benar warga kami yang berdomisili menetap di wilayah Rukun Tetangga {rtVal} Rukun Warga {rwVal} Kelurahan Kebon Jeruk, dan yang bersangkutan memiliki kelakuan baik serta tercatat aktif dalam kegiatan kemasyarakatan warga.
          </p>
          <p>
            Surat keterangan ini diberikan kepada yang bersangkutan untuk dipergunakan sebagai: <strong className="uppercase font-serif">"{letter.purpose}"</strong>.
          </p>
          {letter.custom_fields && Object.keys(letter.custom_fields).length > 0 && (
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 print:bg-white print:border-none pl-6 space-y-1 text-xs">
              <span className="font-bold text-3xs font-sans text-slate-400 block uppercase tracking-wider print:hidden">Informasi Tambahan:</span>
              {Object.entries(letter.custom_fields).map(([key, val]) => (
                <div key={key} className="grid grid-cols-[140px_10px_1fr] gap-x-1">
                  <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                  <span>:</span>
                  <span>{val}</span>
                </div>
              ))}
            </div>
          )}
          <p>
            Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya dan pihak berkepentingan maklum adanya.
          </p>
        </div>

        {/* Signatures & Seal Block */}
        <div className="mt-14 grid grid-cols-2 text-center gap-x-8">
          <div>
            <p className="invisible">Jakarta, {formatDate(letter.updated_at)}</p>
            <p className="font-bold mt-1">Ketua Rukun Tetangga {rtVal}</p>
            
            {/* Signature Area RT */}
            <div className="h-24 flex items-center justify-center relative">
              {letter.status !== 'pending_rt' && letter.status !== 'rejected' ? (
                <>
                  {/* Visual Seal stamp stamp simulation */}
                  <div className="absolute border-2 border-primary/20 rounded-full w-20 h-20 flex items-center justify-center text-[10px] text-primary/30 rotate-12 select-none pointer-events-none font-sans font-bold uppercase print:hidden">
                    RT {rtVal} SAH
                  </div>
                  <div className="font-sans font-semibold text-3xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                    ✓ E-Signature RT
                  </div>
                </>
              ) : (
                <span className="text-3xs text-slate-300 italic">Belum ditandatangani</span>
              )}
            </div>
            
            <p className="font-bold underline uppercase">
              {letter.letter_approvals?.find(a => a.role === 'rt')?.profiles?.full_name || 'H. Akhmad Sobari'}
            </p>
          </div>

          <div>
            <p className="text-slate-700">Jakarta, {formatDate(letter.updated_at)}</p>
            <p className="font-bold mt-1">Ketua Rukun Warga {rwVal}</p>
            
            {/* Signature Area RW */}
            <div className="h-24 flex items-center justify-center relative">
              {isFinished ? (
                <>
                  <div className="absolute border-2 border-emerald-600/30 rounded-full w-22 h-22 flex items-center justify-center text-[10px] text-emerald-600/40 -rotate-12 select-none pointer-events-none font-sans font-black uppercase">
                    RW {rwVal} SAH
                  </div>
                  <div className="font-sans font-semibold text-3xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg z-10">
                    ✓ E-Signature RW
                  </div>
                </>
              ) : (
                <span className="text-3xs text-slate-300 italic">Belum ditandatangani</span>
              )}
            </div>
            
            <p className="font-bold underline uppercase">
              {letter.letter_approvals?.find(a => a.role === 'rw')?.profiles?.full_name || 'Ir. H. Gunawan'}
            </p>
          </div>
        </div>

        {/* QR Code Verification Footer */}
        {isFinished && (
          <div className="mt-14 border-t border-slate-100 pt-4.5 flex items-center justify-between text-3xs font-sans text-slate-400 font-semibold leading-relaxed">
            <div className="space-y-0.5">
              <p className="text-slate-600 font-bold uppercase tracking-wider text-4xs">Sistem Pengesahan Elektronik Mandiri</p>
              <p>Dokumen ini telah ditandatangani secara elektronik sesuai UU ITE.</p>
              <p>Kode Keamanan ID: {letter.id.slice(0, 18).toUpperCase()}</p>
            </div>
            {/* Mock QR Verification Box */}
            <div className="w-14 h-14 bg-slate-50 border border-slate-200 p-1 flex flex-col items-center justify-center text-[6px] text-slate-400 font-bold font-sans rounded-xl tracking-tight select-none">
              <div className="grid grid-cols-3 gap-[1px] w-10 h-10 bg-slate-800 p-1 mb-1 rounded-md">
                <div className="bg-white"></div><div className="bg-slate-800"></div><div className="bg-white"></div>
                <div className="bg-slate-800"></div><div className="bg-white"></div><div className="bg-slate-800"></div>
                <div className="bg-white"></div><div className="bg-slate-800"></div><div className="bg-white"></div>
              </div>
              <span>QR VALID</span>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
