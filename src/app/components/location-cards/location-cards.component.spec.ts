import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LocationCardsComponent } from './location-cards.component';
import { DirectionsService } from 'src/app/services/directions/directions.service';
import { LocationCard } from 'src/app/interfaces/location-card.interface';

describe('LocationCardsComponent', () => {
  let component: LocationCardsComponent;
  let fixture: ComponentFixture<LocationCardsComponent>;
  let mockDirectionsService: jasmine.SpyObj<DirectionsService>;

  beforeEach(() => {
    mockDirectionsService = jasmine.createSpyObj('DirectionsService', ['setDestinationPoint']);

    TestBed.configureTestingModule({
      imports: [LocationCardsComponent],
      providers: [{ provide: DirectionsService, useValue: mockDirectionsService }],
    }).compileComponents();

    fixture = TestBed.createComponent(LocationCardsComponent);
    component = fixture.componentInstance;
  });

  it('should log the location and call setDestinationPoint', () => {
    const location: LocationCard = {
      name: 'Engineering and Visual Arts',
      coordinates: new google.maps.LatLng(45.49541909930391,-73.57769260301784 ),
      address: "1515 Saint-Catherine St W #1428, Montreal, Quebec H3G 1S6",
      image: "https://lh3.googleusercontent.com/p/AF1QipPdcC9aj620AW078WET7MWOA9X8J6ZrRBX9gDdM=s1360-w1360-h1020"
    };

    spyOn(console, 'log');

    component.setDestination(location);

    expect(console.log).toHaveBeenCalledWith(location);
    expect(mockDirectionsService.setDestinationPoint).toHaveBeenCalledWith({
      title: 'Engineering and Visual Arts',
      coordinates: jasmine.any(google.maps.LatLng),
      address: "1515 Saint-Catherine St W #1428, Montreal, Quebec H3G 1S6"
    });
  });
});
