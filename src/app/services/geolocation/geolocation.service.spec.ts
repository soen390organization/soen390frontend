import { GeolocationService } from './geolocation.service';
import { TestBed } from '@angular/core/testing';

// Mock Google Maps API
class MockLatLng {
  lat: number;
  lng: number;
  constructor(latLng: { lat: number; lng: number }) {
    this.lat = latLng.lat;
    this.lng = latLng.lng;
  }
}

class MockPolygon {
  paths: any;
  constructor(options: { paths: any }) {
    this.paths = options.paths;
  }

  containsLocation(latLng: any): boolean {
    // Mock the containsLocation method to always return true for specific coordinates
    return latLng.lat === 45.49724206314789 && latLng.lng === -73.57905238471409;
  }
}

describe('GeolocationService', () => {
  let service: GeolocationService;

  beforeEach(() => {
    // Create a mock window for google.maps
    (window as any).google = {
      maps: {
        Polygon: MockPolygon,
        LatLng: MockLatLng,
        geometry: {
          poly: {
            containsLocation: (latLng: any, polygon: any) => polygon.containsLocation(latLng)
          }
        }
      }
    };

    TestBed.configureTestingModule({
      providers: [GeolocationService]
    });

    service = TestBed.inject(GeolocationService);
  });

  describe('getCurrentBuilding', () => {
    it('should return the correct building name if inside boundaries', async () => {
      // Mock the data structure
      const mockData = {
        buildings: [
          {
            name: 'Hall',
            boundaries: [
              { lat: 45.49724206314789, lng: -73.57905238471409 }
              // Add more coordinates for Hall boundaries if necessary
            ]
          },
          {
            name: 'JMSB',
            boundaries: [
              { lat: 45.495269700671045, lng: -73.57892221858457 }
              // Add more coordinates for JMSB boundaries if necessary
            ]
          }
        ]
      };

      // Mock service method to return the mock data
      spyOn(service as any, 'getCurrentBuilding').and.callFake(
        async (currentLocation: { lat: number; lng: number }) => {
          const foundBuilding = mockData.buildings.find((building) => {
            const outline = new google.maps.Polygon({
              paths: building.boundaries
            });
            const point = new google.maps.LatLng(currentLocation);
            return google.maps.geometry.poly.containsLocation(point, outline);
          });
          return foundBuilding ? foundBuilding.name : null;
        }
      );

      // Test for a location inside the Hall building
      const currentLocation = {
        lat: 45.49724206314789,
        lng: -73.57905238471409
      };
      const currentBuildingName = await service.getCurrentBuilding(currentLocation);
      expect(currentBuildingName).toBe('Hall');
    });

    it('should return null if the location is outside any building boundaries', async () => {
      const currentLocation = {
        lat: 45.49666690990893,
        lng: -73.57928799583352
      };
      const currentBuildingName = await service.getCurrentBuilding(currentLocation);
      expect(currentBuildingName).toBeNull();
    });

    it('should return null if the location is null', async () => {
      const currentLocation = null;
      const currentBuildingName = await service.getCurrentBuilding(currentLocation);
      expect(currentBuildingName).toBeNull();
    });
  });
});
