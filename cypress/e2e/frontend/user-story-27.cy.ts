describe('Map - Nearby Points of Interest', () => {
  beforeEach(() => {
    cy.visit('/');
    Cypress.config('defaultCommandTimeout', 20000);
  });

  it('should display buildings and POIs and update destination when selected', () => {
    // Wait for the app to load
    cy.wait(1000);
    cy.get('.material-symbols-outlined').contains('search').click();

    // Click the handle bar to reveal the locations section.
    cy.get('.w-\\[120px\\].h-\\[10px\\].bg-\\[\\#d5d5d5\\]')
      .trigger('mousedown', { which: 1, clientY: 300 })
      .trigger('mousemove', { clientY: 100 })
      .trigger('mouseup', { force: true });
    cy.wait(2000);

    // For the buildings section, assume it's the first container.
    cy.get('div.flex.flex-col.items-start > div.flex.gap-4.overflow-x-auto.w-full.touch-pan-x')
      .first()
      .within(() => {
        // Check that the container contains "ER Building" and "Webster Library"
        cy.contains('ER Building').should('exist');
        cy.contains('Webster Library').should('exist');
      });
    cy.wait(1000);

    // Click on the card containing "ER Building" in the buildings section.
    cy.get('div.flex.flex-col.items-start > div.flex.gap-4.overflow-x-auto.w-full.touch-pan-x')
      .first()
      .contains('ER Building')
      .click();
    cy.wait(1000);

    // Verify that the destination input now shows "ER Building".
    cy.get('input[placeholder="Choose destination point..."]').should('have.value', 'ER Building');
    cy.wait(1000);
  });
});
