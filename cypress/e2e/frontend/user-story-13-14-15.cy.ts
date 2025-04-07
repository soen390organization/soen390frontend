describe('Map - Directions and Route Generation for Multi-Transportation Modes', () => {
  beforeEach(() => {
    cy.visit('/', {
      onBeforeLoad(win) {
        // Stub geolocation to simulate being inside SGW campus.
        const testLat = 45.497165958498655;
        const testLng = -73.57903212232189;
        cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake((cb) => {
          cb({
            coords: {
              latitude: testLat,
              longitude: testLng,
              accuracy: 10
            }
          });
        });
      }
    });
    Cypress.config('defaultCommandTimeout', 20000);
  });

  it('should generate a route from JMSB to Vanier Library and allow switching between transportation modes', () => {
    // Expand the search inputs.
    cy.get('.material-symbols-outlined').contains('search').click();

    // Enter start location (JMSB) then press Enter.
    cy.get('input[placeholder="Choose starting point..."]').clear().type('John Molson Guy');
    cy.wait(3000);
    cy.contains('John Molson').click();
    cy.wait(2000);

    // Enter destination (Vanier Library) then press Enter.
    cy.get('input[placeholder="Choose destination point..."]')
      .clear()
      .type('Vanier Library Loyola');
    cy.wait(3000);
    cy.contains('Vanier Library').click();
    cy.wait(3000);

    // Verify that two markers are displayed (assuming markers contain "Icone_Verde.svg").
    cy.get('div[role="button"][tabindex="0"]').should('have.length', 1);
    cy.get('div[role="button"][tabindex="-1"]').should('have.length', 1);

    // @TODO: CAREFUL - Shuttle Bus returns the word 'mins' as minutes rather than mins (like the rest)...
    cy.contains(/\d+ mins/, { timeout: 15000 }).should('be.visible');

    // Click the "Start" button to generate the route.
    cy.contains('button', 'Start').click();
    cy.wait(2000);

    // Click on the handle bar using the provided class.
    cy.get('.w-\\[120px\\].h-\\[10px\\].bg-\\[\\#d5d5d5\\]', { timeout: 5000 })
      .should('be.visible')
      .click();
    cy.wait(2000);

    // Verify that the directions component is displayed.
    cy.get('app-directions', { timeout: 10000 }).should('exist');

    // Capture the initial directions text.
    cy.get('app-directions')
      .invoke('text')
      .then((initialText) => {
        // Click the Bus button (icon: "directions_bus").
        cy.get('app-directions').contains('span', 'directions_bus').parents('button').click();
        cy.wait(3000);
        cy.get('app-directions')
          .invoke('text')
          .should((busText) => {
            expect(busText, 'Directions text should update for bus').to.not.equal(initialText);
          });

        // @TODO: we have to fix this as somethimes the button does not appear when there is no schedule for it at that time!
        // Click the Shuttle button (icon: "directions_transit").
        // cy.get('app-directions')
        //   .invoke('text')
        //   .then((busUpdatedText) => {
        //     cy.get('app-directions')
        //       .contains('span', 'directions_transit')
        //       .parents('button')
        //       .click();
        //     cy.wait(3000);
        //     cy.get('app-directions')
        //       .invoke('text')
        //       .should((shuttleText) => {
        //         expect(shuttleText, 'Directions text should update for shuttle').to.not.equal(
        //           busUpdatedText
        //         );
        //       });

        //     // Click the Car button (icon: "directions_car").
        //     cy.get('app-directions')
        //       .invoke('text')
        //       .then((shuttleUpdatedText) => {
        //         cy.get('app-directions')
        //           .contains('span', 'directions_car')
        //           .parents('button')
        //           .click();
        //         cy.wait(3000);
        //         cy.get('app-directions')
        //           .invoke('text')
        //           .should((carText) => {
        //             expect(carText, 'Directions text should update for car').to.not.equal(
        //               shuttleUpdatedText
        //             );
        //           });

        //         // Click the Walking button (icon: "directions_walk").
        //         cy.get('app-directions')
        //           .invoke('text')
        //           .then((carUpdatedText) => {
        //             cy.get('app-directions')
        //               .contains('span', 'directions_walk')
        //               .parents('button')
        //               .click();
        //             cy.wait(3000);
        //             cy.get('app-directions')
        //               .invoke('text')
        //               .should((walkText) => {
        //                 expect(walkText, 'Directions text should update for walking').to.not.equal(
        //                   carUpdatedText
        //                 );
        //               });
        //           });
        //       });
        //   });
      });

    // Click the "End" button to hide the directions.
    cy.contains('button', 'End').click();
    cy.wait(2000);
    cy.get('app-directions').should('not.exist');
  });
});
