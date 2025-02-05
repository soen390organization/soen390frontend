// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);
(window as any).google = {
  maps: {
    Polygon: class {
      paths: any;
      constructor(options: any) { this.paths = options.paths; }
    },
    LatLng: class {
      lat: number;
      lng: number;
      constructor({ lat, lng }: { lat: number; lng: number }) {
        this.lat = lat;
        this.lng = lng;
      }
    },
    geometry: {
      poly: {
        containsLocation: (point: any, polygon: any) => {
          // simple bounding box check for testing
          const lats = polygon.paths.map((p: any) => p.lat);
          const lngs = polygon.paths.map((p: any) => p.lng);
          return (
            point.lat >= Math.min(...lats) &&
            point.lat <= Math.max(...lats) &&
            point.lng >= Math.min(...lngs) &&
            point.lng <= Math.max(...lngs)
          );
        }
      }
    }
  }
};
