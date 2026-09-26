import React from 'react';

interface ElderCaneLogoProps {
 size?: 'sm' 'md' 'lg' 'xl';
 variant?: 'blue-on-white' 'white-on-blue' 'monochrome';
 className?: string;
 showText?: boolean;
}

export const ElderCaneLogo: React.FC<ElderCaneLogoProps> = ({
 size = 'md',
 variant = 'white-on-blue',
 className = '',
 showText = true,
}) => {
 const sizeMap = {
 sm: { box: 'w-8 h-8', icon: 20, text: 'text-base', sub: 'text-[9px]' },
 md: { box: 'w-10 h-10', icon: 24, text: 'text-lg', sub: 'text-[10px]' },
 lg: { box: 'w-14 h-14', icon: 34, text: 'text-2xl', sub: 'text-xs' },
 xl: { box: 'w-20 h-20', icon: 48, text: 'text-3xl', sub: 'text-sm' },
 };

 const currentSize = sizeMap[size];

 return (
 <div className={`flex items-center gap-3 ${className}`}>
 {/* Minimalist Vector Icon: Elder with a cane */}
 <div
 className={`${currentSize.box} rounded-xl flex items-center justify-center transition-all ${
 variant === 'white-on-blue'
 ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
 : variant === 'blue-on-white'
 ? 'bg-blue-50 text-blue-700 border border-blue-200'
 : 'bg-slate-900 text-white'
 }`}
 title="CUIDA - Assistência e Ponto Eletrônico Seguro"
 >
 <svg
 viewBox="0 0 48 48"
 fill="none"
 xmlns="http://www.w3.org/2000/svg"
 className="w-4/5 h-4/5"
 aria-label="Ícone de idoso com bengala"
 >
 {/* Elder Head */}
 <circle
 cx="20"
 cy="11"
 r="4.5"
 stroke="currentColor"
 strokeWidth="3"
 strokeLinecap="round"
 />

 {/* Torso with natural gentle curvature */}
 <path
 d="M17 18.5C14 22 13.5 28 14 34L17 43"
 stroke="currentColor"
 strokeWidth="3"
 strokeLinecap="round"
 strokeLinejoin="round"
 />

 {/* Forward leg taking a deliberate step */}
 <path
 d="M14 34L23 43"
 stroke="currentColor"
 strokeWidth="3"
 strokeLinecap="round"
 strokeLinejoin="round"
 />

 {/* Arm holding the cane */}
 <path
 d="M17 21C21 21 26 23 29 27"
 stroke="currentColor"
 strokeWidth="3"
 strokeLinecap="round"
 />

 {/* Minimalist walking cane with curved handle */}
 <path
 d="M27 27C27 25 29 24 31 24C32.5 24 33.5 25 33.5 26.5V43"
 stroke={variant === 'white-on-blue' ? '#93C5FD' : '#2563EB'}
 strokeWidth="3"
 strokeLinecap="round"
 />

 {/* Subtle ground anchor line */}
 <line
 x1="12"
 y1="45"
 x2="36"
 y2="45"
 stroke="currentColor"
 strokeWidth="2"
 strokeLinecap="round"
 strokeOpacity="0.35"
 />
 </svg>
 </div>

 {showText && (
 <div className="flex flex-col leading-tight">
 <div className="flex items-center gap-1.5">
 <span className={`font-extrabold tracking-tight text-blue-900 ${currentSize.text}`}>
 CUIDA
 </span>
 <span className="text-[10px] uppercase tracking-wider font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
 Oficial
 </span>
 </div>
 <span className={`text-slate-500 font-medium ${currentSize.sub}`}>
 Controle Unificado de Idosos e Assistência
 </span>
 </div>
 )}
 </div>
 );
};
