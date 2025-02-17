import { ComponentFixture, TestBed, fakeAsync, tick  } from '@angular/core/testing';
import { MapSearchComponent } from './map-search.component';
import { GoogleMapService } from 'src/app/services/googeMap.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { CurrentLocationService } from 'src/app/services/geolocation/current-location.service';




// Mock Google Maps API
class MockGoogleMapService {
  updateMapLocation = jasmine.createSpy('updateMapLocation');
  getMap = jasmine.createSpy('getMap').and.returnValue({
    fitBounds: jasmine.createSpy('fitBounds'),
    setCenter: jasmine.createSpy('setCenter'),
    setZoom: jasmine.createSpy('setZoom'),
  });
  createMarker = jasmine.createSpy('createMarker').and.callFake(
    (position: google.maps.LatLng, iconUrl: string) => ({
      setPosition: jasmine.createSpy('setPosition'),
      getPosition: jasmine.createSpy('getPosition').and.returnValue(position),
      getIcon: jasmine.createSpy('getIcon').and.returnValue(iconUrl),
      setMap: jasmine.createSpy('setMap'),
    })
  );
}

describe('MapSearchComponent', () => {
let component: MapSearchComponent;
let fixture: ComponentFixture<MapSearchComponent>;
let googleMapService: MockGoogleMapService;

beforeAll(() => {
 (window as any).google = {
   maps: {
     LatLng: class {
       latValue: number;
       lngValue: number;


       constructor(lat: number, lng: number) {
         this.latValue = lat;
         this.lngValue = lng;
       }


       lat() {
         return this.latValue;
       }


       lng() {
         return this.lngValue;
       }
     },
     Marker: class {
       position: any;
       icon: any;
       constructor(options: any) {
         this.position = options.position;
         this.icon = options.icon || 'default-icon.svg';
       }
       getPosition() {
         return this.position;
       }
       setPosition(pos: any) {
         this.position = pos;
       }
       getIcon() {
         return this.icon;
       }
       setIcon(icon: any) {
         this.icon = icon;
       }
     },
     Geocoder: class {
       geocode(request: any, callback: Function) {
         // Mocking a correct LatLng object here, instead of a plain object
         callback(
           [
             {
               formatted_address: 'Test Address',
               geometry: {
                 location: new (window as any).google.maps.LatLng(10, 20), // Return an instance of LatLng
               },
             },
           ],
           'OK'
         );
       }
     },


     LatLngBounds: class {
       extend = jasmine.createSpy('extend');
       getCenter() {
         return { lat: 10, lng: 20 };
       }
     },
     Size: class {
       width: number;
       height: number;
       constructor(width: number, height: number) {
         this.width = width;
         this.height = height;
       }
     },
     places: {
       PlacesServiceStatus: { OK: 'OK' },
       PlacesService: class {
         findPlaceFromQuery(request: any, callback: Function) {
           callback(
             [
               {
                 geometry: { location: new (window as any).google.maps.LatLng(10, 20) }, // Use LatLng class here too
               },
             ],
             'OK'
           );
         }
       },
       AutocompleteService: class {
         getPlacePredictions(request: any, callback: Function) {
           callback([
             { description: '151 abbott avenue' },
           ]);
         }
       },     
      },
   },
 };
});



beforeEach(async () => {

  await TestBed.configureTestingModule({
    imports: [MapSearchComponent, CommonModule, FormsModule, IonicModule],
    providers: [
      { provide: GoogleMapService, useClass: MockGoogleMapService },
      provideAnimations(),
    ]
  }).compileComponents();

  fixture = TestBed.createComponent(MapSearchComponent);
  component = fixture.componentInstance;
  googleMapService = TestBed.inject(GoogleMapService) as any;
  fixture.detectChanges();
});


it('should set startLocationInput when type is start and call onSearchFromInput', () => {
  const place = { address: '123 Main St' }; // Mock place object
  spyOn(component, 'clearPlaces'); // Spy on clearPlaces method
  spyOn(component, 'onSearchFromInput'); // Spy on onSearchFromInput method
  component.selectPlace(place, 'start');
  expect(component.startLocationInput).toBe('123 Main St');
  expect(component.clearPlaces).toHaveBeenCalled();
  expect(component.onSearchFromInput).toHaveBeenCalledWith('123 Main St', null, 'start');
});


 it('should set destinationLocationInput when type is destination and call onSearchFromInput', () => {
  const place = { address: '456 Elm St' }; // Mock place object
  spyOn(component, 'clearPlaces'); // Spy on clearPlaces method
  spyOn(component, 'onSearchFromInput'); // Spy on onSearchFromInput method
  component.selectPlace(place, 'destination');
  expect(component.destinationLocationInput).toBe('456 Elm St');
  expect(component.clearPlaces).toHaveBeenCalled();
  expect(component.onSearchFromInput).toHaveBeenCalledWith('456 Elm St', null, 'destination');
});


it('should call geoCode with correct address and return a LatLng object', async () => {
 const result = await component.geoCode('123 Main St') as { lat: string; lng: string };
 expect(result.lat).toEqual(jasmine.any(String));
 expect(result.lng).toEqual(jasmine.any(String));
});


it('should toggle isSearchVisible from false to true', () => {
  component.isSearchVisible = false; // Initial state
  component.toggleSearch();
  fixture.detectChanges(); // Apply changes
  expect(component.isSearchVisible).toBeTruthy();  // Check if it's truthy (true)
});


it('should toggle isSearchVisible from true to false', () => {
  component.isSearchVisible = true; // Initial state
  component.toggleSearch();
  fixture.detectChanges(); // Apply changes
  expect(component.isSearchVisible).toBeFalsy(); // Check if it's falsy (false)
});


it('should call clearPlaces when search query is empty', async () => {
  spyOn(component, 'clearPlaces'); // Spy on clearPlaces method
  const event = { target: { value: ' ' } }; // Simulate empty input
  await component.onSearchChange(event, 'start');
  expect(component.clearPlaces).toHaveBeenCalled(); // Ensure clearPlaces is called
});


it('should call getPlaces when search query is not empty', async () => {
  spyOn(component, 'getPlaces'); // Spy on getPlaces method
  const event = { target: { value: 'New Location' } }; // Simulate valid input
  await component.onSearchChange(event, 'start');
  expect(component.getPlaces).toHaveBeenCalled(); // Ensure getPlaces is called
});


it('should set isSearchingFromStart flag correctly for start type', async () => {
  const event = { target: { value: 'New Location' } }; // Simulate valid input
  await component.onSearchChange(event, 'start');
  expect(component.isSearchingFromStart).toBeTrue(); // Ensure the flag is true for 'start'
});


it('should set isSearchingFromStart flag correctly for destination type', async () => {
  const event = { target: { value: 'New Location' } }; // Simulate valid input
  await component.onSearchChange(event, 'destination');
  expect(component.isSearchingFromStart).toBeFalse(); // Ensure the flag is false for 'destination'
});

it('should call findPlace with correct searchTerm and update startLocation', async () => {
  const mockLatLng = new google.maps.LatLng(10, 20);
  const result = {
    formatted_address: '123 Main St',
    geometry: {
      location: mockLatLng
    }
  };
  spyOn(component, 'findPlace').and.returnValue(Promise.resolve(result)); // Mock findPlace method
  spyOn(component, 'updateMapView'); // Spy on updateMapView method
  const event = { target: { value: '123 Main St' } }; // Simulate valid input
  await component.onSearchFromInput('', event, 'start');

  // Ensure startLocation is updated correctly
  expect(component.startLocation).toEqual({
    address: '123 Main St',
    coordinates: mockLatLng, // Now this is a LatLng instance
    marker: jasmine.any(Object)
  });
   // Ensure updateMapView was called
  expect(component.updateMapView).toHaveBeenCalled();
});


it('should call findPlace with correct searchTerm and update destinationLocation', async () => {
  const mockLatLng = new google.maps.LatLng(10, 20);
  const result = {
    formatted_address: '456 Elm St',
    geometry: {
      location: mockLatLng
    }
  };
  spyOn(component, 'findPlace').and.returnValue(Promise.resolve(result)); // Mock findPlace method
  spyOn(component, 'updateMapView'); // Spy on updateMapView method
  const event = { target: { value: '456 Elm St' } }; // Simulate valid input
  await component.onSearchFromInput('', event, 'destination');


  // Ensure destinationLocation is updated correctly
  expect(component.destinationLocation).toEqual({
    address: '456 Elm St',
    coordinates: mockLatLng, // Now this is a LatLng instance
    marker: jasmine.any(Object)
  });
   // Ensure updateMapView was called
  expect(component.updateMapView).toHaveBeenCalled();
});


it('should clear the places array', () => {
 component.places = ['Place 1', 'Place 2', 'Place 3'];
 component.clearPlaces();
 expect(component.places.length).toBe(0);
});


it('should clear places array', () => {
  component.places = [1, 2, 3]; // Initial state
  component.clearPlaces();
  expect(component.places).toEqual([]); // Ensure places array is empty
});


it('should create a google.maps.Marker with correct position and icon', () => {
  // Create a mock LatLng
  const position = new google.maps.LatLng(10, 20);
  const iconUrl = 'http://example.com/icon.png';
   const marker = component.createMarker(position, iconUrl);
   expect(marker).toBeTruthy();
   expect(marker.getPosition()).toEqual(position); 
});

it('should create start marker in onSetUsersLocationAsStart', fakeAsync(() => {
  spyOn(CurrentLocationService.prototype, 'getCurrentLocation').and.returnValue(
    Promise.resolve({ lat: 10, lng: 20 })
  );
  component.onSetUsersLocationAsStart();
  tick();
  expect(component.startLocation?.marker).toBeDefined();
  expect(googleMapService.getMap).toHaveBeenCalled();
}));

it('should fit bounds when both startLocation and destinationLocation are set', () => {
  const mockLatLngStart = new google.maps.LatLng(10, 20);
  const mockLatLngDestination = new google.maps.LatLng(30, 40);
  component.startLocation = {
    address: 'Start Address',
    coordinates: mockLatLngStart,
    marker: new google.maps.Marker({ position: mockLatLngStart })
  };
  component.destinationLocation = {
    address: 'Destination Address',
    coordinates: mockLatLngDestination,
    marker: new google.maps.Marker({ position: mockLatLngDestination })
  };

  component.updateMapView();

  const map = googleMapService.getMap();
  expect(map.fitBounds).toHaveBeenCalled();
  expect(map.fitBounds.calls.mostRecent().args[0].extend).toHaveBeenCalledWith(mockLatLngStart);
  expect(map.fitBounds.calls.mostRecent().args[0].extend).toHaveBeenCalledWith(mockLatLngDestination);
});

it('should reject when findPlace is called and no results are found', async () => {
  spyOn(google.maps.places.PlacesService.prototype, 'findPlaceFromQuery').and.callFake((request, callback) => {
    callback([], google.maps.places.PlacesServiceStatus.OK);
  });

  try {
    await component.findPlace('Unknown Place');
    fail('Expected findPlace to reject');
  } catch (error) {
    expect(error).toBeNull();
  }
});

it('should fit bounds when both startLocation and destinationLocation are set', () => {
  const mockLatLngStart = new google.maps.LatLng(10, 20);
  const mockLatLngDestination = new google.maps.LatLng(30, 40);
  component.startLocation = {
    address: 'Start Address',
    coordinates: mockLatLngStart,
    marker: new google.maps.Marker({ position: mockLatLngStart })
  };
  component.destinationLocation = {
    address: 'Destination Address',
    coordinates: mockLatLngDestination,
    marker: new google.maps.Marker({ position: mockLatLngDestination })
  };

  component.updateMapView();

  const map = googleMapService.getMap();
  expect(map.fitBounds).toHaveBeenCalled();
  expect(map.fitBounds.calls.mostRecent().args[0].extend).toHaveBeenCalledWith(mockLatLngStart);
  expect(map.fitBounds.calls.mostRecent().args[0].extend).toHaveBeenCalledWith(mockLatLngDestination);
});

it('should set center and zoom when only destinationLocation is set', () => {
  const mockLatLngDestination = new google.maps.LatLng(30, 40);
  component.startLocation = undefined;
  component.destinationLocation = {
    address: 'Destination Address',
    coordinates: mockLatLngDestination,
    marker: new google.maps.Marker({ position: mockLatLngDestination })
  };

  component.updateMapView();

  const map = googleMapService.getMap();
  expect(map.setCenter).toHaveBeenCalledWith(mockLatLngDestination);
  expect(map.setZoom).toHaveBeenCalledWith(15);
});

});
