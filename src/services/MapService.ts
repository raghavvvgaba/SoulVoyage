export class MapService {
  private earth: WE.EarthMap | null = null;

  constructor(containerId: string = 'earth-map') {
    this.initializeMap(containerId);
  }

  private initializeMap(containerId: string): void {
    // Check if WE is defined before initializing
    if (typeof WE === 'undefined') {
      console.warn('WebGL Earth API not loaded yet');
      return;
    }

    // Check if container exists
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Container with ID '${containerId}' not found`);
      return;
    }

    try {
      // Initialize map with mobile/touch support options
      this.earth = WE.map(containerId, {
        dragging: true,
        touchZoom: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        tap: true,
        tapTolerance: 15,
        trackResize: true,
        worldCopyJump: false,
        closePopupOnClick: true,
        bounceAtZoomLimits: true,
      });
      
      WE.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
        .addTo(this.earth);
      this.earth.setView([20, 0], 2);
      
      console.log('WebGL Earth map initialized with touch controls enabled');
    } catch (error: unknown) {
      console.error('Error initializing WebGL Earth map:', error);
    }
  }

  public addMarker(lat: number, lng: number, title: string): void {
    if (!this.earth) {
      console.warn('Map not initialized');
      return;
    }
    WE.marker([lat, lng])
      .addTo(this.earth)
      .bindPopup(title, { maxWidth: 200 });
  }

  public flyTo(lat: number, lng: number, zoom: number = 10): void {
    if (!this.earth) return;
    this.earth.flyTo([lat, lng], zoom);
  }

  public setView(lat: number, lng: number, zoom: number = 10): void {
    if (!this.earth) return;
    this.earth.setView([lat, lng], zoom);
  }

  public getMap(): WE.EarthMap | null {
    return this.earth;
  }

  public isInitialized(): boolean {
    return this.earth !== undefined && this.earth !== null;
  }
}
