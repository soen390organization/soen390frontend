import { DirectionsComponent } from './directions.component';

describe('DirectionsComponent...', () => {
  let component: DirectionsComponent;

  beforeEach(() => {
    component = new DirectionsComponent();
  });

  describe('Given the user is traveling from New York to Philadelphia...', () => {
    const startAddress = 'New York, NY';
    const destinationAddress = 'Philadelphia, PA';
    const mockMap = {} as google.maps.Map;

    it("Should call `calculateRoute` and update the map directions", async () => {
      spyOn(component, 'calculateRoute').and.callFake(() => {});

      component.calculateRoute(mockMap, startAddress, destinationAddress);

      expect(component.calculateRoute).toHaveBeenCalledWith(
        mockMap,
        startAddress,
        destinationAddress
      );
    });
  });

  describe('Given the user is traveling from Los Angeles to San Francisco...', () => {
    const startAddress = 'Los Angeles, CA';
    const destinationAddress = 'San Francisco, CA';
    const mockMap = {} as google.maps.Map;

    it("Should call `calculateRoute` and update the map directions", async () => {
      spyOn(component, 'calculateRoute').and.callFake(() => {});

      component.calculateRoute(mockMap, startAddress, destinationAddress);

      expect(component.calculateRoute).toHaveBeenCalledWith(
        mockMap,
        startAddress,
        destinationAddress
      );
    });
  });

  describe('Given a null input', () => {
    const mockMap = {} as google.maps.Map;

    it('Should not call `calculateRoute` and log an error', async () => {
      spyOn(console, 'error');
      spyOn(component, 'calculateRoute').and.callFake(() => {});

      component.calculateRoute(mockMap, null as any, null as any);

      expect(console.error).toHaveBeenCalledWith(
        'Directions request failed due to ',
        'INVALID_INPUT'
      );
    });
  });

  describe('Given a valid input but no directions available', () => {
    const startAddress = 'Unknown Location';
    const destinationAddress = 'Nowhere';
    const mockMap = {} as google.maps.Map;

    it("Should log an error 'Directions request failed'", async () => {
      spyOn(console, 'error');

      component.calculateRoute(mockMap, startAddress, destinationAddress);

      expect(console.error).toHaveBeenCalledWith(
        'Directions request failed due to ',
        'ZERO_RESULTS'
      );
    });
  });
});
