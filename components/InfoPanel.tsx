import React from 'react';
import { Shield, Zap, Globe, Cpu, Github, MessageSquare } from 'lucide-react';

interface InfoPanelProps {
  className?: string;
  onClose?: () => void;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ className = '', onClose }) => {
  return (
    <div className={`flex flex-col h-full bg-slate-900/50 backdrop-blur-xl border-r border-white/5 overflow-y-auto custom-scrollbar ${className}`}>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-400">
            <Cpu size={24} />
            <span className="text-xs font-black uppercase tracking-[0.2em]">System Architecture</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tighter">About BEAM</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            A serverless, decentralized messaging tool. Data travels directly between devices.
            <br />
            無伺服器、去中心化的傳訊工具。資料直接在裝置間點對點傳輸。
          </p>
        </div>

        {/* How to Use */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Zap size={16} className="text-yellow-400" /> 
            Usage / 使用方法
          </h3>
          
          <div className="grid gap-4">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <span className="text-xs font-bold text-indigo-400 block mb-1">STEP 01</span>
              <p className="text-sm text-slate-200 font-medium mb-1">Initialize Host</p>
              <p className="text-xs text-slate-400">Open BEAM on Device A. Use "SMS Invite" to send the link to a friend.</p>
              <div className="mt-2 pt-2 border-t border-white/5">
                <p className="text-sm text-slate-200 font-medium mb-1">建立主機</p>
                <p className="text-xs text-slate-400">開啟 BEAM，可使用「SMS Invite」將連結透過簡訊傳送給朋友。</p>
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <span className="text-xs font-bold text-emerald-400 block mb-1">STEP 02</span>
              <p className="text-sm text-slate-200 font-medium mb-1">Connect Peer</p>
              <p className="text-xs text-slate-400">Open BEAM on Device B, click "Scan", or click the SMS link received.</p>
              <div className="mt-2 pt-2 border-t border-white/5">
                <p className="text-sm text-slate-200 font-medium mb-1">連接裝置</p>
                <p className="text-xs text-slate-400">點擊「掃描」或直接點擊收到的簡訊連結即可加入。</p>
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <span className="text-xs font-bold text-pink-400 block mb-1">STEP 03</span>
              <p className="text-sm text-slate-200 font-medium mb-1">Secure Chat & SMS Fallback</p>
              <p className="text-xs text-slate-400">Tunnel is encrypted. If offline, use the SMS icon to send text via carrier.</p>
              <div className="mt-2 pt-2 border-t border-white/5">
                <p className="text-sm text-slate-200 font-medium mb-1">安全傳輸與簡訊備援</p>
                <p className="text-xs text-slate-400">通道為加密狀態。若對方離線，可點擊 SMS 圖示改用手機簡訊發送。</p>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Principles */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Shield size={16} className="text-emerald-400" /> 
            Principles / 技術原理
          </h3>
          <ul className="space-y-3">
            <li className="flex gap-3 text-xs text-slate-400 leading-relaxed">
              <Globe size={16} className="shrink-0 text-indigo-500" />
              <span>
                <strong className="text-slate-200">WebRTC:</strong> Direct browser-to-browser data tunnel.<br/>
                瀏覽器間直接的資料通道。
              </span>
            </li>
            <li className="flex gap-3 text-xs text-slate-400 leading-relaxed">
              <MessageSquare size={16} className="shrink-0 text-indigo-500" />
              <span>
                <strong className="text-slate-200">SMS URI Scheme:</strong><br/>
                Uses `sms:` protocol to invoke native messaging apps for invitations or offline fallback.<br/>
                利用 `sms:` 協議喚起原生簡訊 App 進行邀請或離線傳訊。
              </span>
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="pt-8 mt-auto border-t border-white/5 flex flex-col gap-4">
           <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-xs font-bold text-white uppercase tracking-wider">
             <Github size={16} /> View Source Code
           </a>
           <p className="text-[10px] text-slate-600 text-center">
             NO HISTORY • NO CLOUD • NO AI
           </p>
        </div>
      </div>
      
      {/* Mobile Close Button */}
      {onClose && (
        <button onClick={onClose} className="md:hidden absolute top-4 right-4 p-2 bg-slate-800 rounded-full text-white">
          ✕
        </button>
      )}
    </div>
  );
};

export default InfoPanel;