import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { IndoorSelectsComponent } from './indoor-selects.component';
import { ConcordiaDataService } from 'src/app/services/concordia-data.service';
import { MappedinService } from 'src/app/services/mappedin/mappedin.service';

describe('IndoorSelectsComponent', () => {
  let component: IndoorSelectsComponent;
  let fixture: ComponentFixture<IndoorSelectsComponent>;

  // Define a fake campus that will be emitted by store.select.
  const fakeCampus = { id: 'campus1', name: 'Campus One' };

  // Define a fake building list (must include a building with an indoorMapId).
  const fakeBuildings = [{ indoorMapId: '67abe2bb8ea1bf000bb60d14', name: 'Building 1' }];

  // Create a fake MappedinService with the minimal methods needed.
  const fakeMappedinService = {
    getMapId: jasmine.createSpy('getMapId').and.returnValue('67abe2bb8ea1bf000bb60d14'),
    setMapData: jasmine.createSpy('setMapData'),
    getMapData$: jasmine.createSpy('getMapData$').and.returnValue(of({})), // Define getMapData$ here
    getFloors: jasmine
      .createSpy('getFloors')
      .and.returnValue(Promise.resolve([{ id: 'floor1', name: 'Floor 1' }])),
    getCurrentFloor: jasmine
      .createSpy('getCurrentFloor')
      .and.returnValue({ id: 'floor1', name: 'Floor 1' }),
    setFloor: jasmine.createSpy('setFloor')
  };  

  // Create a fake ConcordiaDataService with the minimal method needed.
  const fakeConcordiaDataService = {
    getBuildings: jasmine.createSpy('getBuildings').and.returnValue(fakeBuildings)
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        IndoorSelectsComponent, // Assuming this is a standalone component with 'imports' defined.
        IonicModule.forRoot()
      ],
      providers: [
        {
          provide: Store,
          useValue: {
            dispatch: jasmine.createSpy('dispatch'),
            // Provide a select function that returns an observable emitting our fake campus.
            select: jasmine.createSpy('select').and.returnValue(of(fakeCampus))
          }
        },
        { provide: MappedinService, useValue: fakeMappedinService },
        { provide: ConcordiaDataService, useValue: fakeConcordiaDataService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(IndoorSelectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
