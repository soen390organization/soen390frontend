describe('Indoor directions with floor transition from Hall 281 to Hall 917', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(5000); // allow map and components to load fully
  });

  it('should clear the current location and generate route from Hall 281 to Hall 917', () => {
    // Open the search panel
    cy.get('span.material-symbols-outlined').contains('search').click();
    cy.wait(5000);

    // Clear "Your Location" via clearStartInput button
    cy.get('input[placeholder="Choose starting point..."]').parent().find('button').click();
    cy.wait(5000);

    // Type and select Hall 281 as start
    cy.get('input[placeholder="Choose starting point..."]').type('Hall 281');
    cy.wait(5000);
    cy.contains('H 281').click();
    cy.wait(5000);

    // Set Hall 917 as destination
    cy.get('input[placeholder="Choose destination point..."]').type('Hall 917');
    cy.wait(5000);
    cy.contains('H 917').click();
    cy.wait(5000);

    // Click Start
    cy.get('button').contains('Start').click();
    cy.wait(5000);

    // Verify the map container is present
    cy.get('.map-container canvas').should('exist');
    cy.wait(5000);

    // Optionally verify icons or rendered elements for transition
    cy.get('.map-container').find('img, svg, canvas').should('exist');
    cy.wait(5000);

    // Verify current selected floor
    cy.get('select').eq(0).should('contain.text', 'Level 2');
    cy.wait(5000);

    // Verify current selected building
    cy.get('select').eq(1).should('contain.text', 'H Building');
    cy.wait(5000);
  });
});
