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
  lat: number;
  lng: number;
  constructor({ lat, lng }: LatLngLiteral) {
    this.lat = lat;
    this.lng = lng;
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
    geometry: {
      poly: { containsLocation },
    },
  },
};
