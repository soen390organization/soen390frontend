import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SwitchMapButtonComponent } from './switch-map-button.component';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { MapType } from 'src/app/enums/map-type.enum';
import { selectCurrentMap } from 'src/app/store/app/app.selectors';
import { setMapType } from 'src/app/store/app/app.actions';
import { By } from '@angular/platform-browser';

describe('SwitchMapButtonComponent', () => {
  let component: SwitchMapButtonComponent;
  let fixture: ComponentFixture<SwitchMapButtonComponent>;
  let store: MockStore;
  const initialState = {
    app: { selectedCampus: 'sgw', currentMap: MapType.Outdoor }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SwitchMapButtonComponent],
      providers: [provideMockStore({ initialState })]
    }).compileComponents();

    store = TestBed.inject(MockStore);
    // Override the selector for currentMap
    store.overrideSelector(selectCurrentMap, MapType.Outdoor);

    fixture = TestBed.createComponent(SwitchMapButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Reset the store state and selectors after each test
    store.setState(initialState);
    store.resetSelectors();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render button with bg-white and svg fill "#000" when currentMap is Outdoor', () => {
    store.overrideSelector(selectCurrentMap, MapType.Outdoor);
    store.refreshState();
    fixture.detectChanges();

    const buttonEl = fixture.debugElement.query(By.css('button'));
    expect(buttonEl.nativeElement.classList).toContain('bg-white');

    const svgEl = fixture.debugElement.query(By.css('svg'));
    expect(svgEl.nativeElement.getAttribute('fill')).toBe('#000');
  });

  it('should render button with bg-black and svg fill "#fff" when currentMap is Indoor', () => {
    store.overrideSelector(selectCurrentMap, MapType.Indoor);
    store.refreshState();
    fixture.detectChanges();

    const buttonEl = fixture.debugElement.query(By.css('button'));
    expect(buttonEl.nativeElement.classList).toContain('bg-black');

    const svgEl = fixture.debugElement.query(By.css('svg'));
    expect(svgEl.nativeElement.getAttribute('fill')).toBe('#fff');
  });

  it('should dispatch setMapType action to Indoor when current map is Outdoor', () => {
    spyOn(store, 'dispatch');
    // Ensure the current map is Outdoor so that toggling dispatches Indoor.
    store.refreshState();
    fixture.detectChanges();

    component.toggleMap();

    expect(store.dispatch).toHaveBeenCalledWith(setMapType({ mapType: MapType.Indoor }));
  });

  it('should dispatch setMapType action to Outdoor when current map is Indoor', () => {
    spyOn(store, 'dispatch');
    // Set current map to Indoor so that toggling dispatches Outdoor.
    store.overrideSelector(selectCurrentMap, MapType.Indoor);
    store.refreshState();
    fixture.detectChanges();

    component.toggleMap();

    expect(store.dispatch).toHaveBeenCalledWith(setMapType({ mapType: MapType.Outdoor }));
  });

  it('should call toggleMap when the button is clicked', () => {
    spyOn(component, 'toggleMap');
    const buttonEl = fixture.debugElement.query(By.css('button'));
    buttonEl.triggerEventHandler('click', null);
    expect(component.toggleMap).toHaveBeenCalled();
  });
});
