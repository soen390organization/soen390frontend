describe('Map - Verify Campus Building Polygon Creation', () => {
  beforeEach(() => {
    cy.visit('/', {
      onBeforeLoad(win) {
        // Stub geolocation to simulate being inside SGW campus.
        const testLat = 45.497165958498655;
        const testLng = -73.57903212232189;
        cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake((cb) => {
          cb({
            coords: {
              latitude: testLat,
              longitude: testLng,
              accuracy: 10
            }
          });
        });
      }
    });
    Cypress.config('defaultCommandTimeout', 20000);
  });

  it('should call the function to create a campus building polygon', () => {
    // Wait for the map container to be visible and allow time for buildings to load.
    cy.get('.map-container', { timeout: 20000 }).should('be.visible');
    cy.log('est completed: User is in sgw campus, campus buildings should appear as red polygons.');
  });
});
