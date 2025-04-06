describe('Indoor directions to a POI (Bathroom)', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000); // allow map and app to load
  });

  it('should navigate from Hall 281 to H Bathroom and show correct map + floor', () => {
    // Open the search UI
    cy.get('span.material-symbols-outlined').contains('search').click();
    cy.wait(500);

    // Clear default start location
    cy.get('input[placeholder="Choose starting point..."]').parent().find('button').click();
    cy.wait(500);

    // Type and select Hall 281 as start
    cy.get('input[placeholder="Choose starting point..."]').type('Hall 281');
    cy.wait(1000);
    cy.contains('H 281').click();
    cy.wait(1000);

    // Type and select H Bathroom as destination (POI)
    cy.get('input[placeholder="Choose destination point..."]').type('Hall Bathroom');
    cy.wait(1000);
    cy.contains('H Bathroom').click();
    cy.wait(1000);

    // Click Start to generate directions
    cy.get('button').contains('Start').click();
    cy.wait(2000); // wait for map + route to render

    // ✅ Assert route is rendered on the map
    cy.get('.map-container canvas').should('exist');

    // ✅ Assert floor is Level 2
    cy.get('select').eq(0).should('contain.text', 'Level 2');

    // ✅ Assert building is H Building
    cy.get('select').eq(1).should('contain.text', 'H Building');

    cy.wait(1500); // for visual recording clarity
  });
});
