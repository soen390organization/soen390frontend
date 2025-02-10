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
    cy.get('app-switch-campus-button').should('contain', 'SGW');

    cy.wait(5000); // Adjust the delay as needed

    // Click the toggle button
    cy.get('app-switch-campus-button').click();

    // Check if the campus text has changed to LOY
    cy.get('app-switch-campus-button').should('contain', 'LOY');

    // Wait for the map to update (optional, if needed)
    cy.wait(5000); // Adjust the delay as needed

    // Click the toggle button again
    cy.get('app-switch-campus-button').click();

    // Check if the campus text has changed back to SGW
    cy.get('app-switch-campus-button').should('contain', 'SGW');
  });
});
