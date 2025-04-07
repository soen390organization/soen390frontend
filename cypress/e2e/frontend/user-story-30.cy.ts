describe('Map Search - Select Start and Destination Buildings', () => {
  beforeEach(() => {
    // Visit the homepage
    cy.visit('/');

    // Increase timeout to allow Google Maps to load
    Cypress.config('defaultCommandTimeout', 10000);
  });

  it('should allow a user to select a start and destination building and generate directions', () => {
    // Click the search bar to expand it
    cy.get('.material-symbols-outlined').contains('search').click();

    // Enter "Hall" in the start location input and press Enter

    cy.get('input[placeholder="Choose starting point..."]').clear().type('Hall Building');
    cy.wait(3000);
    cy.contains('Hall Building').click();
    cy.wait(2000);

    cy.get('input[placeholder="Choose destination point..."]').clear().type('John Molson');
    cy.wait(3000);
    cy.contains('John Molson').click();
    cy.wait(2000);

    // Verify that the start marker exists (adjust the selector if needed)
    cy.get('div[role="button"][tabindex="0"]').should('have.length', 1);

    // Verify that the destination marker exists (adjust the selector if needed)
    cy.get('div[role="button"][tabindex="-1"]').should('have.length', 1);

    //@TODO: need to deferentiate between icons
    //@TODO: need to verify that the directions are displayed
  });
});
