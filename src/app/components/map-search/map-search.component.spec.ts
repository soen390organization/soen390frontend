import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapSearchComponent } from './map-search.component';
import { GoogleMapService } from 'src/app/services/googeMap.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { GoogleMapComponent } from '../google-map/google-map.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

describe('MapSearchComponent', () => {
  let component: MapSearchComponent;
  let fixture: ComponentFixture<MapSearchComponent>;
  let googleMapServiceSpy: jasmine.SpyObj<GoogleMapService>;

  beforeEach(async () => {
    const googleMapSpy = jasmine.createSpyObj('GoogleMapService', ['getMap', 'updateMapLocation']);
    
    await TestBed.configureTestingModule({
      imports: [IonicModule, CommonModule, FormsModule, MapSearchComponent],
      providers: [
        { provide: GoogleMapService, useValue: googleMapSpy },
        provideAnimations()
      ]
    }).compileComponents();

    googleMapServiceSpy = TestBed.inject(GoogleMapService) as jasmine.SpyObj<GoogleMapService>;
    fixture = TestBed.createComponent(MapSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle search visibility', () => {
    expect(component.isSearchVisible).toBeFalse();
    component.toggleSearch();
    expect(component.isSearchVisible).toBeTrue();
    component.toggleSearch();
    expect(component.isSearchVisible).toBeFalse();
  });

  it('should not search if input is empty', () => {
    spyOn(component, 'onSearch');
    
    const emptyEvent = { detail: { value: '' } };
    component.onSearchChangeStart(emptyEvent);
    expect(component.onSearch).not.toHaveBeenCalled();

    component.onSearchChangeDestination(emptyEvent);
    expect(component.onSearch).not.toHaveBeenCalled();
  });

  it('should call onSearch with correct icon for start location', () => {
    spyOn(component, 'onSearch');
    component.onSearchChangeStart({ detail: { value: 'New York' } });
    expect(component.onSearch).toHaveBeenCalledWith(jasmine.any(Object), 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Icone_Verde.svg');
  });

  it('should call onSearch with correct icon for destination', () => {
    spyOn(component, 'onSearch');
    component.onSearchChangeDestination({ detail: { value: 'Los Angeles' } });
    expect(component.onSearch).toHaveBeenCalledWith(jasmine.any(Object), 'https://upload.wikimedia.org/wikipedia/commons/6/64/Icone_Vermelho.svg');
  });
});
