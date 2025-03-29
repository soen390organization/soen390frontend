export class OutdoorRoute {
  private origin: string;
  private destination: string;
  private travelMode: google.maps.TravelMode;
  private renderer: google.maps.DirectionsRenderer;
  private response: google.maps.DirectionsResult | null = null;

  constructor (origin: string, destination: string, travelMode: google.maps.TravelMode, renderer: google.maps.DirectionsRenderer) {
    this.origin = origin;
    this.destination = destination;
    this.travelMode = travelMode;
    this.renderer = renderer;
  }

  public getOrigin(): string {
    return this.origin;
  }

  public getDestination(): string {
    return this.destination;
  }

  public getTravelMode(): google.maps.TravelMode {
    return this.travelMode;
  }

  public getRenderer(): google.maps.DirectionsRenderer {
    return this.renderer;
  }

  public getResponse(): google.maps.DirectionsResult | null {
    return this.response;
  }

  public async getRouteFromGoogle() {
    const googleDirectionsService = new google.maps.DirectionsService();
  
    const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
      googleDirectionsService.route(
        {
          origin: this.origin,
          destination: this.destination,
          travelMode: this.travelMode,
        },
        (response, status) => {
          if (status === google.maps.DirectionsStatus.OK && response) {
            resolve(response);
          } else {
            reject(new Error(status));
          }
        }
      );
    });
  
    this.response = result;
  }
}
