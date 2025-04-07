describe('Google Maps InfoWindow opens after clicking Hall marker', () => {
  beforeEach(() => {
    // Mock the user's location to be at the Hall Building
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

    cy.wait(1000); // wait for map + markers to load
  });

  it('should display building info when clicking the Hall Building marker', () => {
    // Wait for and click the advanced marker element near the Hall Building
    cy.get('gmp-advanced-marker[aria-label="Your Location"]', { timeout: 10000 }).should('exist');
    cy.wait(1000);
    cy.get('gmp-advanced-marker[aria-label="Your Location"]').click({ force: true });

    cy.wait(1000); // wait for InfoWindow to render

    // Assert content of the InfoWindow
    cy.get('div[role="dialog"].gm-style-iw')
      .should('be.visible')
      .within(() => {
        cy.wait(1000);
        cy.get('#buildingName').should('contain.text', 'Hall');
        cy.wait(1000);
        cy.get('#buildingAddress').should('contain.text', '1455 Blvd. De Maisonneuve');
        cy.wait(1000);
        cy.get('#buildingFaculties').within(() => {
          cy.contains('Gina Cody School').should('exist');
          cy.wait(1000);
          cy.contains('Faculty of Arts and Science').should('exist');
        });
        cy.wait(1000);
        cy.get('#buildingAccessibility').should('have.attr', 'src').and('include', 'icons8');
      });

    cy.wait(1000); // allow Cypress recording to show result
  });
});
