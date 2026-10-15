'use client';

import React, { useEffect, useState } from 'react';
import { supabase, ClientData } from '@/lib/supabase';
import QRCode from 'qrcode';
import {
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Download,
  Store,
  Sparkles,
  Upload,
} from 'lucide-react';

export default function AdminPage() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [formData, setFormData] = useState({
    business_name: '',
    slug: '',
    logo_url: '',
    business_category: 'service',
    google_review_url: '',
    whatsapp_number: '',
    page_title: 'Bantu Nilai Kualitas Layanan Kami',
    reward_text: '',
    snippet_1: '',
    snippet_2: '',
    snippet_3: '',
  });

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successData, setSuccessData] = useState<{ slug: string; fullUrl: string } | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchClients = async () => {
    setLoadingList(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setClients(data);
    }
    setLoadingList(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const generatedSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

    setFormData((prev) => ({
      ...prev,
      business_name: name,
      slug: generatedSlug,
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setErrorMessage('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, logo_url: publicUrlData.publicUrl }));
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gagal mengunggah logo. Pastikan bucket "logos" sudah dibuat public.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleDownloadQR = async (slug: string) => {
    try {
      const targetUrl = `${window.location.origin}/${slug}`;
      const dataUrl = await QRCode.toDataURL(targetUrl, {
        width: 600,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
      });

      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = `QR-UlasPintar-${slug}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error('Gagal generate QR Code:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setSuccessData(null);

    const snippets = [formData.snippet_1, formData.snippet_2, formData.snippet_3].filter(
      (s) => s.trim().length > 0
    );

    let cleanWa = formData.whatsapp_number.replace(/\D/g, '');
    if (cleanWa.startsWith('0')) {
      cleanWa = '62' + cleanWa.slice(1);
    }

    try {
      const { error } = await supabase.from('clients').insert([
        {
          business_name: formData.business_name,
          slug: formData.slug,
          logo_url: formData.logo_url || null,
          business_category: formData.business_category,
          google_review_url: formData.google_review_url,
          whatsapp_number: cleanWa,
          page_title: formData.page_title,
          reward_text: formData.reward_text,
          review_snippets: snippets,
        },
      ]);

      if (error) throw error;

      const fullUrl = `${window.location.origin}/${formData.slug}`;
      const qrDataUrl = await QRCode.toDataURL(fullUrl, {
        width: 400,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
      });

      setSuccessData({ slug: formData.slug, fullUrl });
      setQrImageUrl(qrDataUrl);

      setFormData({
        business_name: '',
        slug: '',
        logo_url: '',
        business_category: 'service',
        google_review_url: '',
        whatsapp_number: '',
        page_title: 'Bantu Nilai Kualitas Layanan Kami',
        reward_text: '',
        snippet_1: '',
        snippet_2: '',
        snippet_3: '',
      });

      fetchClients();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gagal menyimpan klien.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8 text-slate-900">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <span className="inline-block bg-sky-50 text-sky-600 font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider mb-2">
              UlasPintar Admin
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pendaftaran & Data Master Klien</h1>
            <p className="text-xs text-slate-500 mt-1">
              Tambahkan bisnis jejaring Anda, atur ulasan pintar, dan unduh QR code siap cetak.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              Total Klien: <b className="text-sky-600">{clients.length}</b>
            </span>
          </div>
        </div>

        {/* Notifikasi Error */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Gagal Menyimpan</p>
              <p className="text-xs mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Notifikasi Sukses + Preview QR Code Baru */}
        {successData && (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-base mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Klien Baru Berhasil Ditambahkan!
            </div>
            <p className="text-xs text-emerald-700 mb-5">
              Halaman ulasan sudah langsung aktif dan QR code siap diunduh.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6 bg-white p-5 rounded-xl border border-emerald-100 shadow-sm">
              {qrImageUrl && (
                <div className="text-center flex-shrink-0">
                  <img src={qrImageUrl} alt="QR Code" className="w-36 h-36 rounded-lg border border-slate-100 p-1" />
                  <a
                    href={qrImageUrl}
                    download={`QR-UlasPintar-${successData.slug}.png`}
                    className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100"
                  >
                    <Download className="w-3.5 h-3.5" /> Unduh QR PNG
                  </a>
                </div>
              )}
              <div className="flex-1 w-full space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tautan Ulasan Aktif</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      readOnly
                      value={successData.fullUrl}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800 font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(successData.fullUrl)}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition"
                      title="Salin Tautan"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <a
                      href={successData.fullUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition"
                      title="Buka Halaman"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Tambah Klien */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Store className="w-4 h-4 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Informasi Bisnis</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nama Usaha / Toko</label>
              <input
                type="text"
                required
                placeholder="Contoh: Kedai Kopi Senja"
                value={formData.business_name}
                onChange={handleNameChange}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Slug URL (Otomatis)</label>
              <div className="flex items-center">
                <span className="text-xs text-slate-500 bg-slate-100 px-3 py-2.5 border border-r-0 border-slate-300 rounded-l-xl font-mono">/</span>
                <input
                  type="text"
                  required
                  placeholder="kedai-kopi-senja"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-r-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 font-mono font-medium"
                />
              </div>
            </div>
          </div>

          {/* Upload Logo Toko */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Logo Toko (Upload File atau Isi URL)
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer border border-slate-300 transition">
                <Upload className="w-4 h-4 text-sky-600" />
                <span>{uploadingLogo ? 'Mengunggah...' : 'Pilih Berkas Logo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploadingLogo}
                  className="hidden"
                />
              </label>
              <input
                type="url"
                placeholder="https://... atau otomatis terisi dari tombol upload"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                className="w-full flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 font-medium"
              />
            </div>
            {formData.logo_url && (
              <div className="mt-2 flex items-center gap-2 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Logo terpasang. Preview:
                <img src={formData.logo_url} alt="Logo" className="w-6 h-6 rounded-full object-cover border border-slate-200 ml-1" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Link Review Google Maps</label>
              <input
                type="url"
                required
                placeholder="https://g.page/r/.../review"
                value={formData.google_review_url}
                onChange={(e) => setFormData({ ...formData, google_review_url: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nomor WhatsApp Pengelola</label>
              <input
                type="text"
                required
                placeholder="08123456789 atau 628..."
                value={formData.whatsapp_number}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Judul Ajakan di Halaman</label>
              <input
                type="text"
                required
                value={formData.page_title}
                onChange={(e) => setFormData({ ...formData, page_title: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Penawaran Hadiah / Diskon (Opsional)</label>
              <input
                type="text"
                placeholder="Contoh: Tunjukkan bukti ulasan ke kasir untuk bonus es teh manis!"
                value={formData.reward_text}
                onChange={(e) => setFormData({ ...formData, reward_text: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 font-medium"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                3 Template Ulasan Cepat Pelanggan (1-Tap Copy)
              </label>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Pilihan 1: Pelayanan ramah banget, tempatnya nyaman dan bersih."
                value={formData.snippet_1}
                onChange={(e) => setFormData({ ...formData, snippet_1: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 font-medium"
              />
              <input
                type="text"
                placeholder="Pilihan 2: Pengerjaan cepat, harga transparan dan hasilnya sangat memuaskan."
                value={formData.snippet_2}
                onChange={(e) => setFormData({ ...formData, snippet_2: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 font-medium"
              />
              <input
                type="text"
                placeholder="Pilihan 3: Rekomendasi terbaik di sini, pasti bakal langganan lagi!"
                value={formData.snippet_3}
                onChange={(e) => setFormData({ ...formData, snippet_3: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || uploadingLogo}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50 text-sm active:scale-[0.99]"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" /> Simpan Data Klien & Generate QR
              </>
            )}
          </button>
        </form>

        {/* Tabel Daftar Klien dengan Tombol Unduh QR */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Daftar Klien Terdaftar ({clients.length})
            </h3>
          </div>

          {loadingList ? (
            <div className="text-center py-8 text-xs text-slate-400">Memuat daftar klien...</div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">Belum ada klien yang terdaftar.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {clients.map((c) => {
                const clientUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${c.slug}`;
                return (
                  <div key={c.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {c.logo_url ? (
                        <img src={c.logo_url} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200 flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {c.business_name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{c.business_name}</h4>
                        <p className="text-xs font-mono text-sky-600 mt-0.5">/{c.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleDownloadQR(c.slug)}
                        className="px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                        title="Unduh QR Code Toko Ini"
                      >
                        <Download className="w-3.5 h-3.5" /> Unduh QR
                      </button>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(clientUrl)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition"
                        title="Salin Tautan"
                      >
                        <Copy className="w-3.5 h-3.5" /> Salin Link
                      </button>
                      <a
                        href={clientUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Preview
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Admin */}
        <footer className="pt-6 pb-12 text-center text-xs text-slate-400 border-t border-slate-200">
          <p className="font-semibold text-slate-600">UlasPintar Management System</p>
          <p className="text-[11px] mt-1">
            Created with passion by <span className="font-bold text-sky-600">Alfaris Solution</span>
          </p>
        </footer>

      </div>
    </div>
  );
}