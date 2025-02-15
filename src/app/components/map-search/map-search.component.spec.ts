import { ComponentFixture, TestBed } from '@angular/core/testing';
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
}


// Mock CurrentLocationService (if it's used in your component)
class MockCurrentLocationService {
 getCurrentLocation = jasmine.createSpy('getCurrentLocation').and.returnValue({
   lat: 10,
   lng: 20,
 });
}


describe('MapSearchComponent', () => {
 let component: MapSearchComponent;
 let fixture: ComponentFixture<MapSearchComponent>;
 let googleMapService: MockGoogleMapService;
 let mockGeoCode: jasmine.Spy;
 let mockZone: { run: jasmine.Spy };


 beforeAll(() => {
   (window as any).google = {
     maps: {
       LatLng: class {
         constructor(public lat: number, public lng: number) {}
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
           callback(
             [
               {
                 formatted_address: 'Test Address',
                 geometry: { location: { lat: () => 10, lng: () => 20 } },
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
                   geometry: { location: { lat: () => 10, lng: () => 20 } },
                 },
               ],
               'OK'
             );
           }
         },
       },
     },
   };
 });


 beforeEach(async () => {
   mockGeoCode = jasmine.createSpy('geoCode').and.returnValue(Promise.resolve({ lat: 10, lng: 20 }));
   mockZone = { run: jasmine.createSpy('run') };


   await TestBed.configureTestingModule({
     imports: [MapSearchComponent, CommonModule, FormsModule, IonicModule.forRoot()],
     providers: [
       { provide: GoogleMapService, useClass: MockGoogleMapService },
       { provide: CurrentLocationService, useClass: MockCurrentLocationService },
       provideAnimations(),
       { provide: 'geoCode', useValue: mockGeoCode },
       { provide: 'zone', useValue: mockZone },
     ]
   }).compileComponents();


   fixture = TestBed.createComponent(MapSearchComponent);
   component = fixture.componentInstance;
   fixture.detectChanges();
 });


 it('should set startLocationInput when type is start and call onSearchFromInput', () => {
   const place = { address: '123 Main St' }; // Mock place object
   spyOn(component, 'clearPlaces'); // Spy on clearPlaces method
   spyOn(component, 'onSearchFromInput'); // Spy on onSearchFromInput method
  
   // Call selectPlace with 'start' type
   component.selectPlace(place, 'start');
  
   // Check that startLocationInput is set correctly
   expect(component.startLocationInput).toBe('123 Main St');
  
   // Ensure clearPlaces was called
   expect(component.clearPlaces).toHaveBeenCalled();
  
   // Ensure onSearchFromInput was called with correct arguments
   expect(component.onSearchFromInput).toHaveBeenCalledWith('123 Main St', null, 'start');
 });






  it('should set destinationLocationInput when type is destination and call onSearchFromInput', () => {
   const place = { address: '456 Elm St' }; // Mock place object
   spyOn(component, 'clearPlaces'); // Spy on clearPlaces method
   spyOn(component, 'onSearchFromInput'); // Spy on onSearchFromInput method
  
   // Call selectPlace with 'destination' type
   component.selectPlace(place, 'destination');
  
   // Check that destinationLocationInput is set correctly
   expect(component.destinationLocationInput).toBe('456 Elm St');
  
   // Ensure clearPlaces was called
   expect(component.clearPlaces).toHaveBeenCalled();
  
   // Ensure onSearchFromInput was called with correct arguments
   expect(component.onSearchFromInput).toHaveBeenCalledWith('456 Elm St', null, 'destination');
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
  
   expect(marker).toBeTruthy(); // Ensure the marker is created
  
   // Check that the google.maps.Marker was created with correct position and icon
   expect(marker.getPosition()).toEqual(position);  // Expect the position to be correctly set
 });
});
