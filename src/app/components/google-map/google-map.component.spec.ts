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
      component.showInfoWindow({ name: 'Test Building' }, new google.maps.LatLng(0, 0));
      expect(existingInfoWindow.close).toHaveBeenCalled();
    });

    it('should create a new InfoWindow and set content/position', () => {
      const buildingMock = { name: 'Test Building', address: '123 Street' };
      const latLngMock = new google.maps.LatLng(45.5017, -73.5673);

      component.showInfoWindow(buildingMock, latLngMock);

      expect(window.google.maps.InfoWindow).toHaveBeenCalled(); // created
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
  });
});
