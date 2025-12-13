import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Settings, X, Wifi, WifiOff, Users, Volume2, VolumeX } from 'lucide-react';
import { useVoice } from '@/context/VoiceContext';
import { AudioSettings } from './AudioSettings';

export const VoiceCallPanel: React.FC = () => {
  const { state } = useVoice();
  const [showSettings, setShowSettings] = useState(false);

  if (!state.currentVoiceChannel) {
    return null;
  }

  const getConnectionQualityColor = (strength: string) => {
    switch (strength) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-yellow-500';
      case 'fair': return 'text-orange-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getConnectionQualityText = (strength: string) => {
    switch (strength) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'fair': return 'Fair';
      case 'poor': return 'Poor';
      default: return 'Unknown';
    }
  };

  return (
    <div className="bg-card/90 backdrop-blur-sm border-t border-border p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-green-500" />
              <h3 className="font-semibold">{state.currentVoiceChannel.name}</h3>
            </div>
            <Badge variant="secondary" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              {state.participants.length}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* Connection Quality */}
            <div className="flex items-center gap-1 text-sm">
              {state.connectionQuality.isConnected ? (
                <Wifi className={`h-4 w-4 ${getConnectionQualityColor(state.connectionQuality.connectionStrength)}`} />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-xs ${getConnectionQualityColor(state.connectionQuality.connectionStrength)}`}>
                {getConnectionQualityText(state.connectionQuality.connectionStrength)}
              </span>
              {state.connectionQuality.ping > 0 && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({state.connectionQuality.ping}ms)
                </span>
              )}
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Settings Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              className="h-8 w-8"
            >
              <Settings className="h-4 w-4" />
            </Button>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {/* Handle close */}}
              className="h-8 w-8 text-red-500 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Participants List */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Participants</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {state.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex flex-col items-center p-3 bg-accent/20 rounded-lg"
                >
                  <div className="relative mb-2">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={participant.avatar} />
                      <AvatarFallback>
                        {participant.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Status Indicators */}
                    <div className="absolute -bottom-1 -right-1 flex gap-1">
                      {participant.isMuted && (
                        <div className="bg-red-500 rounded-full p-1">
                          <VolumeX className="h-3 w-3 text-white" />
                        </div>
                      )}
                      {participant.isDeafened && (
                        <div className="bg-orange-500 rounded-full p-1">
                          <VolumeX className="h-3 w-3 text-white" />
                        </div>
                      )}
                      {participant.isSpeaking && (
                        <div className="bg-green-500 rounded-full p-1 animate-pulse">
                          <Volume2 className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="text-sm font-medium text-center truncate w-full">
                    {participant.name}
                  </span>

                  {/* Audio Level Indicator */}
                  {participant.audioLevel > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                      <div
                        className="bg-green-500 h-1 rounded-full transition-all duration-100"
                        style={{ width: `${participant.audioLevel}%` }}
                      />
                    </div>
                  )}

                  {/* Local Badge */}
                  {state.localParticipant?.id === participant.id && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      You
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Connection Info & Settings */}
          <div className="space-y-4">
            {/* Connection Details */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Connection Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={state.isConnected ? 'text-green-500' : 'text-red-500'}>
                    {state.isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                {state.connectionQuality.ping > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ping:</span>
                    <span>{state.connectionQuality.ping}ms</span>
                  </div>
                )}
                {state.connectionQuality.packetLoss > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Packet Loss:</span>
                    <span>{state.connectionQuality.packetLoss}%</span>
                  </div>
                )}
                {state.connectionQuality.bitrate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bitrate:</span>
                    <span>{state.connectionQuality.bitrate} kbps</span>
                  </div>
                )}
              </div>
            </div>

            {/* Audio Settings Quick Toggle */}
            {showSettings && (
              <AudioSettings onClose={() => setShowSettings(false)} />
            )}
          </div>
        </div>

        {/* Error Display */}
        {state.error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-500">{state.error}</p>
          </div>
        )}
      </div>
    </div>
  );
};