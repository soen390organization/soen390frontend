 describe('Map Search - Select Start and Destination Buildings', () => {
  beforeEach(() => {
    // Visit the homepage
    cy.visit('/');

    // Increase timeout to allow Google Maps to load
    Cypress.config('defaultCommandTimeout', 10000);
  });

  it('should allow a user to select a start and destination building and generate directions', () => {
    // Ensure the map container is visible
    cy.get('.map-container', { timeout: 10000 }).should('be.visible');

    // Click the search bar to expand it
    cy.get('.material-symbols-outlined').contains('search').click();

    // Enter "Hall" in the start location input and press Enter
    cy.get('input[placeholder="Choose starting point..."]')
      .type('Hall')
      .type('{enter}') // Simulate Enter key
      .blur(); 

    // Wait for the first pin (start location) to be added
    cy.wait(2000);

    // Enter "JMSB" in the destination input and press Enter
    cy.get('input[placeholder="Choose destination point..."]')
      .type('JMSB{enter}');

    // Wait for the second pin (destination location) to be added
    cy.wait(2000);

    // Ensure exactly two markers are added to the map
    cy.get('.gm-style img[src*="Icone_Verde.svg"]').should('exist'); // Start marker
    cy.get('.gm-style img[src*="Icone_Vermelho.svg"]').should('exist'); // Destination marker

  });
});
