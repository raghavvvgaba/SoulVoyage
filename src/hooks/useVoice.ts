import { useCallback } from 'react';
import { useVoice } from '@/context/VoiceContext';
import { VoiceChannel, VoiceParticipant } from '@/types/voice';

export const useVoiceChannel = () => {
  const { state, actions } = useVoice();

  const joinVoiceChannel = useCallback(async (
    channelId: string,
    serverId: string,
    userName: string,
    userAvatar?: string
  ) => {
    await actions.joinVoiceChannel(channelId, serverId, userName, userAvatar);
  }, [actions]);

  const leaveVoiceChannel = useCallback(async () => {
    await actions.leaveVoiceChannel();
  }, [actions]);

  const toggleMute = useCallback(async () => {
    await actions.toggleMute();
  }, [actions]);

  const toggleDeafen = useCallback(async () => {
    await actions.toggleDeafen();
  }, [actions]);

  const isInVoiceChannel = Boolean(state.currentVoiceChannel);
  const isConnecting = state.isConnecting;
  const isConnected = state.isConnected;
  const currentChannel = state.currentVoiceChannel;
  const participants = state.participants;
  const localParticipant = state.localParticipant;
  const isMuted = state.isMuted;
  const isDeafened = state.isDeafened;

  return {
    // State
    isInVoiceChannel,
    isConnecting,
    isConnected,
    currentChannel,
    participants,
    localParticipant,
    isMuted,
    isDeafened,
    error: state.error,
    connectionQuality: state.connectionQuality,

    // Actions
    joinVoiceChannel,
    leaveVoiceChannel,
    toggleMute,
    toggleDeafen,
    updateSettings: actions.updateSettings,
    refreshAudioDevices: actions.refreshAudioDevices,
    clearError: actions.clearError,
  };
};

export const useVoiceSettings = () => {
  const { state, actions } = useVoice();

  return {
    settings: state.settings,
    audioDevices: state.audioDevices,
    updateSettings: actions.updateSettings,
    refreshAudioDevices: actions.refreshAudioDevices,
  };
};

export const useVoiceParticipants = () => {
  const { state } = useVoice();

  const getParticipantById = useCallback((id: string): VoiceParticipant | undefined => {
    return state.participants.find(p => p.id === id);
  }, [state.participants]);

  const getParticipantsExcludingLocal = useCallback((): VoiceParticipant[] => {
    return state.participants.filter(p => p.id !== state.localParticipant?.id);
  }, [state.participants, state.localParticipant]);

  const getSpeakingParticipants = useCallback((): VoiceParticipant[] => {
    return state.participants.filter(p => p.isSpeaking);
  }, [state.participants]);

  const getMutedParticipants = useCallback((): VoiceParticipant[] => {
    return state.participants.filter(p => p.isMuted);
  }, [state.participants]);

  return {
    participants: state.participants,
    localParticipant: state.localParticipant,
    getParticipantById,
    getParticipantsExcludingLocal,
    getSpeakingParticipants,
    getMutedParticipants,
  };
};