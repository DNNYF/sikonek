import { AppShell } from '@/components/AppShell'
import './globals.css'

export const metadata = {
  title: 'WiFi RT/RW - Manajemen Tagihan',
  description: 'Aplikasi manajemen tagihan WiFi RT/RW',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}