import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MappedinMapComponent } from './mappedin-map.component';
import { MappedinService } from 'src/app/services/mappedin/mappedin.service';
import { IndoorDirectionsService } from 'src/app/services/indoor-directions/indoor-directions.service';
import { of, Subject } from 'rxjs';
import { ElementRef } from '@angular/core';

describe('MappedinMapComponent', () => {
  let component: MappedinMapComponent;
  let fixture: ComponentFixture<MappedinMapComponent>;
  let mappedinServiceMock: jasmine.SpyObj<MappedinService>;
  let indoorDirectionsServiceMock: jasmine.SpyObj<IndoorDirectionsService>;
  let nativeElementMock: HTMLElement;
  let errorSpy: jasmine.Spy;

  const startPoint$ = new Subject<any>();
  const destinationPoint$ = new Subject<any>();
  const mapView$ = new Subject<any>();

  beforeEach(async () => {
    mappedinServiceMock = jasmine.createSpyObj('MappedinService', ['initialize', 'getMapView']);
    indoorDirectionsServiceMock = jasmine.createSpyObj('IndoorDirectionsService', [
      'getStartPoint$',
      'getDestinationPoint$',
      'clearNavigation',
      'renderNavigation'
    ]);

    await TestBed.configureTestingModule({
      imports: [MappedinMapComponent],
      providers: [
        { provide: MappedinService, useValue: mappedinServiceMock },
        { provide: IndoorDirectionsService, useValue: indoorDirectionsServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MappedinMapComponent);
    component = fixture.componentInstance;

    nativeElementMock = document.createElement('div');
    component.mappedinContainer = new ElementRef(nativeElementMock);

    mappedinServiceMock.getMapView.and.returnValue(mapView$.asObservable());
    indoorDirectionsServiceMock.getStartPoint$.and.returnValue(startPoint$.asObservable());
    indoorDirectionsServiceMock.getDestinationPoint$.and.returnValue(
      destinationPoint$.asObservable()
    );

    errorSpy = spyOn(console, 'error');
  });

  it('should call initialize and emit initialized event', async () => {
    const initializedSpy = spyOn(component.initialized, 'emit');
    mappedinServiceMock.initialize.and.returnValue(Promise.resolve());

    await component.ngAfterViewInit();

    expect(mappedinServiceMock.initialize).toHaveBeenCalledWith(nativeElementMock);
    expect(initializedSpy).toHaveBeenCalled();
  });

  it('should catch and log error on initialize failure', async () => {
    const error = new Error('init failed');
    mappedinServiceMock.initialize.and.returnValue(Promise.reject(error));

    await component.ngAfterViewInit();

    expect(errorSpy).toHaveBeenCalledWith(
      'Error initializing mappedin map or computing route:',
      error
    );
  });

  it('should clear navigation and render if start or destination exists and mapView is truthy', async () => {
    mappedinServiceMock.initialize.and.returnValue(Promise.resolve());

    await component.ngAfterViewInit();

    startPoint$.next({ id: 1 });
    destinationPoint$.next(null);
    mapView$.next({}); // Truthy

    // allow async
    await fixture.whenStable();

    expect(indoorDirectionsServiceMock.clearNavigation).toHaveBeenCalled();
    expect(indoorDirectionsServiceMock.renderNavigation).toHaveBeenCalled();
  });

  it('should clear navigation and skip render if both start and destination are falsy', async () => {
    mappedinServiceMock.initialize.and.returnValue(Promise.resolve());

    await component.ngAfterViewInit();

    startPoint$.next(null);
    destinationPoint$.next(null);
    mapView$.next({}); // Truthy

    await fixture.whenStable();

    expect(indoorDirectionsServiceMock.clearNavigation).toHaveBeenCalled();
    expect(indoorDirectionsServiceMock.renderNavigation).not.toHaveBeenCalled();
  });

  it('should skip all if mapView is falsy', async () => {
    mappedinServiceMock.initialize.and.returnValue(Promise.resolve());

    await component.ngAfterViewInit();

    startPoint$.next({ id: 1 });
    destinationPoint$.next({ id: 2 });
    mapView$.next(null); // Falsy

    await fixture.whenStable();

    expect(indoorDirectionsServiceMock.clearNavigation).not.toHaveBeenCalled();
    expect(indoorDirectionsServiceMock.renderNavigation).not.toHaveBeenCalled();
  });
});
