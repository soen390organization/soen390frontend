import { GeolocationService } from './geolocation.service';

describe('GeoLocation Service', () => {
  let service = new GeolocationService();
  describe('Given the user is in a building', () => {
    const currentLocation = {
      lat: 45.495542904441386,
      lng: -73.57820263386837,
    };
    it("Should return the building's name", async () => {
      const currentBuildingName =
        await service.getCurrentBuilding(currentLocation);
      expect(currentBuildingName).not.toBeNull();
    });
  });
  describe('Given the user is not in a building', () => {
    const currentLocation = {
      lat: 45.49649085350402,
      lng: -73.5789098608284,
    };
    const expectedBuildingName = null;
    it("Should return 'null'", async () => {
      const currentBuildingName =
        await service.getCurrentBuilding(currentLocation);
      expect(currentBuildingName).toBeNull();
    });
  });
});
