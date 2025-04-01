import { AbstractOutdoorStrategy } from './abstract-outdoor.strategy';
import { OutdoorRoute } from 'src/app/features/outdoor-route/outdoor-route.feature';

describe('AbstractOutdoorStrategy', () => {
  class TestStrategy extends AbstractOutdoorStrategy {
    async getRoutes(origin: string, destination: string): Promise<any> {
      return [];
    }
  }

  let strategy: TestStrategy;
  let mockRoute: jasmine.SpyObj<OutdoorRoute>;
  let mockRenderer: jasmine.SpyObj<google.maps.DirectionsRenderer>;

  beforeEach(() => {
    strategy = new TestStrategy('WALKING');

    const directionsResponse: any = {
      routes: [
        {
          legs: [
            {
              duration: { value: 120 },
              distance: { value: 500 },
              steps: [
                { instructions: 'Step 1', hide: false },
                { instructions: 'Step 2', hide: true }
              ]
            },
            {
              duration: { value: 240 },
              distance: { value: 1500 },
              steps: [
                { instructions: 'Step 3', hide: false }
              ]
            }
          ],
          overview_path: [],
          bounds: {} as google.maps.LatLngBounds,
          copyrights: '',
          summary: '',
          warnings: [],
          waypoint_order: []
        }
      ]
    };

    mockRenderer = jasmine.createSpyObj('google.maps.DirectionsRenderer', ['setDirections', 'set']);
    mockRoute = jasmine.createSpyObj<OutdoorRoute>('OutdoorRoute', ['getResponse', 'getRenderer']);
    mockRoute.getResponse.and.returnValue(directionsResponse);
    mockRoute.getRenderer.and.returnValue(mockRenderer);

    strategy.routes = [mockRoute];
  });

  it('should calculate total duration in seconds and text format', () => {
    const result = strategy.getTotalDuration();
    expect(result).toEqual({ value: 360, text: '6 mins' });
  });

  it('should calculate total distance below 1000m and return in meters', () => {
    // Set both legs below 1000m
    const response = mockRoute.getResponse();
    response.routes[0].legs[0].distance.value = 500;
    response.routes[0].legs[1].distance.value = 400;
    mockRoute.getResponse.and.returnValue(response);

    const result = strategy.getTotalDistance();
    expect(result).toEqual({ value: 900, text: '900m' });
  });

  it('should calculate total distance above 1000m and return in km', () => {
    const result = strategy.getTotalDistance();
    expect(result).toEqual({ value: 2000, text: '2.0km' });
  });

  it('should return all legs from all routes', () => {
    const legs = strategy.getTotalLegs();
    expect(legs.length).toBe(2);
    expect(legs[0].duration.value).toBe(120);
  });

  it('should return all non-hidden steps from all legs', () => {
    const steps = strategy.getTotalSteps();
    expect(steps.length).toBe(2);
    expect(steps[0].instructions).toBe('Step 1');
    expect(steps[1].instructions).toBe('Step 3');
  });

  it('should render all routes with setDirections', () => {
    strategy.renderRoutes();
    expect(mockRenderer.setDirections).toHaveBeenCalledWith(mockRoute.getResponse());
  });

  it('should clear all rendered routes', () => {
    strategy.clearRenderedRoutes();
    expect(mockRenderer.set).toHaveBeenCalledWith('directions', null);
  });
});
