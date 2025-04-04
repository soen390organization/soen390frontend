import { DirectionsService } from './abstract-directions.service';
import { Location } from '../interfaces/location.interface';

describe('DirectionsService', () => {
  interface TestLocation extends Location {
    id: string;
  }

  class TestDirectionsService extends DirectionsService<TestLocation> {
    renderNavigation(): void {}
    clearNavigation(): void {}
  }

  let service: TestDirectionsService;

  beforeEach(() => {
    service = new TestDirectionsService();
  });

  const testLocation: TestLocation = {
    type: 'indoor',
    title: '',
    address: '',
    id: ''
  };

  describe('Start Point', () => {
    it('should set and get start point (observable)', (done) => {
      service.setStartPoint(testLocation);
      service.getStartPoint$().subscribe((value) => {
        expect(value).toEqual(testLocation);
        done();
      });
    });

    it('should set and get start point (promise)', async () => {
      service.setStartPoint(testLocation);
      const result = await service.getStartPoint();
      expect(result).toEqual(testLocation);
    });

    it('should clear start point', async () => {
      service.setStartPoint(testLocation);
      service.clearStartPoint();
      const result = await service.getStartPoint();
      expect(result).toBeNull();
    });
  });

  describe('Destination Point', () => {
    it('should set and get destination point (observable)', (done) => {
      service.setDestinationPoint(testLocation);
      service.getDestinationPoint$().subscribe((value) => {
        expect(value).toEqual(testLocation);
        done();
      });
    });

    it('should set and get destination point (promise)', async () => {
      service.setDestinationPoint(testLocation);
      const result = await service.getDestinationPoint();
      expect(result).toEqual(testLocation);
    });

    it('should clear destination point', async () => {
      service.setDestinationPoint(testLocation);
      service.clearDestinationPoint();
      const result = await service.getDestinationPoint();
      expect(result).toBeNull();
    });
  });

  describe('Travel Mode', () => {
    it('should set and get travel mode (observable)', (done) => {
      service.setTravelMode('walking');
      service.getTravelMode$().subscribe((value) => {
        expect(value).toBe('walking');
        done();
      });
    });

    it('should set and get travel mode (promise)', async () => {
      service.setTravelMode('driving');
      const result = await service.getTravelMode();
      expect(result).toBe('driving');
    });
  });
});
