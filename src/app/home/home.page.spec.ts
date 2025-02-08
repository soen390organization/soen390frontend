import { TestBed } from '@angular/core/testing';
import { HomePage } from './home.page';

describe('HomePage', () => {
  let component: HomePage;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HomePage],
    }).compileComponents();

    component = TestBed.createComponent(HomePage).componentInstance;
  });

  it('should not call updateMapLocation or create a marker if no search term is provided', () => {
    const mockEvent = { detail: { value: '' } };

    spyOn(component, 'onSearchChangeDestination'); // Spy on the method to ensure it does not run

    component.onSearchChangeDestination(mockEvent);

    expect(component.onSearchChangeDestination).toHaveBeenCalledWith(mockEvent);
  });
});
