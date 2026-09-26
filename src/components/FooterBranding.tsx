import React from 'react';

interface FooterBrandingProps {
 className?: string;
 theme?: 'dark' 'light';
}

export const FooterBranding: React.FC<FooterBrandingProps> = ({
 className = '',
 theme = 'light',
}) => {
 const isDark = theme === 'dark';

 return (
 <footer
 className={`py-4 px-4 text-center select-none text-[11px] transition-colors ${
 isDark ? 'text-slate-500' : 'text-slate-500 border-t border-slate-200/60 bg-white/50 backdrop-blur-xs'
 } ${className}`}
 >
 <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3">
 <span>© {new Date().getFullYear()} CUIDA · Gestão Familiar & Ponto Seguro</span>
 <span className="hidden sm:inline opacity-40"></span>
 <span className="font-medium tracking-wide">
 desenvolvido por <strong className={`${isDark ? 'text-slate-300' : 'text-blue-900'} font-black`}>SF TECNOLOGIA</strong>
 </span>
 </div>
 </footer>
 );
};
