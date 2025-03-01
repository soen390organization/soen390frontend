import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);

// Global Google Maps Stub definition:
interface LatLngLiteral {
  lat: number;
  lng: number;
}

class Polygon {
  paths: LatLngLiteral[];
  constructor(options: { paths: LatLngLiteral[] }) {
    this.paths = options.paths;
  }
}

class LatLng {
  private readonly _lat: number;
  private readonly _lng: number;
  constructor({ lat, lng }: LatLngLiteral) {
    this._lat = lat;
    this._lng = lng;
  }
  lat(): number {
    return this._lat;
  }
  lng(): number {
    return this._lng;
  }
}

class Circle {
  options: any;
  constructor(options: any) {
    this.options = options;
  }
}

class Map {
  constructor(public element: HTMLElement, public options: any) {}
  setCenter(latLng: any): void {
    // intentionally left blank
  }
  setZoom(zoom: number): void {
    // intentionally left blank
  }
}

class AutocompleteService {
  getPlacePredictions(
    req: any,
    callback: (predictions: google.maps.places.AutocompletePrediction[] | null, status: string) => void
  ) {
    callback(null, 'ZERO_RESULTS');
  }
  getQueryPredictions(
    req: any,
    callback: (predictions: google.maps.places.QueryAutocompletePrediction[] | null, status: string) => void
  ) {
    callback(null, 'ZERO_RESULTS');
  }
}

class PlacesService {
  constructor(public map: any) {}
  getDetails(req: any, callback: (place: any, status: string) => void) {
    callback(null, 'NOT_FOUND');
  }
  nearbySearch(req: any, callback: (results: any[], status: string) => void) {
    callback([], 'ZERO_RESULTS');
  }
}

class DirectionsService {
  constructor(public map: any) {}
  route(
    request: google.maps.DirectionsRequest,
    callback: (result: google.maps.DirectionsResult, status: google.maps.DirectionsStatus) => void
  ): void {
    callback(null, 'NOT_FOUND' as any);
  }
}

class DirectionsRenderer {
  setMap(map: google.maps.Map): void {
    // intentionally left blank
  }
  setOptions(options: any): void {
    // intentionally left blank
  }
  setDirections(directions: google.maps.DirectionsResult): void {
    // intentionally left blank
  }
}

const TravelMode = {
  DRIVING: 'DRIVING',
  TRANSIT: 'TRANSIT',
  WALKING: 'WALKING',
};

const DirectionsStatus = {
  OK: 'OK',
  NOT_FOUND: 'NOT_FOUND',
};

const SymbolPath = {
  CIRCLE: 'CIRCLE',
};

const containsLocation = (point: LatLngLiteral, polygon: Polygon): boolean => {
  const lats = polygon.paths.map((p) => p.lat);
  const lngs = polygon.paths.map((p) => p.lng);
  return (
    point.lat >= Math.min(...lats) &&
    point.lat <= Math.max(...lats) &&
    point.lng >= Math.min(...lngs) &&
    point.lng <= Math.max(...lngs)
  );
};

(window as any).google = {
  maps: {
    Polygon,
    LatLng,
    Circle,
    Map,
    geometry: {
      poly: { containsLocation },
    },
    places: {
      AutocompleteService,
      PlacesService,
    },
    DirectionsService,
    DirectionsRenderer,
    TravelMode,
    DirectionsStatus,
    SymbolPath,
  },
};

// Save and Global Restoration after each test
const originalGoogle = (window as any).google;
afterEach(() => {
  (window as any).google = originalGoogle;
});
