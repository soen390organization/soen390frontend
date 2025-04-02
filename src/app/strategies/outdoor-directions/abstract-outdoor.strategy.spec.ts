import { AbstractOutdoorStrategy } from './abstract-outdoor.strategy';
import { GoogleMapLocation } from 'src/app/interfaces/google-map-location.interface';
import { OutdoorRoute } from 'src/app/features/outdoor-route/outdoor-route.feature';

describe('AbstractOutdoorStrategy', () => {
  class MockRenderer {
    setDirections = jasmine.createSpy('setDirections');
    set = jasmine.createSpy('set');
  }

  const createMockRoute = (legs: any[]): OutdoorRoute & { _mockRenderer: MockRenderer } => {
    const mockRenderer = new MockRenderer();
  
    return {
      getResponse: () => ({
        routes: [{ legs }]
      }),
      getRenderer: () => mockRenderer,
      _mockRenderer: mockRenderer, // <-- expose it for testing
  
      // other required OutdoorRoute properties
      origin: null,
      destination: null,
      travelMode: '',
      renderer: null,
      response: null,
      distance: null,
      duration: null,
      path: [],
      bounds: null,
      steps: [],
    } as unknown as OutdoorRoute & { _mockRenderer: MockRenderer };
  };

  class TestStrategy extends AbstractOutdoorStrategy {
    constructor(mode: string) {
      super(mode);
    }

    getRoutes(origin: GoogleMapLocation, destination: GoogleMapLocation): Promise<any> {
      return Promise.resolve([]);
    }
  }

  let strategy: TestStrategy;

  beforeEach(() => {
    strategy = new TestStrategy('WALKING');
  });

  it('should return the correct mode', () => {
    expect(strategy.getMode()).toBe('WALKING');
  });

  it('should calculate total duration', () => {
    strategy.routes = [
      createMockRoute([
        { duration: { value: 60 }, distance: { value: 500 }, steps: [{ hide: false }] },
        { duration: { value: 120 }, distance: { value: 800 }, steps: [{ hide: true }] }
      ])
    ];
    const result = strategy.getTotalDuration();
    expect(result.value).toBe(180);
    expect(result.text).toBe('3 mins');
  });

  it('should calculate total distance under 1000m', () => {
    strategy.routes = [
      createMockRoute([
        { duration: { value: 0 }, distance: { value: 200 }, steps: [] },
        { duration: { value: 0 }, distance: { value: 300 }, steps: [] }
      ])
    ];
    const result = strategy.getTotalDistance();
    expect(result.value).toBe(500);
    expect(result.text).toBe('500m');
  });

  it('should calculate total distance above 1000m', () => {
    strategy.routes = [
      createMockRoute([
        { duration: { value: 0 }, distance: { value: 1200 }, steps: [] }
      ])
    ];
    const result = strategy.getTotalDistance();
    expect(result.value).toBe(1200);
    expect(result.text).toBe('1.2km');
  });

  it('should return total legs from all routes', () => {
    const leg1 = { duration: { value: 0 }, distance: { value: 0 }, steps: [] };
    const leg2 = { duration: { value: 0 }, distance: { value: 0 }, steps: [] };
    strategy.routes = [createMockRoute([leg1, leg2])];
    const legs = strategy.getTotalLegs();
    expect(legs.length).toBe(2);
  });

  it('should return total visible steps', () => {
    strategy.routes = [
      createMockRoute([
        {
          duration: { value: 0 },
          distance: { value: 0 },
          steps: [{ hide: false }, { hide: true }]
        }
      ])
    ];
    const steps = strategy.getTotalSteps();
    expect(steps.length).toBe(1);
    expect(steps[0].hide).toBeFalse();
  });

  it('should render all routes', () => {
    const mockRoute = createMockRoute([
      { duration: { value: 0 }, distance: { value: 0 }, steps: [] }
    ]);
    const renderer = mockRoute.getRenderer() as unknown as MockRenderer;
    strategy.routes = [mockRoute];
    strategy.renderRoutes();
    expect(renderer.setDirections).toHaveBeenCalledWith(mockRoute.getResponse());
  });

  it('should clear all rendered routes', () => {
    const mockRoute = createMockRoute([
      { duration: { value: 0 }, distance: { value: 0 }, steps: [] }
    ]);
    strategy.routes = [mockRoute];
    strategy.clearRenderedRoutes();
    expect(mockRoute._mockRenderer.set).toHaveBeenCalledWith('directions', null);
  });

  it('should call getRoutes abstract method from subclass', async () => {
    const start: GoogleMapLocation = {
      title: 'Test',
      address: 'Boul. Test',
      type: 'outdoor',
      coordinates: new google.maps.LatLng(0, 0)
    }

    const dest: GoogleMapLocation = {
      title: 'Test',
      address: 'Boul. Test',
      type: 'outdoor',
      coordinates: new google.maps.LatLng(1, 1)
    }
    const result = await strategy.getRoutes(start, dest);
    expect(result).toEqual([]);
  });
});
