import { GeolocationService } from './geolocation.service';

describe('GeoLocation Service...', () => {
  let service = new GeolocationService();
  describe('Given the user is in Hall Building...', () => {
    const currentLocation = {
      lat: 45.49724206314789,
      lng: -73.57905238471409,
    };
    it("Should return 'Hall", async () => {
      const currentBuildingName =
        await service.getCurrentBuilding(currentLocation);
      console.log('current building name: ', currentBuildingName, '...');
      expect(currentBuildingName).toBe('Hall');
    });
  });
  describe('Given the user is in JMSB Building...', () => {
    const currentLocation = {
      lat: 45.495269700671045,
      lng: -73.57892221858457,
    };
    it("Should return JMSB", async () => {
      const currentBuildingName =
        await service.getCurrentBuilding(currentLocation);
      console.log('current building name: ', currentBuildingName, '...');
      expect(currentBuildingName).toBe('John Molson School of Business');
    });
  });
  describe('Given the user is not in a building', () => {
    const currentLocation = {
      lat: 45.49666690990893,
      lng: -73.57928799583352,
    };
    it("Should return 'null'", async () => {
      const currentBuildingName =
        await service.getCurrentBuilding(currentLocation);
      expect(currentBuildingName).toBeNull();
    });
  });
});
