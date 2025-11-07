declare namespace WE {
  function map(elementId: string): EarthMap;
  function marker(latlng: [number, number]): Marker;
  function tileLayer(url: string, options?: any): TileLayer;
  function popup(): Popup;

  interface EarthMap {
    flyTo(latlng: [number, number], zoom: number): void;
    setView(latlng: [number, number], zoom: number): void;
    getZoom(): number;
    setZoom(zoom: number): void;
    on(event: string, callback: Function): void;
    off(event: string, callback?: Function): void;
  }

  interface Marker {
    addTo(map: EarthMap): Marker;
    bindPopup(content: string, options?: any): Marker;
    setPopupContent(content: string): void;
    openPopup(): void;
    closePopup(): void;
  }

  interface TileLayer {
    addTo(map: EarthMap): TileLayer;
  }

  interface Popup {
    setLatLng(latlng: [number, number]): Popup;
    setContent(content: string): Popup;
    openOn(map: EarthMap): Popup;
  }
}

declare const WE: typeof WE;
