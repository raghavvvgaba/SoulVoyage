export class MapService {
  private earth: any;

  constructor(containerId: string = 'earth-map') {
    this.initializeMap(containerId);
  }

  private initializeMap(containerId: string): void {
    // Check if WE is defined before initializing
    if (typeof WE === 'undefined') {
      console.warn('WebGL Earth API not loaded yet');
      return;
    }

    this.earth = WE.map(containerId);
    WE.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
      .addTo(this.earth);
    this.earth.setView([20, 0], 2);
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

  public getMap(): any {
    return this.earth;
  }

  public isInitialized(): boolean {
    return this.earth !== undefined && this.earth !== null;
  }
}
