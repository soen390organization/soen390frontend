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
    cy.get('.material-symbols-outlined').contains('search').click();

    cy.get('input[placeholder="Choose starting point..."]').clear().type('Hall Building');
    cy.wait(2000);
    cy.contains('Hall Building').click();
    cy.wait(2000);
    cy.window().then((win) => {
      const centerX = win.innerWidth / 2;
      const centerY = win.innerHeight / 2;

      cy.wrap(null).then(() => {
        cy.get('body').click(centerX - 8, centerY);
      });
    });

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
