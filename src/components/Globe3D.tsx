import { useEffect, useRef } from "react";
import { MapService } from "@/services/MapService";

export const Globe3D = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapServiceRef = useRef<MapService | null>(null);
  const initializationAttemptRef = useRef(0);

  useEffect(() => {
    if (!mapContainerRef.current || mapServiceRef.current) return;

    const maxRetries = 10;
    const retryDelay = 500;

    // Wait for WebGL Earth API to load
    const initializeMap = () => {
      if (typeof WE !== 'undefined' && mapContainerRef.current && !mapServiceRef.current) {
        try {
          // Use a stable container ID
          const containerId = 'globe-map-container';
          mapContainerRef.current.id = containerId;
          
          mapServiceRef.current = new MapService(containerId);
          initializationAttemptRef.current = 0;
          console.log('WebGL Earth initialized successfully');
        } catch (error) {
          console.error('Error initializing WebGL Earth:', error);
          initializationAttemptRef.current++;
          if (initializationAttemptRef.current < maxRetries) {
            console.log(`Retrying (${initializationAttemptRef.current}/${maxRetries})...`);
            setTimeout(initializeMap, retryDelay);
          } else {
            console.error('Failed to initialize WebGL Earth after max retries');
          }
        }
      } else if (!mapServiceRef.current) {
        // Retry if WE is not yet defined
        initializationAttemptRef.current++;
        if (initializationAttemptRef.current < maxRetries) {
          setTimeout(initializeMap, retryDelay);
        }
      }
    };

    initializeMap();

    return () => {
      // Don't destroy the map on unmount to preserve interactivity
    };
  }, []);

  return (
    <div 
      ref={mapContainerRef}
      className="w-full h-[500px] rounded-lg border border-border bg-card/50 backdrop-blur-sm overflow-hidden"
      style={{ minHeight: '500px' }}
    />
  );
};

export default Globe3D;
