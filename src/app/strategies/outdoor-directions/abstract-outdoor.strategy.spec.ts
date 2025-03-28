import { AbstractOutdoorStrategy } from './abstract-outdoor.strategy';

describe('AbstractOutdoorStrategy', () => {
  let service: AbstractOutdoorStrategy;

  // Create a concrete subclass for testing
  class TestOutdoorStrategy extends AbstractOutdoorStrategy {
    getRoutes(origin: string, destination: string): Promise<any> {
      return Promise.resolve([]);
    }
  }

  beforeEach(() => {
    service = new TestOutdoorStrategy();
  });

  it('should return total duration correctly', () => {
    service.routes = [
      {
        response: {
          routes: [
            {
              legs: [
                { duration: { value: 300 } },
                { duration: { value: 180 } }
              ]
            }
          ]
        }
      }
    ];

    const result = service.getTotalDuration();
    expect(result.value).toBe(480);
    expect(result.text).toBe('8 mins');
  });

  it('should return total distance under 1000m correctly', () => {
    service.routes = [
      {
        response: {
          routes: [
            {
              legs: [
                { distance: { value: 200 } },
                { distance: { value: 500 } }
              ]
            }
          ]
        }
      }
    ];

    const result = service.getTotalDistance();
    expect(result.value).toBe(700);
    expect(result.text).toBe('700m');
  });

  it('should return total distance over 1000m correctly', () => {
    service.routes = [
      {
        response: {
          routes: [
            {
              legs: [
                { distance: { value: 1200 } },
                { distance: { value: 800 } }
              ]
            }
          ]
        }
      }
    ];

    const result = service.getTotalDistance();
    expect(result.value).toBe(2000);
    expect(result.text).toBe('2.0km');
  });

  it('should return combined legs', () => {
    const leg1 = { distance: { value: 100 }, duration: { value: 60 }, steps: [] };
    const leg2 = { distance: { value: 200 }, duration: { value: 120 }, steps: [] };

    service.routes = [
      {
        response: {
          routes: [
            { legs: [leg1, leg2] }
          ]
        }
      }
    ];

    const result = service.getTotalLegs();
    expect(result.length).toBe(2);
    expect(result).toEqual([leg1, leg2]);
  });

  it('should return visible steps only', () => {
    const visibleStep = { instruction: 'Walk', hide: false };
    const hiddenStep = { instruction: 'Turn', hide: true };

    service.routes = [
      {
        response: {
          routes: [
            {
              legs: [
                { steps: [visibleStep, hiddenStep] }
              ]
            }
          ]
        }
      }
    ];

    const result = service.getTotalSteps();
    expect(result.length).toBe(1);
    expect(result[0]).toEqual(visibleStep);
  });

  it('should render all routes', () => {
    const mockRenderer = { setDirections: jasmine.createSpy('setDirections') };
    const mockResponse = { routes: [] };

    service.routes = [
      { renderer: mockRenderer, response: mockResponse },
      { renderer: mockRenderer, response: mockResponse }
    ];

    service.renderRoutes();
    expect(mockRenderer.setDirections).toHaveBeenCalledTimes(2);
    expect(mockRenderer.setDirections).toHaveBeenCalledWith(mockResponse);
  });

  it('should clear all rendered routes', () => {
    const mockRenderer = { set: jasmine.createSpy('set') };

    service.routes = [
      { renderer: mockRenderer },
      { renderer: mockRenderer }
    ];

    service.clearRenderedRoutes();
    expect(mockRenderer.set).toHaveBeenCalledTimes(2);
    expect(mockRenderer.set).toHaveBeenCalledWith('directions', null);
  });

  it('should call implemented getRoutes', async () => {
    const result = await service.getRoutes('A', 'B');
    expect(result).toEqual([]);
  });
});
