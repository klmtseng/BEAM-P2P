import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Loader2, Share2, Lock, Users, MessageSquare } from 'lucide-react';
import { BeamMode } from '../types';

interface QRGeneratorProps {
  peerId: string;
  mode: BeamMode;
}

const QRGenerator: React.FC<QRGeneratorProps> = ({ peerId, mode }) => {
  const [copied, setCopied] = useState(false);
  
  const getJoinUrl = () => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const cleanPath = pathname.endsWith('/') ? pathname : pathname + '/';
    return `${origin}${cleanPath}#/join/${peerId}?mode=${mode}`;
  };

  const joinUrl = getJoinUrl();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Beam Tunnel',
          text: `Connect to my secure ${mode} beam:`,
          url: joinUrl,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleSMSInvite = () => {
    const message = `Join my secure Beam tunnel (${mode}): ${joinUrl}`;
    const encodedBody = encodeURIComponent(message);
    
    // iOS uses '&' for body separator, Android uses '?'
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const separator = isIOS ? '&' : '?';
    
    window.location.href = `sms:${separator}body=${encodedBody}`;
  };

  if (!peerId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
        <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">Generating Tunnel...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center py-2 gap-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center space-y-2">
        <div className={`inline-flex items-center gap-2 px-3 py-1 ${mode === 'direct' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'} border rounded-full text-[9px] font-black uppercase tracking-widest mb-2`}>
          {mode === 'direct' ? <Lock size={10} /> : <Users size={10} />}
          {mode === 'direct' ? 'Private Tunnel Ready' : 'Group Beam Active'}
        </div>
        <h3 className="text-2xl font-black text-white tracking-tight">Host Broadcasting</h3>
        <p className="text-slate-500 text-[11px] px-8 leading-relaxed">
          {mode === 'direct' 
            ? 'Scan to establish a direct 1:1 encrypted tunnel. High stability.' 
            : 'Multi-user relay enabled. Anyone with this code can join the group.'}
        </p>
      </div>

      <div className="relative group">
        <div className={`absolute -inset-6 ${mode === 'direct' ? 'bg-emerald-600/10' : 'bg-indigo-600/10'} blur-3xl rounded-full transition-all duration-1000`}></div>
        <div className="relative p-6 bg-white rounded-[2.5rem] shadow-2xl border-[6px] border-slate-900">
          <QRCodeSVG value={joinUrl} size={180} level="H" includeMargin={false} />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-slate-100 text-indigo-600">
                {mode === 'direct' ? <Lock size={16} /> : <Users size={16} />}
             </div>
          </div>
        </div>
      </div>

      <div className="w-full space-y-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-[2rem] backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between bg-black/50 p-3 rounded-2xl border border-white/5 group active:bg-black transition-colors" onClick={handleCopyLink}>
            <code className="text-indigo-400 font-mono font-bold tracking-wider text-xs truncate max-w-[200px]">{peerId}</code>
            <button className="text-slate-500">
              {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleSMSInvite} className="py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 border border-slate-700">
            <MessageSquare size={16} />
            SMS Invite
          </button>
          <button onClick={handleShare} className={`py-4 ${mode === 'direct' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500'} text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95`}>
            <Share2 size={16} />
            Share Link
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRGenerator;