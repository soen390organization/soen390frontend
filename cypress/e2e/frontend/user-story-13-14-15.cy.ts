describe('Map - Directions and Route Generation for Multi-Transportation Modes', () => {
  beforeEach(() => {
    cy.visit('/');
    Cypress.config('defaultCommandTimeout', 20000);
  });

  it('should generate a route from JMSB to Vanier Library and allow switching between transportation modes', () => {
    // Expand the search inputs.
    cy.get('.material-symbols-outlined').contains('search').click();

    // Enter start location (JMSB) then press Enter.
    cy.get('input[placeholder="Choose starting point..."]')
      .clear()
      .type('JMSB');
    cy.wait(1000);
    cy.get('input[placeholder="Choose starting point..."]').type('{enter}');
    cy.wait(2000);

    // Enter destination (Vanier Library) then press Enter.
    cy.get('input[placeholder="Choose destination point..."]')
      .clear()
      .type('Vanier Library');
    cy.wait(1000);
    cy.get('input[placeholder="Choose destination point..."]').type('{enter}');
    cy.wait(2000);

    // Verify that two markers are displayed (assuming markers contain "Icone_Verde.svg").
    cy.get('.gm-style img[src*="Icone_Verde.svg"]', { timeout: 10000 })
      .should('have.length', 2);

    // Check that the ETA "19 mins (8310m)" is visible.
    cy.contains('18 mins (8099 m)').should('be.visible');

    // Click the "Start" button to generate the route.
    cy.contains('button', 'Start').click();
    cy.wait(2000);

    // Click on the handle bar using the provided class.
    cy.get('.w-\\[100px\\].h-\\[10px\\].bg-\\[\\#d5d5d5\\].my-\\[10px\\].mx-auto.rounded-full.cursor-pointer', { timeout: 10000 })
      .should('be.visible')
      .click();
    cy.wait(2000);

    // Verify that the directions component is displayed.
    cy.get('app-directions', { timeout: 10000 }).should('exist');

    // Capture the initial directions text.
    cy.get('app-directions').invoke('text').then((initialText) => {

      // Click the Bus button (icon: "directions_bus").
      cy.get('app-directions').contains('span', 'directions_bus').parents('button').click();
      cy.wait(3000);
      cy.get('app-directions').invoke('text').should((busText) => {
        expect(busText, 'Directions text should update for bus').to.not.equal(initialText);
      });

      // Click the Shuttle button (icon: "directions_transit").
      cy.get('app-directions').invoke('text').then((busUpdatedText) => {
        cy.get('app-directions').contains('span', 'directions_transit').parents('button').click();
        cy.wait(3000);
        cy.get('app-directions').invoke('text').should((shuttleText) => {
          expect(shuttleText, 'Directions text should update for shuttle').to.not.equal(busUpdatedText);
        });

        // Click the Car button (icon: "directions_car").
        cy.get('app-directions').invoke('text').then((shuttleUpdatedText) => {
          cy.get('app-directions').contains('span', 'directions_car').parents('button').click();
          cy.wait(3000);
          cy.get('app-directions').invoke('text').should((carText) => {
            expect(carText, 'Directions text should update for car').to.not.equal(shuttleUpdatedText);
          });

          // Click the Walking button (icon: "directions_walk").
          cy.get('app-directions').invoke('text').then((carUpdatedText) => {
            cy.get('app-directions').contains('span', 'directions_walk').parents('button').click();
            cy.wait(3000);
            cy.get('app-directions').invoke('text').should((walkText) => {
              expect(walkText, 'Directions text should update for walking').to.not.equal(carUpdatedText);
            });
          });
        });
      });
    });

    // Click the "End" button to hide the directions.
    cy.contains('button', 'End').click();
    cy.wait(2000);
    cy.get('app-directions').should('not.exist');
  });
});
