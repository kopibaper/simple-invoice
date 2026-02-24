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
- Kelola item dinamis: tambah, edit, hapus item; subtotal dan total dihitung otomatis.
- Format tampilan harga/total: `Rp. 300.000,00`.
- Aksi dokumen:
  - `Pratinjau` membuka modal pratinjau di halaman yang sama (tanpa popup).
  - `Ekspor PDF` menggunakan dialog print browser (`window.print`) dari layout pratinjau.
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
  - catatan
  - data logo (base64)

## Cara Menjalankan
- Buka `index.html` langsung di browser.
- Tidak perlu build tool atau dependency install.

## Catatan Untuk Agent Berikutnya
- Jika mengubah format data simpanan, pertimbangkan migrasi versi key `localStorage`.
- Pratinjau dirender dari salinan `.invoice-card` ke modal `#previewModal`.
- Ekspor PDF menggunakan mode `export-print` dan mencetak dari kontainer pratinjau agar hasil konsisten dengan tampilan preview.
