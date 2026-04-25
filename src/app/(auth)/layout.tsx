// =============================================================================
// app/(auth)/layout.tsx
// Layout untuk halaman autentikasi
// =============================================================================

import type { Metadata } from 'next'
import { APP_NAME, APP_ORG } from '@/lib/constants'

export const metadata: Metadata = {
  title: `Login | ${APP_NAME}`,
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Panel Kiri — Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{ background: 'hsl(160 36% 12%)' }}
      >
        {/* Lingkaran dekoratif */}
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'hsl(145 40% 50%)' }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'hsl(145 40% 50%)' }}
        />

        {/* Logo & Nama */}
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg"
            style={{ background: 'hsl(145 40% 45%)' }}
          >
            IT
          </div>
          <div>
            <p className="font-bold text-base leading-tight">{APP_NAME}</p>
            <p className="text-xs opacity-60">{APP_ORG}</p>
          </div>
        </div>

        {/* Konten Tengah */}
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            Sistem Manajemen<br />ASPRA
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-sm">
            Laporkan masalah IT Anda dengan mudah dan pantau perkembangan penanganannya secara realtime.
          </p>

          {/* Feature list */}
          <div className="mt-8 space-y-3">
            {[
              'Buat tiket kapan saja, di mana saja',
              'Notifikasi realtime setiap update',
              'Pantau SLA dan waktu resolusi',
              'Riwayat & laporan lengkap',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'hsl(145 40% 35%)' }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-sm text-white/80">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-xs text-white/40">© 2025 {APP_ORG}. Hak cipta dilindungi.</p>
        </div>
      </div>

      {/* Panel Kanan — Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-lg"
              style={{ background: 'hsl(160 36% 18%)' }}
            >
              IT
            </div>
            <div>
              <p className="font-bold text-base">{APP_NAME}</p>
              <p className="text-xs text-muted-foreground">{APP_ORG}</p>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
