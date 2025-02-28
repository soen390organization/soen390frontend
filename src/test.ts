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
  private _lat: number;
  private _lng: number;
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
  setCenter(latLng: any) {}
  setZoom(zoom: number) {}
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
  },
};
