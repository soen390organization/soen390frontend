describe('Map - Directions to Mango Bay', () => {
  beforeEach(() => {
    cy.visit('/', {
      onBeforeLoad(win) {
        // Stub geolocation to simulate being inside SGW campus.
        const testLat = 45.497165958498655;
        const testLng = -73.57903212232189;
        cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake(
          (cb) => {
            cb({
              coords: {
                latitude: testLat,
                longitude: testLng,
                accuracy: 10,
              },
            });
          },
        );
      },
    });
    Cypress.config('defaultCommandTimeout', 20000);
  });

  it('should generate directions to Mango Bay when the user selects it and sets the current location as start', () => {
    // Wait for the app to load.
    cy.wait(1000);

    // Click on the handle bar to reveal the locations section.
    cy.get(
      '.w-\\[100px\\].h-\\[10px\\].bg-\\[\\#d5d5d5\\].my-\\[10px\\].mx-auto.rounded-full.cursor-pointer',
    )
      .should('be.visible')
      .click();
    cy.wait(1000);

    // In the Points of Interest section (second app-location-cards), click on Mango Bay.
    cy.get('app-location-cards')
      .eq(1)
      .within(() => {
        cy.wait(1000);
        cy.contains('Mango Bay').should('exist').click();
      });
    cy.wait(1000);

    // Close the interaction bar by clicking the handle bar again.
    cy.get(
      '.w-\\[100px\\].h-\\[10px\\].bg-\\[\\#d5d5d5\\].my-\\[10px\\].mx-auto.rounded-full.cursor-pointer',
    )
      .should('be.visible')
      .click();
    cy.wait(1000);

    // Select user's current location as the start point by clicking the my_location icon.
    cy.get('input[placeholder="Choose starting point..."]').should(
      'be.visible',
    );
    cy.get('span.material-symbols-outlined').contains('my_location').click();
    cy.wait(1000);

    // Click the Start button to generate directions.
    cy.contains('button', 'Start').click();
    cy.wait(1000);

    // Click on the handle bar to reveal the locations section.
    cy.get(
      '.w-\\[100px\\].h-\\[10px\\].bg-\\[\\#d5d5d5\\].my-\\[10px\\].mx-auto.rounded-full.cursor-pointer',
    )
      .should('be.visible')
      .click();
    cy.wait(1000);

    // Assert that the directions component appears.
    cy.get('app-directions', { timeout: 10000 }).should('exist');
    cy.wait(1000);
  });
});
