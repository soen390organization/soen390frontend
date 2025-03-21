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

    cy.get('input[placeholder="Choose starting point..."]').clear().type('Hall Building');
    cy.wait(3000);
    cy.contains('li#start-item', 'Hall Building').click();
    cy.wait(2000);

    cy.get('input[placeholder="Choose destination point..."]').clear().type('John Molson');
    cy.wait(3000);
    cy.contains('li#destination-item', 'John Molson').click();
    cy.wait(2000);

    // Verify that the start marker exists (adjust the selector if needed)
    cy.get('.gm-style img[src*="Icone_Verde.svg"]', { timeout: 10000 }).should('exist');

    // Verify that the destination marker exists (adjust the selector if needed)
    cy.get('.gm-style img[src*="Icone_Verde.svg"]', { timeout: 10000 }).should('exist');

    //@TODO: need to deferentiate between icons
    //@TODO: need to verify that the directions are displayed
  });
});
