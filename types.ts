
export type MessageType = 'text' | 'image' | 'file' | 'system' | 'ai';
export type BeamMode = 'direct' | 'group';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  fileName?: string;
  fileSize?: string;
  timestamp: number;
  type: MessageType;
}

export interface Conversation {
  peerId: string;
  name: string;
  messages: Message[];
  participants: string[];
  lastActivity: number;
  isHost: boolean;
  mode: BeamMode;
}

export enum AppState {
  HOME = 'HOME',
  HOSTING = 'HOSTING',
  SCANNING = 'SCANNING',
  CHAT = 'CHAT'
}
