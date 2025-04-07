describe('Hybrid indoor-outdoor route from H 281 to MB 5.457', () => {
  beforeEach(() => {
    cy.visit('/', {
      onBeforeLoad(win) {
        cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake((cb) => {
          return cb({
            coords: {
              latitude: 45.4971,
              longitude: -73.5788,
              accuracy: 100
            }
          });
        });
      }
    });
    cy.wait(1000);
  });

  it('should go from H 281 to MB 5.457 with indoor + outdoor + swipe + building switch', () => {
    // Open search panel
    cy.get('span.material-symbols-outlined').contains('search').click();
    cy.wait(1000);

    // Clear default start
    cy.get('input[placeholder="Choose starting point..."]').parent().find('button').click();
    cy.wait(1000);

    // Start: H 281
    cy.get('input[placeholder="Choose starting point..."]').type('H 281');
    cy.wait(1000);
    cy.contains('H 281').click();
    cy.wait(1000);

    // Destination: MB 5.457
    cy.get('input[placeholder="Choose destination point..."]').type('MB 5.457');
    cy.wait(1000);
    cy.contains('MB 5.457').click();
    cy.wait(1000);

    // Start directions
    cy.get('button').contains('Start').click();
    cy.wait(1000);

    // Select H Building and Level 2
    cy.get('select').eq(1).select('H Building');
    cy.wait(1000);
    cy.get('select').eq(0).select('Level 2');
    cy.wait(1000);
    cy.get('.map-container canvas').should('exist');
    cy.wait(1000);

    // Toggle to outdoor map
    cy.get('app-switch-map-button > button').click();
    cy.wait(1000);

    // Swipe up
    cy.get('div.w-\\[120px\\].h-\\[10px\\].rounded-full.mt-2')
      .trigger('mousedown', { which: 1, clientY: 300 })
      .trigger('mousemove', { clientY: 100 })
      .trigger('mouseup', { force: true });
    cy.wait(1000);

    // Assert outdoor directions
    cy.get('.footer-content').should('contain.text', 'Head southwest');
    cy.wait(1000);

    // Swipe down
    cy.get('div.w-\\[120px\\].h-\\[10px\\].rounded-full.mt-2')
      .trigger('mousedown', { which: 1, clientY: 100 })
      .trigger('mousemove', { clientY: 300 })
      .trigger('mouseup', { force: true });
    cy.wait(1000);

    // Toggle back to indoor
    cy.get('app-switch-map-button > button').click();
    cy.wait(1000);

    // Switch to MB Building and Level 1
    cy.get('select').eq(1).select('MB Building');
    cy.wait(1000);
    cy.get('select').eq(0).select('Level 1');
    cy.wait(1000);

    // Final assertions
    cy.get('select').eq(0).should('contain.text', 'Level 1');
    cy.wait(1000);
    cy.get('select').eq(1).should('contain.text', 'MB Building');
    cy.wait(1000);
    cy.get('.map-container canvas').should('exist');
    cy.wait(1000);
  });
});
