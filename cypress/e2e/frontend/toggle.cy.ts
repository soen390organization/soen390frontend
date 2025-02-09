describe('Google Map Component & Toggle', () => {
  beforeEach(() => {
    // Visit the page where the Google Map component is rendered
    cy.visit('/'); // Update the URL if your app uses a different route

    // Increase the timeout for all commands to account for map loading
    Cypress.config('defaultCommandTimeout', 10000); // 10 seconds
  });

  it('should toggle between SGW and LOY campuses when the button is clicked', () => {
    // Wait for the map container to be visible
    cy.get('.map-container', { timeout: 10000 }).should('be.visible');

    // Check the initial campus text
    cy.get('.switch-campus-select').should('contain', 'SGW');

    // Click the toggle button
    cy.get('.switch-campus-select').click();

    // Check if the campus text has changed to LOY
    cy.get('.switch-campus-select').should('contain', 'LOY');

    // Wait for the map to update (optional, if needed)
    cy.wait(2000); // Adjust the delay as needed

    // Click the toggle button again
    cy.get('.switch-campus-select').click();

    // Check if the campus text has changed back to SGW
    cy.get('.switch-campus-select').should('contain', 'SGW');
  });
});
