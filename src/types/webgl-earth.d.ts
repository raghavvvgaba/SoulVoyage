declare namespace WE {
  interface MapOptions {
    dragging?: boolean;
    touchZoom?: boolean;
    scrollWheelZoom?: boolean;
    doubleClickZoom?: boolean;
    boxZoom?: boolean;
    keyboard?: boolean;
    tap?: boolean;
    tapTolerance?: number;
    trackResize?: boolean;
    worldCopyJump?: boolean;
    closePopupOnClick?: boolean;
    bounceAtZoomLimits?: boolean;
  }

  interface TileLayerOptions {
    maxZoom?: number;
    minZoom?: number;
    attribution?: string;
  }

  interface PopupOptions {
    maxWidth?: number;
  }

  type MapEventHandler = (...args: unknown[]) => void;

  function map(elementId: string | HTMLElement, options?: MapOptions): EarthMap;
  function marker(latlng: [number, number]): Marker;
  function tileLayer(url: string, options?: TileLayerOptions): TileLayer;
  function popup(options?: PopupOptions): Popup;

  interface EarthMap {
    flyTo(latlng: [number, number], zoom: number): void;
    setView(latlng: [number, number], zoom: number): void;
    getZoom(): number;
    setZoom(zoom: number): void;
    on(event: string, callback: MapEventHandler): void;
    off(event: string, callback?: MapEventHandler): void;
  }

  interface Marker {
    addTo(map: EarthMap): Marker;
    bindPopup(content: string, options?: PopupOptions): Marker;
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
