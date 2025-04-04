import { OutdoorRoute } from 'src/app/features/outdoor-route/outdoor-route.feature';

export class OutdoorRouteBuilder {
  map: google.maps.Map;
  routes: any[] = [];
  test: google.maps.DirectionsRendererOptions;

  public setMap(map: google.maps.Map) {
    this.map = map;
    return this;
  }

  public addWalkingRoute(origin: string, destination: string): this {
    const renderer = new google.maps.DirectionsRenderer({
      map: this.map,
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

    this.routes.push({ renderer, origin, destination, mode: google.maps.TravelMode.WALKING });
    return this;
  }

  public addDrivingRoute(origin: string, destination: string): this {
    const renderer = new google.maps.DirectionsRenderer({
      map: this.map,
      polylineOptions: {
        strokeColor: 'red'
      }
    });

    this.routes.push({ renderer, origin, destination, mode: google.maps.TravelMode.DRIVING });
    return this;
  }

  public addTransitRoute(origin: string, destination: string): this {
    const renderer = new google.maps.DirectionsRenderer({
      map: this.map,
      polylineOptions: {
        strokeColor: 'green'
      }
    });

    this.routes.push({ renderer, origin, destination, mode: google.maps.TravelMode.TRANSIT });
    return this;
  }

  public async build() {
    return Promise.all(
      this.routes.map(async (route) => {
        console.log(route);
        const outdoorRoute = new OutdoorRoute(
          route.origin,
          route.destination,
          route.mode,
          route.renderer
        );
        await outdoorRoute.getRouteFromGoogle();
        return outdoorRoute;
      })
    );
  }
}
