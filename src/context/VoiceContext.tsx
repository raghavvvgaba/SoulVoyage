import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { VoiceParticipant, VoiceChannel, VoiceCallSettings, VoiceConnectionQuality } from '@/types/voice';

interface VoiceState {
  currentVoiceChannel: VoiceChannel | null;
  isConnecting: boolean;
  isConnected: boolean;
  participants: VoiceParticipant[];
  localParticipant: VoiceParticipant | null;
  settings: VoiceCallSettings;
  connectionQuality: VoiceConnectionQuality;
  isMuted: boolean;
  isDeafened: boolean;
  audioDevices: MediaDeviceInfo[];
  error: string | null;
}

type VoiceAction =
  | { type: 'SET_CONNECTING'; payload: boolean }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_CURRENT_CHANNEL'; payload: VoiceChannel | null }
  | { type: 'ADD_PARTICIPANT'; payload: VoiceParticipant }
  | { type: 'REMOVE_PARTICIPANT'; payload: string }
  | { type: 'UPDATE_PARTICIPANT'; payload: { id: string; updates: Partial<VoiceParticipant> } }
  | { type: 'SET_PARTICIPANTS'; payload: VoiceParticipant[] }
  | { type: 'SET_LOCAL_PARTICIPANT'; payload: VoiceParticipant }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<VoiceCallSettings> }
  | { type: 'SET_AUDIO_DEVICES'; payload: MediaDeviceInfo[] }
  | { type: 'SET_CONNECTION_QUALITY'; payload: VoiceConnectionQuality }
  | { type: 'SET_MUTED'; payload: boolean }
  | { type: 'SET_DEAFENED'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_STATE' };

const initialState: VoiceState = {
  currentVoiceChannel: null,
  isConnecting: false,
  isConnected: false,
  participants: [],
  localParticipant: null,
  settings: {
    inputVolume: 100,
    outputVolume: 100,
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true,
  },
  connectionQuality: {
    isConnected: false,
    connectionStrength: 'excellent',
    ping: 0,
    packetLoss: 0,
    bitrate: 0,
  },
  isMuted: false,
  isDeafened: false,
  audioDevices: [],
  error: null,
};

function voiceReducer(state: VoiceState, action: VoiceAction): VoiceState {
  switch (action.type) {
    case 'SET_CONNECTING':
      return { ...state, isConnecting: action.payload };
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    case 'SET_CURRENT_CHANNEL':
      return {
        ...state,
        currentVoiceChannel: action.payload,
        participants: action.payload?.participants || [],
      };
    case 'ADD_PARTICIPANT':
      return {
        ...state,
        participants: [...state.participants.filter(p => p.id !== action.payload.id), action.payload]
      };
    case 'REMOVE_PARTICIPANT':
      return {
        ...state,
        participants: state.participants.filter(p => p.id !== action.payload)
      };
    case 'UPDATE_PARTICIPANT':
      return {
        ...state,
        participants: state.participants.map(p =>
          p.id === action.payload.id ? { ...p, ...action.payload.updates } : p
        ),
      };
    case 'SET_PARTICIPANTS':
      return { ...state, participants: action.payload };
    case 'SET_LOCAL_PARTICIPANT':
      return { ...state, localParticipant: action.payload };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'SET_AUDIO_DEVICES':
      return { ...state, audioDevices: action.payload };
    case 'SET_CONNECTION_QUALITY':
      return { ...state, connectionQuality: action.payload };
    case 'SET_MUTED':
      return { ...state, isMuted: action.payload };
    case 'SET_DEAFENED':
      return {
        ...state,
        isDeafened: action.payload,
        // If deafening, also mute
        isMuted: action.payload ? true : state.isMuted,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

interface VoiceContextType {
  state: VoiceState;
  actions: {
    joinVoiceChannel: (channelId: string, serverId: string, userName: string, userAvatar?: string) => Promise<void>;
    leaveVoiceChannel: () => Promise<void>;
    toggleMute: () => Promise<void>;
    toggleDeafen: () => Promise<void>;
    updateSettings: (settings: Partial<VoiceCallSettings>) => void;
    refreshAudioDevices: () => Promise<void>;
    clearError: () => void;
  };
}

const VoiceContext = createContext<VoiceContextType | null>(null);

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
};

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(voiceReducer, initialState);
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        wsRef.current = new WebSocket('ws://localhost:8081');

        wsRef.current.onopen = () => {
          console.log('Voice WebSocket connected');
        };

        wsRef.current.onmessage = async (event) => {
          try {
            const message = JSON.parse(event.data);
            await handleSignalingMessage(message);
          } catch (error) {
            console.error('Error handling voice signaling message:', error);
          }
        };

        wsRef.current.onerror = (error) => {
          console.error('Voice WebSocket error:', error);
          dispatch({ type: 'SET_ERROR', payload: 'Connection error' });
        };

        wsRef.current.onclose = () => {
          console.log('Voice WebSocket disconnected');
          dispatch({ type: 'SET_CONNECTED', payload: false });
          // Attempt to reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };
      } catch (error) {
        console.error('Failed to connect voice WebSocket:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to connect' });
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      // Clean up all peer connections
      peerConnectionsRef.current.forEach(pc => pc.close());
      peerConnectionsRef.current.clear();
    };
  }, []);

  const handleSignalingMessage = async (message: any) => {
    switch (message.type) {
      case 'voice_signal':
        await handleSignalingSignal(message);
        break;
      case 'voice_channel_participants':
        dispatch({ type: 'SET_PARTICIPANTS', payload: message.participants });
        break;
      case 'voice_participant_joined':
        dispatch({ type: 'ADD_PARTICIPANT', payload: message.participant });
        if (message.participant.id !== state.localParticipant?.id) {
          await createPeerConnection(message.participant.id);
        }
        break;
      case 'voice_participant_left':
        dispatch({ type: 'REMOVE_PARTICIPANT', payload: message.participantId });
        await removePeerConnection(message.participantId);
        break;
      case 'voice_participant_updated':
        dispatch({
          type: 'UPDATE_PARTICIPANT',
          payload: { id: message.participantId, updates: message.updates }
        });
        break;
    }
  };

  const createPeerConnection = async (participantId: string) => {
    try {
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          // Add TURN servers here for production
        ],
      };

      const pc = new RTCPeerConnection(configuration);
      peerConnectionsRef.current.set(participantId, pc);

      // Add local stream to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle remote streams
      pc.ontrack = (event) => {
        const remoteStream = event.streams[0];
        const audio = new Audio();
        audio.srcObject = remoteStream;
        audio.play();
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'voice_signal',
            to: participantId,
            signal: {
              type: 'ice-candidate',
              candidate: event.candidate,
            },
            channelId: state.currentVoiceChannel?.id,
          }));
        }
      };

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'voice_signal',
          to: participantId,
          signal: {
            type: 'offer',
            offer: offer,
          },
          channelId: state.currentVoiceChannel?.id,
        }));
      }
    } catch (error) {
      console.error('Error creating peer connection:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to establish connection' });
    }
  };

  const removePeerConnection = async (participantId: string) => {
    const pc = peerConnectionsRef.current.get(participantId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(participantId);
    }
  };

  const handleSignalingSignal = async (message: any) => {
    const { from, signal } = message;
    let pc = peerConnectionsRef.current.get(from);

    if (!pc && signal.type === 'offer') {
      await createPeerConnection(from);
      pc = peerConnectionsRef.current.get(from);
    }

    if (!pc) return;

    try {
      if (signal.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'voice_signal',
            to: from,
            signal: {
              type: 'answer',
              answer: answer,
            },
            channelId: state.currentVoiceChannel?.id,
          }));
        }
      } else if (signal.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
      } else if (signal.type === 'ice-candidate') {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    } catch (error) {
      console.error('Error handling signaling signal:', error);
    }
  };

  const actions = {
    joinVoiceChannel: async (channelId: string, serverId: string, userName: string, userAvatar?: string) => {
      try {
        dispatch({ type: 'SET_CONNECTING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            noiseSuppression: state.settings.noiseSuppression,
            echoCancellation: state.settings.echoCancellation,
            autoGainControl: state.settings.autoGainControl,
          },
          video: false,
        });

        localStreamRef.current = stream;

        // Create local participant
        const localParticipant: VoiceParticipant = {
          id: `local_${Date.now()}`,
          name: userName,
          avatar: userAvatar,
          isMuted: state.isMuted,
          isDeafened: state.isDeafened,
          isSpeaking: false,
          audioLevel: 0,
          joinedAt: Date.now(),
        };

        dispatch({ type: 'SET_LOCAL_PARTICIPANT', payload: localParticipant });

        // Join voice channel via WebSocket
        if (wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'voice_channel_join',
            channelId,
            serverId,
            participant: localParticipant,
          }));
        }

        // Set current voice channel
        const voiceChannel: VoiceChannel = {
          id: channelId,
          serverId,
          name: `Voice Channel ${channelId}`,
          participants: [localParticipant],
          isActive: true,
        };

        dispatch({ type: 'SET_CURRENT_CHANNEL', payload: voiceChannel });
        dispatch({ type: 'SET_CONNECTED', payload: true });
        dispatch({ type: 'SET_CONNECTING', payload: false });

        // Apply mute state to local stream
        if (state.isMuted) {
          stream.getAudioTracks().forEach(track => track.enabled = false);
        }
      } catch (error) {
        console.error('Error joining voice channel:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to join voice channel' });
        dispatch({ type: 'SET_CONNECTING', payload: false });
      }
    },

    leaveVoiceChannel: async () => {
      try {
        // Stop local stream
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => track.stop());
          localStreamRef.current = null;
        }

        // Close all peer connections
        peerConnectionsRef.current.forEach(pc => pc.close());
        peerConnectionsRef.current.clear();

        // Leave voice channel via WebSocket
        if (wsRef.current && state.currentVoiceChannel) {
          wsRef.current.send(JSON.stringify({
            type: 'voice_channel_leave',
            channelId: state.currentVoiceChannel.id,
            participantId: state.localParticipant?.id,
          }));
        }

        // Reset state
        dispatch({ type: 'RESET_STATE' });
      } catch (error) {
        console.error('Error leaving voice channel:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to leave voice channel' });
      }
    },

    toggleMute: async () => {
      const newMutedState = !state.isMuted;

      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(track => {
          track.enabled = !newMutedState;
        });
      }

      dispatch({ type: 'SET_MUTED', payload: newMutedState });

      // Update local participant in channel
      if (state.localParticipant && wsRef.current && state.currentVoiceChannel) {
        wsRef.current.send(JSON.stringify({
          type: 'voice_participant_update',
          channelId: state.currentVoiceChannel.id,
          participantId: state.localParticipant.id,
          updates: { isMuted: newMutedState },
        }));
      }
    },

    toggleDeafen: async () => {
      const newDeafenedState = !state.isDeafened;

      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(track => {
          track.enabled = !newDeafenedState;
        });
      }

      dispatch({ type: 'SET_DEAFENED', payload: newDeafenedState });

      // Update local participant in channel
      if (state.localParticipant && wsRef.current && state.currentVoiceChannel) {
        wsRef.current.send(JSON.stringify({
          type: 'voice_participant_update',
          channelId: state.currentVoiceChannel.id,
          participantId: state.localParticipant.id,
          updates: { isMuted: newDeafenedState, isDeafened: newDeafenedState },
        }));
      }
    },

    updateSettings: (settings: Partial<VoiceCallSettings>) => {
      dispatch({ type: 'UPDATE_SETTINGS', payload: settings });

      // Apply audio settings to local stream if needed
      if (localStreamRef.current && (settings.noiseSuppression !== undefined ||
          settings.echoCancellation !== undefined ||
          settings.autoGainControl !== undefined)) {
        // Note: Changing these constraints requires restarting the audio stream
        // This is a simplified implementation
        console.log('Audio settings updated:', settings);
      }
    },

    refreshAudioDevices: async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        dispatch({ type: 'SET_AUDIO_DEVICES', payload: audioInputs });
      } catch (error) {
        console.error('Error refreshing audio devices:', error);
      }
    },

    clearError: () => {
      dispatch({ type: 'SET_ERROR', payload: null });
    },
  };

  // Get audio devices on mount
  useEffect(() => {
    actions.refreshAudioDevices();
  }, []);

  return (
    <VoiceContext.Provider value={{ state, actions }}>
      {children}
    </VoiceContext.Provider>
  );
};