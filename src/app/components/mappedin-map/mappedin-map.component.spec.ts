import { ComponentFixture, TestBed, waitForAsync, fakeAsync, tick } from '@angular/core/testing';
import { MappedinMapComponent } from './mappedin-map.component';
import { MappedinService } from 'src/app/services/mappedin/mappedin.service';
import { IndoorDirectionsService } from 'src/app/services/indoor-directions/indoor-directions.service';
// import { NavigationCoordinatorService } from 'src/app/services/navigation-coordinator.service';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';

class MockMappedinService {
  initialize = jasmine.createSpy('initialize').and.returnValue(Promise.resolve());
  getMapId = jasmine.createSpy('getMapId').and.returnValue('mockMapId');
}

class MockIndoorDirectionsService {
  getStartPoint = () => of(null);
  getDestinationPoint = () => of(null);
}

// class MockNavigationCoordinatorService {
//   getCompleteRoute = jasmine
//     .createSpy('getCompleteRoute')
//     .and.returnValue(Promise.resolve({ segments: [] }));
// }

// Create a dummy Store spy so that NavigationCoordinatorService can be constructed.
const mockStore = jasmine.createSpyObj('Store', ['select', 'dispatch']);
mockStore.select.and.returnValue(of(null));

describe('MappedinMapComponent', () => {
  let component: MappedinMapComponent;
  let fixture: ComponentFixture<MappedinMapComponent>;
  let mappedinService: MockMappedinService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MappedinMapComponent, CommonModule],
      providers: [
        { provide: MappedinService, useClass: MockMappedinService },
        { provide: IndoorDirectionsService, useClass: MockIndoorDirectionsService },
        // { provide: NavigationCoordinatorService, useClass: MockNavigationCoordinatorService },
        { provide: Store, useValue: mockStore }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MappedinMapComponent);
    component = fixture.componentInstance;
    mappedinService = TestBed.inject(MappedinService) as unknown as MockMappedinService;
    fixture.detectChanges(); // triggers ngAfterViewInit asynchronously
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should call initialize with the mappedinContainer element', fakeAsync(() => {
    // Allow the promise from initialize() to resolve.
    tick();
    expect(mappedinService.initialize).toHaveBeenCalled();

    const containerElement = fixture.nativeElement.querySelector('div');
    expect(mappedinService.initialize).toHaveBeenCalledWith(containerElement);
  }));
});
