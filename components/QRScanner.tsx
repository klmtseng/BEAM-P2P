import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Loader2, Camera, Image as ImageIcon, X, Scan, RefreshCw, Upload, AlertCircle } from 'lucide-react';
import { BeamMode } from '../types';

interface QRScannerProps {
  onScan: (peerId: string, mode: BeamMode) => void;
  onCancel: () => void;
  isConnecting: boolean;
}

type ScanMethod = 'camera' | 'file';

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onCancel, isConnecting }) => {
  const [scanMethod, setScanMethod] = useState<ScanMethod>('camera');
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isScanningRef = useRef<boolean>(false); // Lock to track internal state

  // Helper to parse the URL string
  const parseResult = useCallback((text: string) => {
    if (text.includes('/join/')) {
      const urlPart = text.split('/join/')[1];
      const [id, query] = urlPart.split('?');
      const params = new URLSearchParams(query || '');
      const mode = (params.get('mode') as BeamMode) || 'direct';
      
      if (navigator.vibrate) navigator.vibrate([50]);
      
      // Attempt to stop, but proceed to callback regardless
      if (scannerRef.current && isScanningRef.current) {
         scannerRef.current.stop().then(() => {
            isScanningRef.current = false;
            onScan(id, mode);
         }).catch(() => {
            // Ignore stop errors on success
            onScan(id, mode);
         });
      } else {
        onScan(id, mode);
      }
    } else {
      setError("Invalid Beam Code. Please scan a valid connection QR.");
      setTimeout(() => setError(null), 3000);
    }
  }, [onScan]);

  // Initialize Scanner Instance
  useEffect(() => {
    const scannerId = "reader-custom";
    if (!document.getElementById(scannerId)) return;

    // Create instance if not exists
    if (!scannerRef.current) {
        try {
            scannerRef.current = new Html5Qrcode(scannerId, {
                formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                verbose: false
            });
        } catch (e) {
            console.error("Failed to create scanner instance", e);
            setError("Scanner initialization failed.");
        }
    }

    // Cleanup on unmount
    return () => {
      if (scannerRef.current && isScanningRef.current) {
        scannerRef.current.stop().then(() => {
            isScanningRef.current = false;
            scannerRef.current?.clear();
        }).catch(err => console.warn("Cleanup stop error:", err));
      }
    };
  }, []);

  // Handle Camera Start/Stop based on tab
  useEffect(() => {
    let isMounted = true;

    const startCamera = async () => {
      if (!scannerRef.current || scanMethod !== 'camera') return;
      if (isScanningRef.current) return; // Already scanning
      
      setIsInitializing(true);
      setError(null);

      try {
        await scannerRef.current.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          (decodedText) => {
            if (isMounted) parseResult(decodedText);
          },
          () => { /* ignore frame errors */ }
        );
        isScanningRef.current = true;
      } catch (err) {
        if (isMounted) {
          console.error("Camera Start Error", err);
          setError("Camera unavailable. Please check permissions or try 'Import Image'.");
        }
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    };

    const stopCamera = async () => {
      if (scannerRef.current && isScanningRef.current) {
        try {
            await scannerRef.current.stop();
            isScanningRef.current = false;
        } catch (e) {
            console.warn("Stop camera failed", e);
        }
      }
    };

    if (scanMethod === 'camera') {
      setTimeout(startCamera, 100);
    } else {
      stopCamera();
    }

    return () => { isMounted = false; };
  }, [scanMethod, parseResult]);

  const handleResetCamera = async () => {
    if (!scannerRef.current) return;
    setError(null);
    setIsInitializing(true);
    try {
      if (isScanningRef.current) {
        await scannerRef.current.stop();
        isScanningRef.current = false;
      }
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (decodedText) => parseResult(decodedText),
        () => {}
      );
      isScanningRef.current = true;
    } catch (err) {
      setError("Failed to reset camera.");
    } finally {
      setIsInitializing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !scannerRef.current) return;
    
    const file = e.target.files[0];
    setIsInitializing(true);
    setError(null);

    // If camera is running, pause it conceptually (though scanFile works alongside, better to handle state)
    const wasScanning = isScanningRef.current;
    const stopPromise = wasScanning ? scannerRef.current.stop() : Promise.resolve();

    stopPromise
      .then(() => {
        isScanningRef.current = false;
        if (!scannerRef.current) throw new Error("Scanner lost");
        return scannerRef.current.scanFile(file, true);
      })
      .then(decodedText => {
        parseResult(decodedText);
      })
      .catch(err => {
        console.warn(err);
        setError("Could not find a valid Beam QR code in this image.");
        // If we stopped the camera to scan file, try to restart it if we are in camera mode? 
        // Actually, user is likely still in 'file' mode or UI state. 
        // We leave it stopped until user switches tab or resets.
      })
      .finally(() => {
        setIsInitializing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      });
  };

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
    <div className="flex-1 flex flex-col items-center gap-6 py-4 animate-in slide-in-from-bottom-8 duration-500 w-full max-w-md mx-auto">
      <div className="text-center space-y-1">
        <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">Scanner</h3>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Connect to Peer</p>
      </div>

      {/* Tabs */}
      <div className="w-full px-4">
        <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-2xl border border-slate-800">
          <button 
            onClick={() => setScanMethod('camera')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              scanMethod === 'camera' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Camera size={14} /> Live Camera
          </button>
          <button 
            onClick={() => setScanMethod('file')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              scanMethod === 'file' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <ImageIcon size={14} /> Import Image
          </button>
        </div>
      </div>
      
      {/* Scanner Area */}
      <div className="w-full px-4 relative">
        <div className="aspect-square bg-slate-950 rounded-[2.5rem] overflow-hidden border border-slate-800 relative shadow-2xl shadow-indigo-500/5 ring-1 ring-white/5">
          
          {/* Hidden div for html5-qrcode library to render into */}
          <div id="reader-custom" className={`${scanMethod === 'camera' ? 'block' : 'hidden'} w-full h-full object-cover`}></div>

          {/* Camera View Overlay */}
          {scanMethod === 'camera' && (
            <>
              {isInitializing && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-20">
                  <Loader2 className="animate-spin text-indigo-500" size={32} />
                </div>
              )}
              
              {!isInitializing && !error && (
                <div className="absolute inset-0 pointer-events-none z-10">
                  {/* Corner Accents */}
                  <div className="absolute top-8 left-8 w-8 h-8 border-l-4 border-t-4 border-indigo-500 rounded-tl-xl opacity-80"></div>
                  <div className="absolute top-8 right-8 w-8 h-8 border-r-4 border-t-4 border-indigo-500 rounded-tr-xl opacity-80"></div>
                  <div className="absolute bottom-8 left-8 w-8 h-8 border-l-4 border-b-4 border-indigo-500 rounded-bl-xl opacity-80"></div>
                  <div className="absolute bottom-8 right-8 w-8 h-8 border-r-4 border-b-4 border-indigo-500 rounded-br-xl opacity-80"></div>
                  {/* Scan Line */}
                  <div className="absolute top-[20%] left-[15%] right-[15%] h-0.5 bg-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.8)] animate-[scan-line_2.5s_infinite]"></div>
                  
                  {/* Floating Reset Button */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-auto">
                    <button 
                      onClick={handleResetCamera}
                      className="flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-slate-300 hover:text-white hover:bg-black/80 transition-all active:scale-95"
                    >
                      <RefreshCw size={12} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Reset Camera</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* File Upload View */}
          {scanMethod === 'file' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 p-8 text-center z-10">
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="group flex flex-col items-center gap-4 w-full h-full justify-center border-2 border-dashed border-slate-700 rounded-3xl hover:border-indigo-500 hover:bg-slate-800/50 transition-all active:scale-95"
              >
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {isInitializing ? (
                    <Loader2 className="animate-spin text-indigo-500" size={32} />
                  ) : (
                    <Upload className="text-slate-400 group-hover:text-indigo-400" size={32} />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-200">Select QR Image</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Tap to browse gallery</p>
                </div>
              </button>
            </div>
          )}

          {/* Error Overlay */}
          {error && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm p-6 text-center animate-in fade-in">
              <AlertCircle size={40} className="text-red-500 mb-4" />
              <p className="text-red-400 font-bold text-sm mb-6">{error}</p>
              <button 
                onClick={() => scanMethod === 'camera' ? handleResetCamera() : setError(null)}
                className="px-6 py-3 bg-red-500/20 text-red-400 border border-red-500/50 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/30 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto w-full px-4 flex flex-col gap-3">
        {scanMethod === 'camera' && !error && (
           <div className="flex items-center gap-2 justify-center text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1">
              <Scan size={12} /> Live Encrypted Viewport
           </div>
        )}
        <button onClick={onCancel} className="w-full py-5 glass-panel text-slate-400 rounded-3xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3 hover:text-white hover:bg-slate-800">
          <X size={16} /> Close Scanner
        </button>
      </div>
    </div>
  );
};

export default QRScanner;