'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase, ClientData } from '@/lib/supabase';
import { Star, MessageCircle, ExternalLink, Check, Gift, Copy } from 'lucide-react';
import confetti from 'canvas-confetti';

const ratings = [
  '',
  'Sangat Tidak Puas 😞',
  'Kurang Puas 🙁',
  'Cukup / Biasa Saja 😐',
  'Puas & Bagus! 😊',
  'Luar Biasa Memuaskan! 🌟',
];

function ReviewContent() {
  const params = useParams();
  const slug = params?.slug as string;

  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentRating, setCurrentRating] = useState(0);
  const [selectedSnippet, setSelectedSnippet] = useState('');
  const [copied, setCopied] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!slug) return;
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (!error && data) {
          setClient(data);
          if (data.review_snippets?.[0]) {
            setSelectedSnippet(data.review_snippets[0]);
          }
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug]);

  const handleRatingSelect = (score: number) => {
    setCurrentRating(score);
    if (score >= 4) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
    }
  };

  const handleCopySnippet = (text: string) => {
    setSelectedSnippet(text);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleGoToGoogle = async () => {
    if (selectedSnippet) {
      await navigator.clipboard.writeText(selectedSnippet);
    }
    setRedirecting(true);
    setTimeout(() => {
      if (client?.google_review_url) {
        window.location.href = client.google_review_url;
      }
    }, 1200);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 max-w-sm w-full shadow-sm">
          <p className="text-lg font-bold text-slate-800">Toko Tidak Ditemukan</p>
          <p className="text-sm text-slate-500 mt-2">Pastikan tautan ulasan sudah sesuai.</p>
        </div>
      </div>
    );
  }

  const initialName = client.business_name ? client.business_name.substring(0, 2).toUpperCase() : 'UP';
  const waMessage = encodeURIComponent(
    `Halo ${client.business_name}, saya memberikan rating ${currentRating} bintang dengan saran layanan:`
  );

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 text-center relative overflow-hidden">
        
        {redirecting && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-sm animate-bounce">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Ulasan Berhasil Disalin!</h3>
            <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
              Membuka Google Maps... Silakan <b>Tempel / Paste</b> ulasan di kolom bintang.
            </p>
          </div>
        )}

        <div className="flex justify-center mb-4">
          {client.logo_url ? (
            <div className="w-20 h-20 rounded-full p-1 bg-white border-2 border-slate-200 shadow-md flex items-center justify-center overflow-hidden">
              <img src={client.logo_url} alt={client.business_name} className="w-full h-full object-cover rounded-full" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-sky-600 to-sky-400 text-white font-black text-2xl flex items-center justify-center shadow-md border-2 border-white">
              {initialName}
            </div>
          )}
        </div>

        <span className="inline-block bg-sky-50 text-sky-600 font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider mb-2">
          {client.business_name}
        </span>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
          {client.page_title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-6">
          Bantu kami menjaga kualitas terbaik melalui ulasan singkat pengalaman Anda.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6">
          <div className="flex justify-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRatingSelect(star)}
                className="transition-transform active:scale-125 focus:outline-none"
              >
                <Star
                  className={
                    star <= currentRating
                      ? 'w-9 h-9 sm:w-10 sm:h-10 fill-amber-400 text-amber-400'
                      : 'w-9 h-9 sm:w-10 sm:h-10 text-slate-300'
                  }
                />
              </button>
            ))}
          </div>
          <p className="text-xs font-semibold text-slate-600 min-h-[1.25rem]">
            {ratings[currentRating] || 'Ketuk bintang sesuai penilaian Anda'}
          </p>
        </div>

        {currentRating >= 4 && (
          <div className="space-y-4">
            {client.reward_text && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5 text-left">
                <Gift className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-emerald-800 leading-relaxed">
                  {client.reward_text}
                </p>
              </div>
            )}

            {client.review_snippets && client.review_snippets.length > 0 && (
              <div className="text-left bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-slate-700 mb-2.5">
                  💡 Pilih ulasan siap pakai (otomatis tersalin):
                </p>
                <div className="space-y-2">
                  {client.review_snippets.map((snippet, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleCopySnippet(snippet)}
                      className={`w-full text-left text-xs p-3 rounded-xl border transition-all flex items-start justify-between gap-2 ${
                        selectedSnippet === snippet
                          ? 'border-sky-500 bg-sky-50 text-sky-900 font-semibold shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span className="flex-1 leading-relaxed">"{snippet}"</span>
                      {selectedSnippet === snippet ? (
                        <Check className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                      )}
                    </button>
                  ))}
                </div>
                {copied && (
                  <p className="text-[11px] font-semibold text-emerald-600 flex items-center justify-center gap-1 mt-2.5">
                    <Check className="w-3.5 h-3.5" /> Teks tersalin! Tinggal tempel di Google Maps.
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleGoToGoogle}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all text-sm active:scale-[0.98]"
            >
              Salin & Buka Google Maps
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        )}

        {currentRating > 0 && currentRating <= 3 && (
          <div className="space-y-3">
            <p className="text-xs text-rose-600 font-medium leading-relaxed bg-rose-50 border border-rose-200 p-3 rounded-xl">
              Mohon maaf atas ketidaknyamanannya. Masukan Anda sangat penting untuk perbaikan langsung pihak pengelola:
            </p>
            <a
              href={`https://wa.me/${client.whatsapp_number}?text=${waMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all text-sm active:scale-[0.98]"
            >
              <MessageCircle className="w-4 h-4" />
              Sampaikan Masukan via WhatsApp
            </a>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col items-center justify-center gap-1 text-[11px] text-slate-400">
          <p className="font-medium">
            Powered by <span className="font-bold text-slate-600">UlasPintar</span>
          </p>
          <p className="text-[10px] text-slate-400 tracking-wide">
            Created by <span className="font-bold text-sky-600">Alfaris Solution</span>
          </p>
        </div>

      </div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600"></div>
        </div>
      }
    >
      <ReviewContent />
    </Suspense>
  );
}