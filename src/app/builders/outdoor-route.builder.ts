import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class OutdoorRouteBuilder {
  map: google.maps.Map;
  routes: any[] = [];

  public setMap(map: google.maps.Map) {
    this.map = map;
    return this;
  }

  public addWalkingRoute(origin: string, destination: string): OutdoorRouteBuilder {
    const renderer = new google.maps.DirectionsRenderer();
    renderer.setMap(this.map);
    renderer.setOptions({
      polylineOptions: {
        strokeColor: '#0096FF',
        strokeOpacity: 0,
        icons: [
          {
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillOpacity: 1,
              scale: 3
            },
            offset: '0',
            repeat: '10px'
          }
        ]
      }
    });

    this.routes.push({ renderer, origin, destination, mode: google.maps.TravelMode.WALKING })
    return this;
  }

  public addDrivingRoute(origin: string, destination: string): OutdoorRouteBuilder {
    const renderer = new google.maps.DirectionsRenderer();
    renderer.setMap(this.map);
    renderer.setOptions({
      polylineOptions: {
        strokeColor: 'red'
      }
    });

    this.routes.push({ renderer, origin, destination, mode: google.maps.TravelMode.DRIVING })
    return this;
  }

  public addTransitRoute(origin: string, destination: string): OutdoorRouteBuilder {
    const renderer = new google.maps.DirectionsRenderer();
    renderer.setMap(this.map);
    renderer.setOptions({
      polylineOptions: {
        strokeColor: 'green'
      }
    });

    this.routes.push({ renderer, origin, destination, mode: google.maps.TravelMode.TRANSIT });
    return this;
  }

  public async build() {
    return await Promise.all(
      this.routes.map(async (route) => {
        return {
          ...route,
          response: await this.getRoute(route.origin, route.destination, route.mode)
        }
      })
    );
  }

  private async getRoute(origin: string, destination: string, travelMode: google.maps.TravelMode): Promise<google.maps.DirectionsResult | null> {
    const googleDirectionsService = new google.maps.DirectionsService();

    return new Promise((resolve, reject) => {
      googleDirectionsService.route(
        {
          origin,
          destination,
          travelMode
        },
        (response, status) => {
          if (status === google.maps.DirectionsStatus.OK && response) {
            resolve(response);
          } else {
            reject(Error(status));
          }
        }
      );
    });
  }
}
