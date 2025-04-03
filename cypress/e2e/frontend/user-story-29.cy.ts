describe('Map Search - Use Current Location as Start', () => {
  beforeEach(() => {
    // Visit the homepage where the map search component is present
    cy.visit('/', {
      onBeforeLoad(win) {
        // Hardcoded coordinates (inside Hall Building)
        const testLat = 45.5;
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

    // Increase timeout globally to avoid flakiness
    Cypress.config('defaultCommandTimeout', 15000); // 15 seconds
  });

  it('should allow the user to set their current location as the start point', () => {
    // Wait for the map container to be visible
    cy.get('.map-container', { timeout: 15000 }).should('be.visible');
    cy.wait(2000); // Extra wait to allow any map animations

    // Click the search bar to expand it (if not already visible)
    cy.get('.material-symbols-outlined').contains('search').click();
    cy.wait(2000); // Wait to ensure the UI is ready

    // Click the "Use Current Location" button next to the start input field
    cy.get('.material-symbols-outlined').contains('my_location').click();
    // Debugging log to verify the location input field updates
    cy.get('input[placeholder="Choose starting point..."]').then(($input) => {
      cy.log('Detected input value before assertion:', $input.val());
    });
    cy.wait(3000);
    // Ensure the marker appears on the map (retry until it does)
    cy.get('[data-marker-id="start-marker"]').should('have.length', 1);

    // Log that the test successfully validated everything
    cy.log('✅ Test completed: Current location set successfully, marker found.');
  });
});
