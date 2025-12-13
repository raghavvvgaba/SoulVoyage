import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Settings, RotateCcw, Mic, Headphones } from 'lucide-react';
import { useVoice } from '@/context/VoiceContext';

interface AudioSettingsProps {
  onClose: () => void;
}

export const AudioSettings: React.FC<AudioSettingsProps> = ({ onClose }) => {
  const { state, actions } = useVoice();
  const [localSettings, setLocalSettings] = useState(state.settings);

  useEffect(() => {
    setLocalSettings(state.settings);
  }, [state.settings]);

  const handleSave = () => {
    actions.updateSettings(localSettings);
    onClose();
  };

  const handleInputChange = (key: string, value: number | string | boolean) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleRefreshDevices = async () => {
    await actions.refreshAudioDevices();
  };

  const handleReset = () => {
    setLocalSettings({
      inputVolume: 100,
      outputVolume: 100,
      noiseSuppression: true,
      echoCancellation: true,
      autoGainControl: true,
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Voice & Video Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Input Device Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Mic className="h-4 w-4" />
              Input Device
            </Label>
            <div className="flex gap-2">
              <Select
                value={localSettings.inputDeviceId}
                onValueChange={(value) => handleInputChange('inputDeviceId', value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select microphone" />
                </SelectTrigger>
                <SelectContent>
                  {state.audioDevices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefreshDevices}
                title="Refresh devices"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Output Device Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Headphones className="h-4 w-4" />
              Output Device
            </Label>
            <Select
              value={localSettings.outputDeviceId}
              onValueChange={(value) => handleInputChange('outputDeviceId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select speakers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default Device</SelectItem>
                {/* Output devices would be listed here */}
              </SelectContent>
            </Select>
          </div>

          {/* Input Volume */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Input Volume</Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[localSettings.inputVolume]}
                onValueChange={([value]) => handleInputChange('inputVolume', value)}
                max={150}
                step={1}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-12 text-right">
                {localSettings.inputVolume}%
              </span>
            </div>
          </div>

          {/* Output Volume */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Output Volume</Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[localSettings.outputVolume]}
                onValueChange={([value]) => handleInputChange('outputVolume', value)}
                max={150}
                step={1}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-12 text-right">
                {localSettings.outputVolume}%
              </span>
            </div>
          </div>

          {/* Audio Processing Options */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Audio Processing</Label>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-normal">Noise Suppression</Label>
                <p className="text-xs text-muted-foreground">
                  Reduce background noise
                </p>
              </div>
              <Switch
                checked={localSettings.noiseSuppression}
                onCheckedChange={(checked) => handleInputChange('noiseSuppression', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-normal">Echo Cancellation</Label>
                <p className="text-xs text-muted-foreground">
                  Remove echo from your audio
                </p>
              </div>
              <Switch
                checked={localSettings.echoCancellation}
                onCheckedChange={(checked) => handleInputChange('echoCancellation', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-normal">Automatic Gain Control</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically adjust microphone sensitivity
                </p>
              </div>
              <Switch
                checked={localSettings.autoGainControl}
                onCheckedChange={(checked) => handleInputChange('autoGainControl', checked)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleReset}>
              Reset to Defaults
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};