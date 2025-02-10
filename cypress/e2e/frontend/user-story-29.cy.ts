describe('Map Search - Use Current Location as Start', () => {
  beforeEach(() => {
    // Visit the homepage where the map search component is present
    cy.visit('/');

    // Increase timeout to allow Google Maps to load
    Cypress.config('defaultCommandTimeout', 10000);
  });

  it('should allow the user to set their current location as the start point', () => {
    // Wait for the map container to be visible
    cy.get('.map-container', { timeout: 10000 }).should('be.visible');

    // Click the search bar to expand it (if not already visible)
    cy.get('.material-symbols-outlined').contains('search').click();

    // Click the "Use Current Location" button next to the start input field
    cy.get('.material-symbols-outlined').contains('my_location').click();

    // Wait for the location to be set
    cy.wait(3000);

    // Verify the start location input field is set to "Your Location"
    cy.get('input[placeholder="Choose starting point..."]').should('have.value', 'Your Location');

    // Verify that a pin appears on the map (marker for the current location)
    cy.get('.gm-style img[src*="Icone_Verde.svg"]').should('exist'); // Start location pin
  });
});
