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
Object.defineProperty(window, 'google', {
  value: {
    maps: {
      Polygon: class {
        constructor() { }
      },
      LatLng: class {
        constructor() { }
      },
      geometry: {
        poly: {
          containsLocation: jasmine
            .createSpy('containsLocation')
            .and.returnValue(false),
        },
      },
    },
  },
  writable: true,
});
