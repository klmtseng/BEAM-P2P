import React, { useState, useRef, useEffect } from 'react';
import { Message, MessageType, BeamMode } from '../types';
import { Send, Zap, Paperclip, Download, File as FileIcon, Users, Lock, ShieldCheck, ShieldAlert } from 'lucide-react';

interface ChatRoomProps {
  messages: Message[];
  onSendMessage: (content: string, type: MessageType, fileName?: string, fileSize?: string) => void;
  remoteId: string;
  participantCount?: number;
  mode: BeamMode;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ messages, onSendMessage, remoteId, participantCount = 1, mode }) => {
  const [input, setInput] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { 
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) { 
      onSendMessage(input.trim(), 'text'); 
      setInput(''); 
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 25 * 1024 * 1024) {
      alert("P2P Limit: Files over 25MB may fail in browser-based WebRTC tunnels.");
      return;
    }

    setIsProcessingFile(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const type: MessageType = file.type.startsWith('image/') ? 'image' : 'file';
      onSendMessage(content, type, file.name, (file.size / 1024).toFixed(1) + ' KB');
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 py-2">
      {/* Status Bar */}
      <div className={`px-4 py-3 glass-panel rounded-[2rem] flex items-center justify-between border ${mode === 'direct' ? 'border-emerald-500/20' : 'border-indigo-500/20'} mb-4 shadow-xl`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl ${mode === 'direct' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'} flex items-center justify-center border border-white/5`}>
            {mode === 'direct' ? <Lock size={20} /> : <Users size={20} />}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black text-white uppercase tracking-wider">{mode === 'direct' ? 'Private' : 'Group'} Beam</span>
            <span className={`text-[9px] font-bold ${mode === 'direct' ? 'text-emerald-400' : 'text-indigo-400'} uppercase tracking-tighter`}>
              {mode === 'direct' ? 'Active Tunnel' : `${participantCount} Peers Joined`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 px-3 py-1 bg-black/20 rounded-full border border-white/5">
          <ShieldCheck size={10} className="text-emerald-500" />
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">P2P Secure</span>
        </div>
      </div>

      {/* Message Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar pb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-800 gap-2 opacity-20">
            <Zap size={48} />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Direct Data Stream Open</p>
          </div>
        ) : messages.map((msg) => {
          if (msg.type === 'system') {
            return (
              <div key={msg.id} className="flex justify-center py-2">
                <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-900/40 rounded-full border border-white/5">
                  <ShieldAlert size={10} className="text-indigo-400" />
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{msg.content}</span>
                </div>
              </div>
            );
          }
          
          const isMe = msg.senderName === 'Me';
          
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
               <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1 px-3">{msg.senderName}</span>
               <div className={`max-w-[85%] rounded-[1.5rem] p-4 text-sm ${isMe ? (mode === 'direct' ? 'bg-emerald-600 shadow-emerald-900/20' : 'bg-indigo-600 shadow-indigo-900/20') : 'glass-panel'} shadow-lg`}>
                  {msg.type === 'text' && <p className="leading-relaxed break-words font-medium">{msg.content}</p>}
                  {msg.type === 'image' && (
                    <div className="rounded-xl overflow-hidden border border-white/10">
                      <img src={msg.content} alt="Shared" className="w-full h-auto max-h-64 object-contain bg-black/40" />
                    </div>
                  )}
                  {msg.type === 'file' && (
                    <div className="flex items-center gap-3">
                      <div className="bg-black/20 p-2.5 rounded-xl border border-white/5"><FileIcon size={20} className="text-white/60" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-bold text-xs text-white">{msg.fileName}</p>
                        <p className="text-[9px] opacity-60 uppercase font-black text-white/40">{msg.fileSize}</p>
                      </div>
                      <a href={msg.content} download={msg.fileName} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                        <Download size={16} />
                      </a>
                    </div>
                  )}
               </div>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="pt-2 pb-6 space-y-3">
        <button 
          onClick={() => fileInputRef.current?.click()} 
          disabled={isProcessingFile}
          className="w-full flex items-center justify-center gap-2 py-3.5 glass-panel text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:text-indigo-400 disabled:opacity-50 transition-all active:scale-95 shadow-2xl"
        >
          <Paperclip size={14} /> {isProcessingFile ? 'Syncing...' : 'Share File / Media'}
        </button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        <form onSubmit={handleSubmit} className="relative">
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder="Write data directly..." 
            className="w-full bg-slate-900/80 border-2 border-slate-800/50 rounded-3xl pl-5 pr-14 py-4 text-sm text-slate-100 focus:outline-none focus:border-indigo-500/50 transition-all shadow-xl placeholder:text-slate-700" 
          />
          <button 
            type="submit" 
            disabled={!input.trim()} 
            className={`absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center ${mode === 'direct' ? 'bg-emerald-600' : 'bg-indigo-600'} text-white rounded-2xl active:scale-95 disabled:opacity-10 transition-all shadow-lg shadow-black/40`}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;