import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Loader2, CameraOff, X, Scan } from 'lucide-react';
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
    
    const startScanner = async () => {
      // Small delay to ensure DOM is ready and previous instances are cleared
      await new Promise(resolve => setTimeout(resolve, 300));
      if (!isMounted) return;

      try {
        const scanner = new Html5QrcodeScanner(
          "reader", 
          { 
            fps: 15, 
            qrbox: (w, h) => ({ width: w * 0.7, height: h * 0.7 }),
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true
          }, 
          false
        );
        
        scannerRef.current = scanner;
        
        scanner.render(
          (text) => {
            if (text.includes('/join/')) {
              const urlPart = text.split('/join/')[1];
              const [id, query] = urlPart.split('?');
              const params = new URLSearchParams(query || '');
              const mode = (params.get('mode') as BeamMode) || 'direct';
              
              if (navigator.vibrate) navigator.vibrate([50]);
              
              scanner.clear().catch(console.error).finally(() => {
                if (isMounted) onScan(id, mode);
              });
            }
          },
          (errorMessage) => {
            // Silence common scanning failures
          }
        );
      } catch (err) {
        if (isMounted) setError("Camera access was blocked or is unavailable.");
      }
    };

    startScanner();

    return () => { 
      isMounted = false; 
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.warn("Scanner Clear Error", e));
      }
    };
  }, [onScan]);

  if (isConnecting) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-pulse">
        <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20">
          <Loader2 className="animate-spin text-indigo-500" size={40} />
        </div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Establishing Handshake...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center gap-8 py-4 animate-in slide-in-from-bottom-8 duration-500">
      <div className="text-center space-y-1">
        <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">Scanner</h3>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Point at Peer's Beam Code</p>
      </div>
      
      <div className="w-full max-w-[320px] aspect-square bg-slate-950 rounded-[3rem] overflow-hidden border border-slate-800 relative shadow-2xl shadow-indigo-500/5 ring-1 ring-white/10">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full p-10 text-center gap-4">
            <CameraOff size={40} className="text-red-500/50" />
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{error}</p>
          </div>
        ) : (
          <>
            <div id="reader" className="w-full h-full"></div>
            <div className="absolute inset-0 pointer-events-none">
              {/* Corner Accents */}
              <div className="absolute top-8 left-8 w-8 h-8 border-l-2 border-t-2 border-indigo-500 rounded-tl-lg"></div>
              <div className="absolute top-8 right-8 w-8 h-8 border-r-2 border-t-2 border-indigo-500 rounded-tr-lg"></div>
              <div className="absolute bottom-8 left-8 w-8 h-8 border-l-2 border-b-2 border-indigo-500 rounded-bl-lg"></div>
              <div className="absolute bottom-8 right-8 w-8 h-8 border-r-2 border-b-2 border-indigo-500 rounded-br-lg"></div>
              {/* Scan Line Animation */}
              <div className="absolute top-[20%] left-[15%] right-[15%] h-0.5 bg-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.8)] animate-[scan-line_2.5s_infinite]"></div>
            </div>
          </>
        )}
      </div>

      <div className="mt-auto w-full flex flex-col gap-3">
        <div className="flex items-center gap-2 justify-center text-[9px] font-black uppercase tracking-widest text-slate-600 mb-2">
           <Scan size={12} /> Live Encrypted Viewport
        </div>
        <button onClick={onCancel} className="w-full py-5 glass-panel text-slate-400 rounded-3xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3">
          <X size={16} /> Close Scanner
        </button>
      </div>
    </div>
  );
};

export default QRScanner;