import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { GoogleMapComponent } from './google-map.component';
import { provideMockStore } from '@ngrx/store/testing';
import { DebugElement, ElementRef } from '@angular/core';
import { By } from '@angular/platform-browser';
import { GoogleMapService } from 'src/app/services/google-map.service';
import { CurrentLocationService } from 'src/app/services/current-location/current-location.service';
import { GeolocationService } from 'src/app/services/geolocation/geolocation.service';

describe('GoogleMapComponent', () => {
  let component: GoogleMapComponent;
  let fixture: ComponentFixture<GoogleMapComponent>;
  let googleMapService: GoogleMapService;
  let fakeMap: any;
  let fakeInfoWindowInstance: any;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [GoogleMapComponent],
      providers: [
        provideMockStore({ initialState: {} }),
        GoogleMapService,
        CurrentLocationService,
        GeolocationService
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GoogleMapComponent);
    component = fixture.componentInstance;
    googleMapService = TestBed.inject(GoogleMapService);

    fakeMap = jasmine.createSpyObj('Map', ['setCenter', 'addListener']);
    fakeInfoWindowInstance = jasmine.createSpyObj('InfoWindow', [
      'setContent',
      'setPosition',
      'open',
      'close'
    ]);

    (window as any).google = {
      maps: {
        Map: jasmine.createSpy('Map').and.returnValue(fakeMap),
        InfoWindow: jasmine.createSpy('InfoWindow').and.returnValue(fakeInfoWindowInstance),
        LatLng: jasmine.createSpy('LatLng')
      }
    };

    spyOn(googleMapService, 'getMap').and.returnValue(fakeMap);

    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Info Window', () => {
    it('should close existing info window if present', () => {
      const existingInfoWindow: any = jasmine.createSpyObj('InfoWindow', ['close']);
      component.currentInfoWindow = existingInfoWindow;

      const buildingMock = { name: 'Test Building', address: '123 Test St' };
      const latLngMock = new google.maps.LatLng(0, 0);

      component.showInfoWindow(buildingMock, latLngMock);

      expect(existingInfoWindow.close).toHaveBeenCalled();
    });

    it('should create a new InfoWindow and set content/position', () => {
      const buildingMock = { name: 'Test Building', address: '123 Street' };
      const latLngMock = new google.maps.LatLng(45.5017, -73.5673);

      component.showInfoWindow(buildingMock, latLngMock);

      expect(window.google.maps.InfoWindow).toHaveBeenCalled();
      expect(fakeInfoWindowInstance.setContent).toHaveBeenCalledTimes(1);
      expect(fakeInfoWindowInstance.setPosition).toHaveBeenCalledWith(latLngMock);
    });

    it('should open the new InfoWindow on the map returned by googleMapService', () => {
      const buildingMock = { name: 'Test Building' };
      const latLngMock = new google.maps.LatLng(45.5017, -73.5673);

      component.showInfoWindow(buildingMock, latLngMock);

      expect(fakeInfoWindowInstance.open).toHaveBeenCalledWith(fakeMap);
    });

    it('should store the newly created InfoWindow instance in currentInfoWindow', () => {
      const buildingMock = { name: 'Another Building' };
      const latLngMock = new google.maps.LatLng(45.5017, -73.5673);

      component.showInfoWindow(buildingMock, latLngMock);

      expect(component.currentInfoWindow).toBe(fakeInfoWindowInstance);
    });

    it('should handle building without address', () => {
      const buildingMock = { name: 'Building Without Address' };
      const latLngMock = new google.maps.LatLng(40, -70);

      component.showInfoWindow(buildingMock, latLngMock);

      expect(fakeInfoWindowInstance.setContent).toHaveBeenCalled();
      const [contentArg] = fakeInfoWindowInstance.setContent.calls.mostRecent().args;
      expect(contentArg).toContain('Building Without Address');
    });

    it('should handle empty building object', () => {
      const buildingMock = {};
      const latLngMock = new google.maps.LatLng(40, -70);

      component.showInfoWindow(buildingMock, latLngMock);

      expect(fakeInfoWindowInstance.setContent).toHaveBeenCalled();
    });

    it('should properly close previous InfoWindow on multiple calls', () => {
      const previousInfoWindow = jasmine.createSpyObj('InfoWindow', ['close']);
      component.currentInfoWindow = previousInfoWindow;

      const buildingMock = { name: 'Chained Building', address: '456 Chain St' };
      const latLngMock = new google.maps.LatLng(50, -80);

      component.showInfoWindow(buildingMock, latLngMock);

      expect(previousInfoWindow.close).toHaveBeenCalled();
      expect(component.currentInfoWindow).toBe(fakeInfoWindowInstance);
    });

    it('should handle null latLng gracefully', () => {
      const buildingMock = { name: 'Null LatLng Building', address: '789 Null St' };

      expect(() => component.showInfoWindow(buildingMock, null as any)).not.toThrow();
      expect(fakeInfoWindowInstance.setContent).toHaveBeenCalled();
    });

    it('should handle building with accessibility icon', () => {
      const buildingMock = {
        name: 'Accessible Building',
        address: '789 Accessible St',
        accessibility: 'https://example.com/icon.png',
        faculties: ['Engineering', 'Science']
      };
      const latLngMock = new google.maps.LatLng(45, -73);
    
      // Ensure #infoWindowContent element exists in DOM
      const container = document.createElement('div');
      container.id = 'infoWindowContent';
      container.innerHTML = `
        <div id="buildingName"></div>
        <div id="buildingAddress"></div>
        <div id="buildingFaculties"></div>
        <img id="buildingAccessibility" />
      `;
      document.body.appendChild(container);
    
      component.showInfoWindow(buildingMock, latLngMock);
    
      expect(fakeInfoWindowInstance.setContent).toHaveBeenCalled();
      const [contentArg] = fakeInfoWindowInstance.setContent.calls.mostRecent().args;
    
      const image = contentArg.querySelector('#buildingAccessibility') as HTMLImageElement;
      expect(image.src).toContain(buildingMock.accessibility);
      expect(image.style.display).toBe('inline');
    
      // Clean up the DOM after test
      document.body.removeChild(container);
    });

    it('should handle building with no faculties', () => {
  const buildingMock = {
    name: 'Building Without Faculties',
    address: '321 No Faculty St',
    accessibility: 'https://example.com/icon.png'
    // faculties is missing
  };
  const latLngMock = new google.maps.LatLng(40, -73);

  const container = document.createElement('div');
  container.id = 'infoWindowContent';
  container.innerHTML = `
    <div id="buildingName"></div>
    <div id="buildingAddress"></div>
    <div id="buildingFaculties"></div>
    <img id="buildingAccessibility" />
  `;
  document.body.appendChild(container);

  component.showInfoWindow(buildingMock, latLngMock);

  const [contentArg] = fakeInfoWindowInstance.setContent.calls.mostRecent().args;
  const facultiesDiv = contentArg.querySelector('#buildingFaculties') as HTMLElement;

  expect(facultiesDiv.innerHTML).toContain('No faculties available');

  document.body.removeChild(container);
});

    
    
  });

  describe('Unimplemented methods (coverage boost)', () => {
    it('handleClick should throw method not implemented', () => {
      expect(() => component.handleClick()).toThrowError('Method not implemented.');
    });

    it('onShowMore should throw method not implemented', () => {
      expect(() => component.onShowMore()).toThrowError('Method not implemented.');
    });

    it('swipeProgress should throw method not implemented', () => {
      expect(() => component.swipeProgress(0.5)).toThrowError('Method not implemented.');
    });

    it('onDragStart should throw method not implemented', () => {
      expect(() => component.onDragStart(100)).toThrowError('Method not implemented.');
    });

    it('startY should throw method not implemented', () => {
      expect(() => component.startY(100)).toThrowError('Method not implemented.');
    });

    it('onDragMove should throw method not implemented', () => {
      expect(() => component.onDragMove(100, {} as Event)).toThrowError('Method not implemented.');
    });

    it('onDragEnd should throw method not implemented', () => {
      expect(() => component.onDragEnd()).toThrowError('Method not implemented.');
    });
  });
});
