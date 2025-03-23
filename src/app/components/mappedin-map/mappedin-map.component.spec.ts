import { ComponentFixture, TestBed, waitForAsync, fakeAsync, tick } from '@angular/core/testing';
import { MappedinMapComponent } from './mappedin-map.component';
import { MappedinService } from 'src/app/services/mappedin/mappedin.service';

class MockMappedinService {
  initialize = jasmine.createSpy('initialize').and.returnValue(Promise.resolve());
}

describe('MappedinMapComponent', () => {
  let component: MappedinMapComponent;
  let fixture: ComponentFixture<MappedinMapComponent>;
  let mappedinService: MockMappedinService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MappedinMapComponent],
      providers: [{ provide: MappedinService, useClass: MockMappedinService }]
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
    // Let initialize's promise resolve.
    tick();

    expect(mappedinService.initialize).toHaveBeenCalled();

    const containerElement = fixture.nativeElement.querySelector('div');
    expect(mappedinService.initialize).toHaveBeenCalledWith(containerElement);
  }));
});
