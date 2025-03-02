import { ShuttleService } from './shuttle.service';

describe('Shuttle Service', () => {
  let service: ShuttleService;
  class MockDirectionsRenderer {
    setMap = jasmine.createSpy('setMap');
    setOptions = jasmine.createSpy('setOptions');
    setDirections = jasmine.createSpy('setDirections');
  }
  describe('getNearestCampus()', () => {
    describe('given coordinates neaer sgw', () => {
      it("should return 'sgw", () => {
        const coordsNearSgw = new google.maps.LatLng(
          45.49789030085062,
          -73.5781341143213
        );
        const sgw = service.getNearestCampus(coordsNearSgw);
        expect(sgw).toBe('sgw');
      });
    });
    describe('given coordinates near loyola', () => {
      it("should return 'loy'", () => {
        const coordsNearLoy = new google.maps.LatLng(
          45.456845960438855,
          -73.64372282219342
        );
        const loy = service.getNearestCampus(coordsNearLoy);
        expect(loy).toBe('loy');
      });
    });
  });
  describe('getNextBus()', () => {
    describe('given monday 10 am', () => {
      it('should return ...', () => {});
    });
    describe('given thursday 2pm', () => {
      it('should return ...', () => {});
    });
    describe('given saturday 10pm', () => {
      it('should return ...', () => {});
    });
  });
});
