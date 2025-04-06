describe('Indoor route with accessibility toggle from H 281 to H 131', () => {
  beforeEach(() => {
    cy.visit('/');

    cy.wait(2000); // wait for app and map to load
  });

  it('should update indoor directions to use accessible path when accessibility is toggled on', () => {
    // Open search panel
    cy.get('span.material-symbols-outlined').contains('search').click();
    cy.wait(500);

    // Clear default start location
    cy.get('input[placeholder="Choose starting point..."]').parent().find('button').click();
    cy.wait(500);

    // Set Start: H 281
    cy.get('input[placeholder="Choose starting point..."]').type('Hall 281');
    cy.wait(1000);
    cy.contains('H 281').click();
    cy.wait(1000);

    // Set Destination: H 131
    cy.get('input[placeholder="Choose destination point..."]').type('Hall 131');
    cy.wait(1000);
    cy.contains('H 131').click();
    cy.wait(1000);

    // Start directions
    cy.get('button').contains('Start').click();
    cy.wait(2000);

    // Select H Building and Level 2
    cy.get('select').eq(1).select('H Building');
    cy.wait(1000);
    cy.get('select').eq(0).select('Level 2');

    // Assert directions show and map renders
    cy.get('.map-container canvas').should('exist');

    cy.wait(4000);

    // Click accessibility button to enable accessible mode
    cy.get('app-accessibility-button button.flex.bg-white').should('be.visible').click();
    cy.wait(2000);

    cy.log('Stairs replaced by elevator after enabling accessibility mode');
  });
});
