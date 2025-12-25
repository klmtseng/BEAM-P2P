
import React from 'react';
import { ArrowLeft, Zap, Shield } from 'lucide-react';

interface HeaderProps {
  onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onBack }) => {
  return (
    <header className="flex items-center justify-between py-4 border-b border-slate-800/50">
      <div className="flex items-center gap-2">
        {onBack && (
          <button 
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-slate-900 rounded-full transition-all active:scale-90"
          >
            <ArrowLeft size={20} className="text-slate-400" />
          </button>
        )}
        <div className="flex items-center gap-1.5 font-bold tracking-tight text-xl">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <Zap size={18} className="text-white fill-white" />
          </div>
          <span className="bg-gradient-to-br from-white to-slate-500 bg-clip-text text-transparent italic font-black">BEAM</span>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-full border border-slate-800">
        <Shield size={12} className="text-emerald-500" />
        <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase">Incognito</span>
      </div>
    </header>
  );
};

export default Header;
