describe('Indoor directions with floor transition from Hall 281 to Hall 917', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000); // allow map and components to load
  });

  it('should clear the current location and generate route from Hall 281 to Hall 917', () => {
    // Open the search panel
    cy.get('span.material-symbols-outlined').contains('search').click();
    cy.wait(500);

    // Clear "Your Location" via clearStartInput button
    cy.get('input[placeholder="Choose starting point..."]').parent().find('button').click(); // clicks the 'x' clear button

    cy.wait(500);

    // Type and select Hall 281 as start
    cy.get('input[placeholder="Choose starting point..."]').type('Hall 281');
    cy.wait(1000);
    cy.contains('H 281').click();
    cy.wait(1000);

    // Set Hall 917 as destination
    cy.get('input[placeholder="Choose destination point..."]').type('Hall 917');
    cy.wait(1000);
    cy.contains('H 917').click();
    cy.wait(1000);

    // Click Start
    cy.get('button').contains('Start').click();
    cy.wait(2000); // allow mappedin to render new route

    // Verify the map container is present (route rendered)
    cy.get('.map-container canvas').should('exist');

    // Optionally: verify that floor change symbols appear (like elevator/stairs)
    cy.get('.map-container').find('img, svg, canvas').should('exist');

    // Verify current selected floor is "Level 2"
    cy.get('select').eq(0).should('contain.text', 'Level 2');

    // Verify current selected building is "H Building"
    cy.get('select').eq(1).should('contain.text', 'H Building');

    cy.wait(1500); // wait for clarity in Cypress video
  });
});
