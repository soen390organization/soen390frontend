describe('Map - Nearby Points of Interest', () => {
  beforeEach(() => {
    cy.visit('/');
    Cypress.config('defaultCommandTimeout', 20000);
  });

  it('should display buildings and POIs and update destination when selected', () => {
    // Wait for the app to load
    cy.wait(1000);

    // Click the handle bar to reveal the locations section.
    cy.get(
      '.w-\\[100px\\].h-\\[10px\\].bg-\\[\\#d5d5d5\\].my-\\[10px\\].mx-auto.rounded-full.cursor-pointer'
    )
      .should('be.visible')
      .click();
    cy.wait(1000);

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

    // For the Points of Interest section, assume it's the second container.
    cy.get('div.flex.flex-col.items-start > div.flex.gap-4.overflow-x-auto.w-full.touch-pan-x')
      .eq(1)
      .within(() => {
        cy.contains('Mango Bay').should('exist');
      });
    cy.wait(1000);

    // Click on the "McKibbin's" card in the POI section.
    cy.get('div.flex.flex-col.items-start > div.flex.gap-4.overflow-x-auto.w-full.touch-pan-x')
      .eq(1)
      .contains('Mango Bay')
      .click();
    cy.wait(1000);

    // Verify that the destination input now shows "McKibbin's".
    cy.get('input[placeholder="Choose destination point..."]').should('have.value', 'Mango Bay');
    cy.wait(1000);
  });
});
