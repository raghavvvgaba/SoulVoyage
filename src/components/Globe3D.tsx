import { useEffect, useRef } from "react";
import { MapService } from "@/services/MapService";

export const Globe3D = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapServiceRef = useRef<MapService | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Wait for WebGL Earth API to load
    const initializeMap = () => {
      if (typeof WE !== 'undefined' && mapContainerRef.current) {
        try {
          // Initialize the map with the local container ID
          const containerId = 'globe-map-' + Math.random().toString(36).substr(2, 9);
          mapContainerRef.current.id = containerId;
          
          mapServiceRef.current = new MapService(containerId);
          
          // Add markers for popular server locations
          mapServiceRef.current.addMarker(37.7749, -122.4194, 'San Francisco - Tech Hub');
          mapServiceRef.current.addMarker(51.5074, -0.1278, 'London - Urban Explorers');
          mapServiceRef.current.addMarker(35.6762, 139.6503, 'Tokyo - Asia Community');
          mapServiceRef.current.addMarker(48.8566, 2.3522, 'Paris - Culture & Art');
          mapServiceRef.current.addMarker(-33.8688, 151.2093, 'Sydney - Beach Life');
        } catch (error) {
          console.error('Error initializing map:', error);
          setTimeout(initializeMap, 1000);
        }
      } else {
        // Retry if WE is not yet defined
        setTimeout(initializeMap, 500);
      }
    };

    initializeMap();

    return () => {
      // Cleanup if needed
      if (mapContainerRef.current) {
        mapContainerRef.current.innerHTML = '';
      }
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
