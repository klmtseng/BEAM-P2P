
import React, { useState, useRef, useEffect } from 'react';
import { Message, MessageType, BeamMode } from '../types';
import { Send, Sparkles, Zap, Loader2, Paperclip, Download, File as FileIcon, Users, Lock, ShieldCheck } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface ChatRoomProps {
  messages: Message[];
  onSendMessage: (content: string, type: MessageType, fileName?: string, fileSize?: string) => void;
  remoteId: string;
  participantCount?: number;
  mode: BeamMode;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ messages, onSendMessage, remoteId, participantCount = 1, mode }) => {
  const [input, setInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) { onSendMessage(input.trim(), 'text'); setInput(''); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingFile(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const type: MessageType = file.type.startsWith('image/') ? 'image' : 'file';
      onSendMessage(content, type, file.name, (file.size / 1024).toFixed(1) + ' KB');
      setIsProcessingFile(false);
    };
    reader.readAsDataURL(file);
  };

  const generateAiReply = async () => {
    if (!input.trim() && messages.length === 0) return;
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: input.trim() ? `Refine this message: ${input}` : "Generate a P2P greeting.",
        config: { systemInstruction: "Be concise and tech-savvy." }
      });
      setInput(response.text || '');
    } catch (err) {
      console.error(err);
    } finally { setIsAiLoading(false); }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-140px)]">
      <div className={`px-4 py-3 bg-slate-900/50 rounded-[2rem] flex items-center justify-between border ${mode === 'direct' ? 'border-emerald-500/20' : 'border-indigo-500/20'} mb-4`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl ${mode === 'direct' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'} flex items-center justify-center border border-current/20`}>
            {mode === 'direct' ? <Lock size={20} /> : <Users size={20} />}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black text-white uppercase tracking-wider">{mode === 'direct' ? 'Private' : 'Group'} Beam</span>
            <span className={`text-[9px] font-bold ${mode === 'direct' ? 'text-emerald-400' : 'text-indigo-400'}`}>{mode === 'direct' ? 'Direct Pairing' : `${participantCount} Peers Joined`}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 px-3 py-1 bg-black/30 rounded-full border border-white/5">
          <ShieldCheck size={10} className="text-emerald-500" />
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">E2EE Active</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar pb-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-800 gap-2 opacity-30">
            <Zap size={48} />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Channel Open</p>
          </div>
        ) : messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.senderName === 'Me' ? 'items-end' : 'items-start'}`}>
             <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1 px-2">{msg.senderName}</span>
             <div className={`max-w-[85%] rounded-2xl p-4 text-sm ${msg.senderName === 'Me' ? (mode === 'direct' ? 'bg-emerald-600' : 'bg-indigo-600') : 'bg-slate-800'}`}>
                {msg.type === 'text' && msg.content}
                {msg.type === 'image' && <img src={msg.content} className="rounded-xl max-h-64" />}
                {msg.type === 'file' && (
                  <div className="flex items-center gap-3">
                    <FileIcon size={20} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-bold">{msg.fileName}</p>
                      <p className="text-[10px] opacity-50">{msg.fileSize}</p>
                    </div>
                    <a href={msg.content} download={msg.fileName} className="p-2 bg-white/10 rounded-lg"><Download size={16} /></a>
                  </div>
                )}
             </div>
          </div>
        ))}
      </div>

      <div className="pt-4 space-y-3">
        <div className="flex gap-2">
          <button onClick={generateAiReply} disabled={isAiLoading} className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 text-slate-400 rounded-2xl border border-slate-800 text-[10px] font-black uppercase tracking-widest hover:text-indigo-400 disabled:opacity-50">
            {isAiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} className="text-indigo-500" />} AI Assist
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="px-5 py-3 bg-slate-900 text-slate-400 rounded-2xl border border-slate-800 hover:text-indigo-400">
            <Paperclip size={18} />
          </button>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        <form onSubmit={handleSubmit} className="relative">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Secure message..." className="w-full bg-slate-900 border-2 border-slate-800 rounded-3xl pl-5 pr-16 py-4 text-sm text-slate-100 focus:outline-none focus:border-indigo-500/50 transition-all" />
          <button type="submit" disabled={!input.trim()} className={`absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center ${mode === 'direct' ? 'bg-emerald-600' : 'bg-indigo-600'} text-white rounded-2xl active:scale-95 disabled:opacity-20`}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;
