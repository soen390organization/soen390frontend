describe('Map - Directions and Route Generation', () => {
  beforeEach(() => {
    cy.visit('/');
    Cypress.config('defaultCommandTimeout', 20000);
  });

  it('should generate a route, show directions after clicking the handle bar, and hide directions when End is clicked', () => {
    // Expand the search bar if hidden.
    cy.get('.material-symbols-outlined').contains('search').click();

    // Enter start location and then press Enter.
    cy.get('input[placeholder="Choose starting point..."]')
      .clear()
      .type('Hall Building Auditorium');
    cy.wait(2000);
    cy.get('input[placeholder="Choose starting point..."]').type('{enter}');
    cy.wait(2000);

    // Enter destination and then press Enter.
    cy.get('input[placeholder="Choose destination point..."]').clear().type('John Molson Guy');
    cy.wait(3000);
    cy.get('input[placeholder="Choose destination point..."]').type('{enter}');
    cy.wait(2000);

    // Verify that two markers are displayed.
    cy.get('div[role="button"][tabindex="0"]').should('have.length', 1);
    cy.get('div[role="button"][tabindex="-1"]').should('have.length', 1);

    // Check that the ETA "1 min (212 m)" is visible.
    cy.contains(/\d+ mins/, { timeout: 15000 }).should('be.visible');

    // Click the "Start" button to generate the route.
    cy.contains('button', 'Start').click();

    cy.wait(2000);

    // Click the handle bar using the provided class.
    cy.get('.w-\\[120px\\].h-\\[10px\\].bg-\\[\\#d5d5d5\\]', { timeout: 5000 })
      .should('be.visible')
      .click();
    cy.wait(2000);

    cy.wait(2000);

    // Verify that the directions component is displayed by checking for step instructions.
    // For example, we expect at least one element with the instruction text container.
    cy.get('app-directions', { timeout: 10000 })
      .should('exist')
      .and(($steps) => {
        expect($steps.length, 'At least one step is displayed').to.be.greaterThan(0);
        const stepText = $steps.first().text().trim();
        expect(stepText, 'Step instruction should not be empty').to.have.length.greaterThan(0);
      });

    // Click the "End" button to end directions.
    cy.contains('button', 'End').click();

    cy.wait(2000);

    // Verify that the directions component disappears.
    cy.get('app-directions').should('not.exist');
    cy.get('.w-\\[120px\\].h-\\[10px\\].bg-\\[\\#d5d5d5\\]', { timeout: 5000 })
      .should('be.visible')
      .click();
    cy.wait(2000);

    cy.wait(2000);
  });
});
