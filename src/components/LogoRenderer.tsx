import React from 'react';

export const LOGO_PRESETS = [
  {
    key: 'shield',
    name: 'Perisai Olahraga (Sports Shield)',
    description: 'Sangat cocok untuk tim kustom jersey dan sports apparel. Tampak kokoh & premium.',
    svg: (className = "w-12 h-12 text-indigo-600 print:text-black") => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" fillOpacity="0.1" />
        <path d="M12 6v11" />
        <path d="M9 9h6" />
        <path d="M9 13h6" />
      </svg>
    )
  },
  {
    key: 'soccer',
    name: 'Jersey Champion (Soccer Athletics)',
    description: 'Bentuk bola bintang dengan lingkaran estetik. Ideal untuk sablon jersey bola.',
    svg: (className = "w-12 h-12 text-indigo-600 print:text-black") => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1" />
        <path d="m12 2 1.5 5 5 1.5-5 1.5-1.5 5-1.5-5-5-1.5 5-1.5z" />
      </svg>
    )
  },
  {
    key: 'lightning',
    name: 'Petir Dinamis (Dynamic Thunder)',
    description: 'Menyimbolkan pengerjaan cepat (Cepat & Tajam). Sangat tajam untuk konveksi modern.',
    svg: (className = "w-12 h-12 text-indigo-600 print:text-black") => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" fillOpacity="0.15" />
      </svg>
    )
  },
  {
    key: 'crown',
    name: 'Mahkota Champion (VIP Crown)',
    description: 'Mewakili apparel kustom kualitas tertinggi, kain premium grade & sablon ekspor.',
    svg: (className = "w-12 h-12 text-indigo-600 print:text-black") => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" fill="currentColor" fillOpacity="0.1" />
        <path d="M3 20h18" strokeLinecap="square" />
      </svg>
    )
  },
  {
    key: 'monogram',
    name: 'Sleek Monogram A3 (Athree Studio)',
    description: 'Logo inisial khusus Athree Studio dengan visual tipografi minimalis modern.',
    svg: (className = "w-12 h-12 text-indigo-600 print:text-black") => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" fillOpacity="0.08" />
        <path d="M8 18V8l4 6 4-6v10" />
        <circle cx="12" cy="12" r="1.5" className="fill-indigo-600 print:fill-black" />
      </svg>
    )
  }
];

interface LogoRendererProps {
  logoType?: string;
  presetKey?: string;
  customUrl?: string | null;
  className?: string;
}

export default function LogoRenderer({
  logoType = 'none',
  presetKey = 'shield',
  customUrl = null,
  className = "w-12 h-12 text-indigo-600 print:text-black"
}: LogoRendererProps) {
  if (logoType === 'none') {
    return null;
  }

  if (logoType === 'custom' && customUrl) {
    return (
      <img
        src={customUrl}
        alt="Logo Toko"
        referrerPolicy="no-referrer"
        className={`${className} object-contain rounded-lg max-h-16 max-w-[120px] print:max-h-12 print:max-w-[100px] border border-slate-100/50 print:border-none`}
      />
    );
  }

  if (logoType === 'preset') {
    const foundPreset = LOGO_PRESETS.find(p => p.key === presetKey);
    if (foundPreset) {
      return foundPreset.svg(className);
    }
  }

  return null;
}
