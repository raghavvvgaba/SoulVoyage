export interface VoiceParticipant {
  id: string;
  name: string;
  avatar?: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  joinedAt: number;
}

export interface VoiceChannel {
  id: string;
  serverId: string;
  name: string;
  participants: VoiceParticipant[];
  isActive: boolean;
}

export interface VoiceCallSettings {
  inputDeviceId?: string;
  outputDeviceId?: string;
  inputVolume: number;
  outputVolume: number;
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
}

export interface VoiceConnectionQuality {
  isConnected: boolean;
  connectionStrength: 'excellent' | 'good' | 'fair' | 'poor';
  ping: number;
  packetLoss: number;
  bitrate: number;
}