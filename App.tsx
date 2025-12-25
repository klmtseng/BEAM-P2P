
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Peer, DataConnection } from 'peerjs';
import { AppState, Message, MessageType, Conversation, BeamMode } from './types';
import Header from './components/Header';
import QRGenerator from './components/QRGenerator';
import QRScanner from './components/QRScanner';
import ChatRoom from './components/ChatRoom';
import { Scan, AlertTriangle, Wifi, MessageSquare, Trash2, Lock, Radio, Users, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.HOME);
  const [peerId, setPeerId] = useState<string>('');
  const [conversations, setConversations] = useState<Map<string, Conversation>>(new Map());
  const [activePeerId, setActivePeerId] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<BeamMode>('direct');
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isServerOnline, setIsServerOnline] = useState(false);
  
  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<Map<string, { conn: DataConnection, mode: BeamMode }>>(new Map());

  const activeConv = activePeerId ? (conversations.get(activePeerId) as Conversation | undefined) : null;

  const setupConnection = useCallback((c: DataConnection, IAmHost: boolean, mode: BeamMode) => {
    c.on('open', () => {
      connectionsRef.current.set(c.peer, { conn: c, mode });

      setConversations(prev => {
        const next = new Map(prev);
        const roomId = (IAmHost && mode === 'group') ? 'GROUP_BEAM' : c.peer;
        
        if (!next.has(roomId)) {
          next.set(roomId, {
            peerId: roomId,
            name: mode === 'group' ? (IAmHost ? 'My Group Beam' : 'Secure Group') : 'Direct Tunnel',
            messages: [],
            participants: [c.peer],
            lastActivity: Date.now(),
            isHost: IAmHost,
            mode: mode
          });
        } else if (mode === 'group') {
          const conv = next.get(roomId) as Conversation;
          if (!conv.participants.includes(c.peer)) {
            next.set(roomId, { ...conv, participants: [...conv.participants, c.peer], lastActivity: Date.now() });
          }
        }
        return next;
      });

      const targetRoom = (IAmHost && mode === 'group') ? 'GROUP_BEAM' : c.peer;
      setActivePeerId(targetRoom);
      setAppState(AppState.CHAT);
      setIsConnecting(false);
      setError(null);
    });

    c.on('data', (data: any) => {
      if (data.type === 'message') {
        const incomingMsg = data.payload;
        
        // Host-side relay logic for groups
        if (IAmHost && mode === 'group') {
          connectionsRef.current.forEach(({ conn, mode: connMode }) => {
            if (conn.peer !== c.peer && conn.open && connMode === 'group') {
              conn.send({ type: 'message', payload: incomingMsg });
            }
          });
        }

        setConversations(prev => {
          const next = new Map(prev);
          const roomId = (IAmHost && mode === 'group') ? 'GROUP_BEAM' : c.peer;
          const conv = next.get(roomId) as Conversation | undefined;
          if (conv) {
            next.set(roomId, { ...conv, messages: [...conv.messages, incomingMsg], lastActivity: Date.now() });
          }
          return next;
        });
      }
    });

    const closeHandler = () => {
      connectionsRef.current.delete(c.peer);
      // Optional: Update conversation status to "disconnected"
    };

    c.on('close', closeHandler);
    c.on('error', closeHandler);
  }, []);

  const initPeer = useCallback(() => {
    if (peerRef.current && !peerRef.current.destroyed) return peerRef.current;
    
    const newPeer = new Peer({
      debug: 1,
      config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] }
    });
    
    peerRef.current = newPeer;
    
    newPeer.on('open', (id) => { setPeerId(id); setIsServerOnline(true); });
    newPeer.on('connection', (c) => {
      const incomingMode = (c.metadata?.mode as BeamMode) || 'direct';
      setupConnection(c, true, incomingMode);
    });
    newPeer.on('disconnected', () => {
      setIsServerOnline(false);
      setTimeout(() => peerRef.current?.reconnect(), 3000);
    });
    newPeer.on('error', (err) => {
      if (err.type === 'peer-unavailable') {
        setError("Beam Target is offline.");
        setIsConnecting(false);
      }
    });

    return newPeer;
  }, [setupConnection]);

  const connectToPeer = useCallback((remoteId: string, mode: BeamMode = 'direct') => {
    if (!remoteId || isConnecting) return;
    
    if (connectionsRef.current.has(remoteId)) {
      setActivePeerId(remoteId);
      setAppState(AppState.CHAT);
      return;
    }
    
    setIsConnecting(true);
    const p = initPeer();
    // Handshake via metadata
    const c = p.connect(remoteId, { reliable: true, metadata: { mode } });
    setupConnection(c, false, mode);

    setTimeout(() => {
      if (isConnecting) {
        setIsConnecting(false);
        setError("Connection attempt timed out.");
      }
    }, 12000);
  }, [initPeer, setupConnection, isConnecting]);

  const handleSendMessage = useCallback((content: string, type: MessageType = 'text', fileName?: string, fileSize?: string) => {
    if (!activePeerId || !peerId) return;

    const newMessage: Message = {
      id: crypto.randomUUID(),
      senderId: peerId,
      senderName: 'Me',
      content,
      timestamp: Date.now(),
      type,
      fileName,
      fileSize
    };

    setConversations(prev => {
      const next = new Map(prev);
      const conv = next.get(activePeerId) as Conversation | undefined;
      if (conv) {
        next.set(activePeerId, { ...conv, messages: [...conv.messages, newMessage], lastActivity: Date.now() });
      }
      return next;
    });

    if (activeConv?.mode === 'group' && activeConv?.isHost) {
      connectionsRef.current.forEach(({ conn, mode }) => {
        if (conn.open && mode === 'group') conn.send({ type: 'message', payload: newMessage });
      });
    } else {
      const entry = connectionsRef.current.get(activePeerId);
      if (entry?.conn.open) entry.conn.send({ type: 'message', payload: newMessage });
    }
  }, [activePeerId, activeConv, peerId]);

  useEffect(() => {
    initPeer();
    const handleRoute = () => {
      const hash = window.location.hash;
      if (hash.includes('/join/')) {
        const urlStr = hash.substring(hash.indexOf('/join/') + 6);
        const [id, query] = urlStr.split('?');
        const params = new URLSearchParams(query || '');
        const mode = (params.get('mode') as BeamMode) || 'direct';
        if (id) connectToPeer(id, mode);
      }
    };
    handleRoute();
    window.addEventListener('hashchange', handleRoute);
    return () => window.removeEventListener('hashchange', handleRoute);
  }, [connectToPeer, initPeer]);

  const removeConversation = (id: string) => {
    const entry = connectionsRef.current.get(id);
    if (entry) entry.conn.close();
    setConversations(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
    if (activePeerId === id) setActivePeerId(null);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-indigo-500/30">
      <div className="max-w-md mx-auto px-6 flex flex-col min-h-screen">
        <Header onBack={appState !== AppState.HOME ? () => setAppState(AppState.HOME) : undefined} />
        
        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-500" size={18} />
              <span className="text-[10px] font-black text-red-200 uppercase tracking-tight">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-500/50 hover:text-red-500 uppercase text-[9px] font-black">Close</button>
          </div>
        )}

        {appState === AppState.CHAT && activeConv ? (
          <ChatRoom 
            messages={activeConv.messages} 
            onSendMessage={handleSendMessage} 
            remoteId={activeConv.peerId}
            participantCount={activeConv.participants.length}
            mode={activeConv.mode}
          />
        ) : appState === AppState.HOSTING ? (
          <QRGenerator peerId={peerId} mode={selectedMode} />
        ) : appState === AppState.SCANNING ? (
          <QRScanner onScan={connectToPeer} onCancel={() => setAppState(AppState.HOME)} isConnecting={isConnecting} />
        ) : (
          <div className="flex-1 flex flex-col py-6 gap-8 animate-in fade-in duration-700">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                 <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase">Beam Hub</h1>
                 {isServerOnline ? <Wifi size={16} className="text-emerald-500 animate-pulse" /> : <Loader2 size={16} className="text-slate-600 animate-spin" />}
              </div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Private Device Relay</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => { setSelectedMode('direct'); setAppState(AppState.HOSTING); }} className="group bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] flex flex-col items-center gap-3 hover:border-emerald-500/50 active:scale-95 transition-all">
                <div className="bg-emerald-500/10 p-4 rounded-2xl text-emerald-500 group-hover:scale-110 transition-transform"><Lock size={28} /></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white">Private Tunnel</span>
              </button>
              <button onClick={() => { setSelectedMode('group'); setAppState(AppState.HOSTING); }} className="group bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] flex flex-col items-center gap-3 hover:border-indigo-500/50 active:scale-95 transition-all">
                <div className="bg-indigo-500/10 p-4 rounded-2xl text-indigo-500 group-hover:scale-110 transition-transform"><Radio size={28} /></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white">Group Beam</span>
              </button>
            </div>

            <div className="space-y-3">
              <h2 className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">Recent Sessions</h2>
              {conversations.size === 0 ? (
                <div className="py-12 bg-slate-900/20 border-2 border-dashed border-slate-800/50 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 text-slate-800">
                  <MessageSquare size={32} />
                  <p className="text-[9px] font-black uppercase tracking-widest text-center">No Active Tunnels</p>
                </div>
              ) : (
                (Array.from(conversations.values()) as Conversation[])
                  .sort((a, b) => b.lastActivity - a.lastActivity)
                  .map((conv) => (
                    <div key={conv.peerId} className="group relative">
                      <button onClick={() => { setActivePeerId(conv.peerId); setAppState(AppState.CHAT); }} className="w-full bg-slate-900/50 hover:bg-slate-900 border border-slate-800 p-5 rounded-3xl flex items-center gap-4 transition-all active:scale-[0.98]">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${conv.mode === 'group' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          {conv.mode === 'group' ? <Users size={22} /> : <Lock size={22} />}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-sm font-black text-white">{conv.name}</div>
                          <div className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">{conv.mode === 'group' ? `${conv.participants.length} Active` : 'Encrypted Pairing'}</div>
                        </div>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); removeConversation(conv.peerId); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                    </div>
                  ))
              )}
            </div>

            <button onClick={() => setAppState(AppState.SCANNING)} className="mt-auto w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/30 active:scale-95 transition-all">
              <Scan size={20} />
              Pair Device
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
