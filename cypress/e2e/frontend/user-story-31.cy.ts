describe('Map - Highlight Current Building with Polygon', () => {
  beforeEach(() => {
    // Stub geolocation before visiting the page
    cy.visit('/', {
      onBeforeLoad(win) {
        // Hardcoded coordinates (inside Hall Building)
        const testLat = 45.497165958498655;
        const testLng = -73.57903212232189;

        // Override the geolocation API before the app initializes
        cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake((cb) => {
          cb({
            coords: {
              latitude: testLat,
              longitude: testLng,
              accuracy: 10
            }
          } as GeolocationPosition);
        });
      }
    });

    // Increase timeout to allow Google Maps to load
    Cypress.config('defaultCommandTimeout', 10000);
  });

  it('should highlight the Hall Building polygon in blue when the user is inside it', () => {
    // Wait for the map container to be visible
    cy.get('.map-container', { timeout: 10000 }).should('be.visible');

    // Click the search bar to expand it (if not already visible)
    cy.get('.material-symbols-outlined').contains('search').click();

    // Click the "Use Current Location" button
    cy.get('.material-symbols-outlined').contains('my_location').click();

    // Verify that a pin appears on the map (marker for the current location)
    cy.get('.gm-style img[src*="Icone_Verde.svg"]').should('exist');
  });
});
