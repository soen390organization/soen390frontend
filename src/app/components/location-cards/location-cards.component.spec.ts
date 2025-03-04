import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LocationCardsComponent } from './location-cards.component';
import { DirectionsService } from 'src/app/services/directions/directions.service';
import { Location } from 'src/app/interfaces/location.interface';
import { By } from '@angular/platform-browser';

describe('LocationCardsComponent', () => {
  let component: LocationCardsComponent;
  let fixture: ComponentFixture<LocationCardsComponent>;
  let directionsServiceSpy: jasmine.SpyObj<DirectionsService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('DirectionsService', ['setDestinationPoint']);

    await TestBed.configureTestingModule({
      imports: [LocationCardsComponent],
      providers: [{ provide: DirectionsService, useValue: spy }]
    }).compileComponents();

    fixture = TestBed.createComponent(LocationCardsComponent);
    component = fixture.componentInstance;
    directionsServiceSpy = TestBed.inject(DirectionsService) as jasmine.SpyObj<DirectionsService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set a default image when onImageError is triggered', () => {
    const imgElement = document.createElement('img');
    imgElement.src = 'invalid-image-url.jpg'; // Simulating a broken image

    // Call the method with the event containing the faulty image
    component.onImageError({ target: imgElement } as unknown as Event);

    // Expect the image to be replaced with the placeholder URL
    expect(imgElement.src).toBe('https://cdn.discordapp.com/attachments/1152015876300754956/1346007857719546017/image.png?ex=67c69f00&is=67c54d80&hm=536b59895f6facbe007133b8c1ab73d1b28060fe55d196a4e4077df61263fa66');
  });

  it('should set the destination when setDestination is called', () => {
    const mockLocation: Location = {
      name: 'Test Location',
      address: '123 Test St',
      image: 'test-image.jpg',
      coordinates: new google.maps.LatLng(12.345, 67.890)
    };

    component.setDestination(mockLocation);

    expect(directionsServiceSpy.setDestinationPoint).toHaveBeenCalledWith({
      title: mockLocation.name,
      coordinates: mockLocation.coordinates,
      address: mockLocation.address
    });
  });
});
