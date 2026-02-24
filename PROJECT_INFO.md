# Responsive Invoice - Project Info

## Ringkasan
- Aplikasi invoice/faktur berbasis HTML, CSS, dan JavaScript murni (tanpa framework).
- UI responsif untuk desktop dan mobile dengan tema modern.
- Bahasa antarmuka saat ini: Indonesia.
- Default mata uang: `Rp.`.
- Nomor faktur otomatis dibuat dengan pola `INV-YYYYMMDD-XXX`.

## Fitur Utama
- Edit data faktur langsung di halaman (judul, nomor, tanggal, jatuh tempo).
- Upload logo perusahaan dengan preview langsung.
- Kelola item dinamis: tambah, edit, hapus item; total dihitung otomatis.
- Format tampilan harga/total: `Rp. 300.000,00`.
- Kontrol ringkasan: pajak %, diskon, mata uang kustom.
- Aksi dokumen:
  - `Pratinjau` membuka modal pratinjau di halaman yang sama (tanpa popup).
  - `Ekspor PDF` menggunakan dialog print browser (`window.print`).
  - `Simpan` menyimpan data ke `localStorage`.
  - `Muat` memuat data dari `localStorage`.
  - `Reset Templat` mengembalikan template default.
- Autosave aktif saat form berubah (debounce 500ms).

## Struktur File
- `index.html`: struktur utama halaman invoice + tombol aksi.
- `styles.css`: styling visual, responsif, dan aturan print.
- `script.js`: logika aplikasi (items, total, simpan/muat, reset, preview, ekspor).

## Data Persisten
- Storage key: `responsiveInvoiceDataV1`.
- Fallback storage: jika `localStorage` diblokir, gunakan `sessionStorage`.
- Data yang disimpan:
  - informasi header faktur
  - data pihak pengirim/penerima
  - daftar item
  - pajak, diskon, mata uang
  - catatan
  - data logo (base64)

## Cara Menjalankan
- Buka `index.html` langsung di browser.
- Tidak perlu build tool atau dependency install.

## Catatan Untuk Agent Berikutnya
- Jika mengubah format data simpanan, pertimbangkan migrasi versi key `localStorage`.
- Pratinjau dirender dari salinan `.invoice-card` ke modal `#previewModal`.
- Untuk format Rupiah dengan pemisah ribuan, peningkatan paling aman adalah menambah formatter lokal di `script.js` pada fungsi `formatMoney`.
