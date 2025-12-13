import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Mic, MicOff, Headphones, HeadphonesOff, Phone, Settings } from 'lucide-react';
import { useVoice } from '@/context/VoiceContext';

export const VoiceControls: React.FC = () => {
  const { state, actions } = useVoice();

  if (!state.currentVoiceChannel) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {/* Mute/Unmute Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={state.isMuted ? "destructive" : "secondary"}
              size="icon"
              onClick={actions.toggleMute}
              className="h-10 w-10"
              disabled={state.isConnecting}
            >
              {state.isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{state.isMuted ? 'Unmute' : 'Mute'} (Ctrl+M)</p>
          </TooltipContent>
        </Tooltip>

        {/* Deafen/Undeafen Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={state.isDeafened ? "destructive" : "secondary"}
              size="icon"
              onClick={actions.toggleDeafen}
              className="h-10 w-10"
              disabled={state.isConnecting}
            >
              {state.isDeafened ? <HeadphonesOff className="h-5 w-5" /> : <Headphones className="h-5 w-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{state.isDeafened ? 'Undeafen' : 'Deafen'} (Ctrl+D)</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-border" />

        {/* Leave Call Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              size="icon"
              onClick={actions.leaveVoiceChannel}
              className="h-10 w-10"
              disabled={state.isConnecting}
            >
              <Phone className="h-5 w-5 transform rotate-135" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Leave Voice Channel</p>
          </TooltipContent>
        </Tooltip>

        {/* Connection Status Indicator */}
        <div className="flex items-center gap-2 ml-2">
          <div className={`w-2 h-2 rounded-full ${
            state.isConnecting ? 'bg-yellow-500 animate-pulse' :
            state.isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-xs text-muted-foreground">
            {state.isConnecting ? 'Connecting...' :
             state.isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
};