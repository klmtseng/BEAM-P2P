
import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Loader2, CameraOff, X } from 'lucide-react';
import { BeamMode } from '../types';

interface QRScannerProps {
  onScan: (peerId: string, mode: BeamMode) => void;
  onCancel: () => void;
  isConnecting: boolean;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onCancel, isConnecting }) => {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    let isMounted = true;
    const initScanner = () => {
      if (!isMounted) return;
      try {
        const scanner = new Html5QrcodeScanner("reader", { fps: 20, qrbox: 250, aspectRatio: 1.0 }, false);
        scannerRef.current = scanner;
        scanner.render(
          (text) => {
            if (text.includes('/join/')) {
              const urlPart = text.split('/join/')[1];
              const [id, query] = urlPart.split('?');
              const params = new URLSearchParams(query || '');
              const mode = (params.get('mode') as BeamMode) || 'direct';
              if (navigator.vibrate) navigator.vibrate(50);
              scanner.clear().then(() => { if (isMounted) onScan(id, mode); });
            }
          },
          () => {}
        );
      } catch (err) {
        setError("Camera permission denied.");
      }
    };
    const t = setTimeout(initScanner, 400);
    return () => { 
      isMounted = false; 
      clearTimeout(t); 
      if (scannerRef.current) scannerRef.current.clear().catch(() => {});
    };
  }, [onScan]);

  if (isConnecting) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <Loader2 className="animate-spin text-indigo-500" size={64} />
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Handshaking...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center gap-8 py-4 animate-in slide-in-from-bottom-8">
      <div className="text-center">
        <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">Scanner</h3>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Scan code to establish beam</p>
      </div>
      <div className="w-full aspect-square bg-slate-950 rounded-[3rem] overflow-hidden border border-slate-800 relative ring-1 ring-white/5">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full p-10 text-center gap-4">
            <CameraOff size={32} className="text-red-500" />
            <p className="text-slate-400 text-xs font-bold uppercase">{error}</p>
          </div>
        ) : <div id="reader" className="w-full h-full"></div>}
        {!error && (
          <div className="absolute inset-0 pointer-events-none border-[30px] border-black/30">
            <div className="w-full h-full relative">
               <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_15px_indigo] animate-[scan_2s_infinite]"></div>
            </div>
          </div>
        )}
      </div>
      <button onClick={onCancel} className="mt-auto w-full py-5 bg-slate-900 text-slate-500 rounded-3xl font-black text-[10px] uppercase tracking-widest border border-slate-800 active:scale-95 transition-all">
        <X size={16} className="inline mr-2" /> Cancel
      </button>
    </div>
  );
};

export default QRScanner;
