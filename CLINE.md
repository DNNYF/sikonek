# WiFi RT/RW — Frontend Spec
> Untuk Cline. Baca seluruh dokumen ini sebelum menulis satu baris kode.

---

## Konteks Proyek

Aplikasi web untuk pemilik bisnis WiFi RT/RW skala kecil. Digunakan oleh **1 admin (paman)** untuk:
- Mengelola data pelanggan
- Mencatat pembayaran cash saat keliling tagihan
- Memantau status invoice per pelanggan
- Melihat rekap & laporan bulanan

Bukan aplikasi publik. Tidak ada fitur login pelanggan.

---

## Stack

| Layer | Pilihan |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS v3 |
| Component library | shadcn/ui |
| Icons | lucide-react |
| HTTP client | fetch native (tidak perlu axios) |
| State | React useState / useEffect saja |
| Database client | @supabase/supabase-js |
| Bahasa | JavaScript (bukan TypeScript) |

Tidak perlu: Redux, Zustand, React Query, atau library state management lainnya.

---

## Struktur Folder

```
app/
  layout.js
  page.js                    ← redirect ke /dashboard
  dashboard/
    page.js
  pelanggan/
    page.js                  ← daftar pelanggan
    tambah/
      page.js                ← form tambah pelanggan
    [id]/
      page.js                ← detail pelanggan
  tagihan/
    page.js                  ← daftar invoice bulan ini
  pembayaran/
    page.js                  ← form catat pembayaran cash
  keluhan/
    page.js                  ← log keluhan pelanggan
  laporan/
    page.js                  ← rekap bulanan
components/
  Sidebar.js
  StatCard.js
  PelangganTable.js
  InvoiceTable.js
  PaymentForm.js
  StatusBadge.js
lib/
  supabase.js                ← supabase client
  utils.js                   ← helper functions
```

---

## Environment Variables

Buat file `.env.local` di root project:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Database Schema (Supabase)

Tabel yang sudah ada di Supabase. Gunakan nama tabel dan kolom ini secara eksak.

### `internet_packages`
```
id, package_name, price, speed_mbps, created_at
```

### `customers`
```
id, full_name, whatsapp_number, address, rt_rw,
package_id (FK → internet_packages),
pppoe_username, odp_name, billing_date,
is_active, deleted_at, joined_at
```

### `invoices`
```
id, customer_id (FK → customers),
billing_period (DATE), amount_due,
status (enum: unpaid | paid | overdue | waived),
due_date, overdue_since, notes, created_at
```

### `payments`
```
id, invoice_id (FK → invoices),
customer_id (FK → customers),
amount_paid, payment_method, receipt_url,
is_verified, received_by, paid_at
```

### `complaints`
```
id, customer_id (FK → customers),
issue, source, status (enum: open | in_progress | resolved),
handled_by, notes, reported_at, resolved_at
```

### `connection_logs`
```
id, customer_id (FK → customers),
action (enum: disconnected | reconnected),
reason (enum: overdue | manual | technical),
note, created_at
```

### `expenses`
```
id, category, description, amount, expense_date, created_at
```

---

## Supabase Client (`lib/supabase.js`)

```js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
```

---

## Halaman & Fitur

### 1. Layout (`app/layout.js`)

- Sidebar kiri fixed, lebar 220px
- Konten di kanan mengisi sisa lebar
- Sidebar berisi navigasi ke semua halaman
- Mobile: sidebar collapse jadi hamburger menu
- Warna tema: putih / abu-abu terang. Accent color: biru (Tailwind `blue-600`)

**Navigasi sidebar:**
```
Dashboard
Pelanggan
Tagihan
Catat Pembayaran   ← highlight khusus (tombol besar, accent color)
Keluhan
Laporan
```

---

### 2. Dashboard (`/dashboard`)

**Query Supabase yang dibutuhkan:**
```js
// Total pelanggan aktif
const { count } = await supabase
  .from('customers')
  .select('*', { count: 'exact', head: true })
  .eq('is_active', true)
  .is('deleted_at', null)

// Invoice unpaid bulan ini
const { data: unpaid } = await supabase
  .from('invoices')
  .select('*')
  .eq('status', 'unpaid')
  .gte('billing_period', startOfMonth)

// Total pendapatan bulan ini
const { data: payments } = await supabase
  .from('payments')
  .select('amount_paid')
  .gte('paid_at', startOfMonth)

// Keluhan open
const { count: openComplaints } = await supabase
  .from('complaints')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'open')
```

**UI yang dirender:**
- 4 StatCard: Pelanggan Aktif / Belum Bayar / Pendapatan Bulan Ini / Keluhan Open
- Tabel "Belum Bayar" — 10 invoice unpaid/overdue terbaru (kolom: nama, paket, tagihan, jatuh tempo, status)
- Tabel "Keluhan Terbaru" — 5 keluhan open terbaru

---

### 3. Daftar Pelanggan (`/pelanggan`)

**Query:**
```js
const { data } = await supabase
  .from('customers')
  .select(`*, internet_packages(package_name, price, speed_mbps)`)
  .is('deleted_at', null)
  .order('full_name')
```

**UI:**
- Search bar (filter by `full_name` atau `whatsapp_number`) — filter di client side
- Filter toggle: Semua / Aktif / Nonaktif
- Tabel kolom: Nama, No WA, RT/RW, Paket, Tanggal Bergabung, Status (badge), Aksi
- Kolom Aksi: tombol "Lihat Detail"
- Tombol "+ Tambah Pelanggan" di pojok kanan atas → navigasi ke `/pelanggan/tambah`

---

### 4. Tambah Pelanggan (`/pelanggan/tambah`)

**Form fields:**
```
full_name        → input text, required
whatsapp_number  → input text, required, placeholder: "08xxx"
address          → textarea
rt_rw            → input text, placeholder: "003/005"
package_id       → select (load dari tabel internet_packages)
pppoe_username   → input text (opsional, untuk MikroTik nanti)
odp_name         → input text (opsional)
billing_date     → input number, default 5, min 1 max 28
```

**Setelah submit:**
1. Insert ke tabel `customers`
2. Auto-generate invoice bulan berjalan untuk pelanggan ini
3. Redirect ke `/pelanggan`
4. Tampilkan toast sukses

**Auto-generate invoice:**
```js
await supabase.from('invoices').insert({
  customer_id: newCustomer.id,
  billing_period: startOfCurrentMonth,
  amount_due: selectedPackage.price,
  status: 'unpaid',
  due_date: billingDateThisMonth
})
```

---

### 5. Detail Pelanggan (`/pelanggan/[id]`)

**Query:**
```js
const { data: customer } = await supabase
  .from('customers')
  .select(`*, internet_packages(*)`)
  .eq('id', id)
  .single()

const { data: invoices } = await supabase
  .from('invoices')
  .select(`*, payments(*)`)
  .eq('customer_id', id)
  .order('billing_period', { ascending: false })

const { data: complaints } = await supabase
  .from('complaints')
  .select('*')
  .eq('customer_id', id)
  .order('reported_at', { ascending: false })
```

**UI:**
- Info card pelanggan (nama, WA, alamat, paket, status aktif/nonaktif)
- Tombol "Nonaktifkan" / "Aktifkan" (toggle `is_active`)
- Tab: Riwayat Invoice | Riwayat Keluhan
- Tab Invoice: tabel semua invoice + status pembayaran
- Tab Keluhan: tabel semua keluhan + status

---

### 6. Daftar Tagihan (`/tagihan`)

**Query:**
```js
const { data } = await supabase
  .from('invoices')
  .select(`*, customers(full_name, whatsapp_number, rt_rw)`)
  .in('status', ['unpaid', 'overdue'])
  .order('due_date')
```

**UI:**
- Filter bulan (default: bulan ini)
- Filter status: Semua / Unpaid / Overdue / Paid / Waived
- Tabel kolom: Nama Pelanggan, RT/RW, Tagihan, Jatuh Tempo, Status, Aksi
- Kolom Aksi: tombol "Tandai Lunas" (shortcut cepat untuk bayar cash)
- Klik "Tandai Lunas" → modal konfirmasi kecil → insert ke `payments`, update `invoices.status` ke `'paid'`

---

### 7. Catat Pembayaran (`/pembayaran`)

Halaman utama untuk paman saat **keliling tagihan**. Harus simpel dan cepat dipakai di HP.

**Flow:**
1. Search pelanggan by nama atau nomor WA
2. Sistem tampilkan invoice unpaid/overdue milik pelanggan tersebut
3. Admin pilih invoice yang dibayar
4. Isi form pembayaran
5. Submit → update status invoice, insert payment record

**Form fields:**
```
customer_id     → search & select pelanggan
invoice_id      → select dari invoice unpaid pelanggan tersebut (auto-load)
amount_paid     → number input (default: amount_due invoice)
payment_method  → select: cash | transfer_bca | transfer_bri | transfer_dana | lainnya
received_by     → input text, default "Paman" (bisa diubah)
notes           → textarea opsional (catatan paman)
```

**Setelah submit:**
```js
// 1. Insert payment
await supabase.from('payments').insert({ ... })

// 2. Update invoice status
await supabase.from('invoices')
  .update({ status: 'paid' })
  .eq('id', invoice_id)
```

Tampilkan konfirmasi sukses yang besar dan jelas (bukan toast kecil) karena dipakai saat keliling.

---

### 8. Keluhan (`/keluhan`)

**Query:**
```js
const { data } = await supabase
  .from('complaints')
  .select(`*, customers(full_name, whatsapp_number)`)
  .order('reported_at', { ascending: false })
```

**UI:**
- Filter status: Semua / Open / In Progress / Resolved
- Tabel kolom: Pelanggan, Keluhan, Sumber, Status, Dilaporkan, Ditangani Oleh, Aksi
- Kolom Aksi: dropdown ubah status (Open → In Progress → Resolved)
- Saat resolved: auto-fill `resolved_at` dengan timestamp sekarang
- Tombol "+ Tambah Keluhan Manual" → modal form sederhana

**Form tambah keluhan:**
```
customer_id  → search & select pelanggan
issue        → textarea, required
source       → select: whatsapp | telepon | langsung
handled_by   → input text
```

---

### 9. Laporan (`/laporan`)

**UI:**
- Pilihan bulan & tahun (select)
- Summary card: Total Tagihan / Total Terbayar / Total Nunggak / Total Pengeluaran / Net
- Tabel pembayaran bulan tersebut (nama, jumlah, metode, tanggal)
- Tabel pengeluaran bulan tersebut
- Tombol "Export CSV" untuk tabel pembayaran

**Query laporan:**
```js
const { data: monthPayments } = await supabase
  .from('payments')
  .select(`*, customers(full_name), invoices(billing_period)`)
  .gte('paid_at', startOfMonth)
  .lte('paid_at', endOfMonth)

const { data: monthExpenses } = await supabase
  .from('expenses')
  .select('*')
  .gte('expense_date', startOfMonth)
  .lte('expense_date', endOfMonth)
```

**Export CSV (implementasi di client):**
```js
function exportCSV(data, filename) {
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map(row => Object.values(row).join(','))
  const csv = [headers, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}
```

---

## Komponen Reusable

### `StatusBadge.js`
```jsx
// Props: status (string)
// Mapping warna:
// unpaid     → yellow
// paid       → green
// overdue    → red
// waived     → gray
// open       → red
// in_progress→ yellow
// resolved   → green
// active     → green
// inactive   → gray
```

### `StatCard.js`
```jsx
// Props: title, value, subtitle, icon (lucide component), color
// Tampilan: card dengan icon kiri, angka besar, subtitle kecil di bawah
```

### `PaymentForm.js`
```jsx
// Reusable form pembayaran
// Dipakai di /pembayaran dan sebagai modal di /tagihan (Tandai Lunas)
```

---

## Helper Functions (`lib/utils.js`)

```js
// Format rupiah
export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

// Format tanggal Indonesia
export function formatTanggal(dateString) {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

// Start & end of month
export function getMonthRange(year, month) {
  const start = new Date(year, month - 1, 1).toISOString()
  const end = new Date(year, month, 0, 23, 59, 59).toISOString()
  return { start, end }
}

// Hitung hari keterlambatan
export function hariTerlambat(dueDateString) {
  const today = new Date()
  const due = new Date(dueDateString)
  const diff = Math.floor((today - due) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}
```

---

## UI & Styling Rules

- Gunakan shadcn/ui untuk: Button, Input, Select, Table, Badge, Dialog, Toast, Card, Tabs
- Tailwind untuk layout, spacing, dan warna custom
- Semua tabel harus responsive (horizontal scroll di mobile)
- Loading state: tampilkan skeleton atau spinner saat fetch data
- Error state: tampilkan pesan error yang jelas jika query gagal
- Konfirmasi destructive action (nonaktifkan pelanggan, waive invoice) harus pakai Dialog/modal, bukan `window.confirm`
- Bahasa UI: **Bahasa Indonesia** seluruhnya
- Format angka: Rupiah (Rp 150.000 bukan 150000)
- Format tanggal: "5 Januari 2025" bukan "2025-01-05"

---

## Urutan Generate

Generate dalam urutan ini agar dependency terpenuhi:

1. `lib/supabase.js` dan `lib/utils.js`
2. `components/StatusBadge.js`, `components/StatCard.js`
3. `app/layout.js` + `components/Sidebar.js`
4. `app/dashboard/page.js`
5. `app/pelanggan/page.js`
6. `app/pelanggan/tambah/page.js`
7. `app/pelanggan/[id]/page.js`
8. `app/tagihan/page.js`
9. `app/pembayaran/page.js` + `components/PaymentForm.js`
10. `app/keluhan/page.js`
11. `app/laporan/page.js`

---

## Yang Tidak Perlu Dibuat

- Halaman login / autentikasi
- API routes (`app/api/`) — semua query langsung dari client ke Supabase
- Unit test
- Integrasi MikroTik (nanti)
- Integrasi WhatsApp / notifikasi (nanti)
- Upload foto bukti transfer (nanti)

---

## Catatan untuk Cline

- Jangan buat fitur di luar yang tertulis di spec ini
- Jika ada ambiguitas, pilih implementasi yang paling simpel
- Semua data fetch dilakukan di dalam komponen dengan `useEffect`, bukan server component, karena semua halaman butuh interaktivitas
- Gunakan `'use client'` di semua page dan komponen
- Jika perlu install package baru, jalankan `npm install` sebelum generate kode