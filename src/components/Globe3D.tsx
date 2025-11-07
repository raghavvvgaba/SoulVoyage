import { useEffect } from "react";
import { MapService } from "@/services/MapService";

export const Globe3D = () => {
  useEffect(() => {
    // Wait for WebGL Earth API to load
    const initializeMap = () => {
      if (typeof WE !== 'undefined') {
        const mapContainer = document.getElementById('earth-map');
        if (mapContainer) {
          mapContainer.style.display = 'block';
          
          const mapService = new MapService('earth-map');
          
          // Add markers for popular server locations
          mapService.addMarker(37.7749, -122.4194, 'San Francisco - Tech Hub');
          mapService.addMarker(51.5074, -0.1278, 'London - Urban Explorers');
          mapService.addMarker(35.6762, 139.6503, 'Tokyo - Asia Community');
          mapService.addMarker(48.8566, 2.3522, 'Paris - Culture & Art');
          mapService.addMarker(-33.8688, 151.2093, 'Sydney - Beach Life');
        }
      } else {
        // Retry if WE is not yet defined
        setTimeout(initializeMap, 500);
      }
    };

    initializeMap();

    return () => {
      const mapContainer = document.getElementById('earth-map');
      if (mapContainer) {
        mapContainer.style.display = 'none';
      }
    };
  }, []);

  return (
    <div className="w-full rounded-lg border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
      {/* WebGL Earth map is rendered here */}
    </div>
  );
};

export default Globe3D;
