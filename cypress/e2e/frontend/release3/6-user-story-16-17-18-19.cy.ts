describe('Calendar Integration - Cypress Mock Mode', () => {
  beforeEach(() => {
    // Intercept Google Calendar API for calendars
    cy.intercept('GET', 'https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      fixture: 'google_calendars.json'
    }).as('getCalendars');

    // Intercept Google Calendar API for events
    cy.intercept('GET', /https:\/\/www.googleapis.com\/calendar\/v3\/calendars\/.*\/events.*/, {
      fixture: 'calendar_events_concordia.json'
    }).as('getEvents');

    // Visit homepage
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
  });

  it('loads calendar, selects class, and starts navigation', () => {
    // Open profile drawer
    cy.get('div.rounded-3xl.bg-white.shadow-lg').first().click({ force: true });
    cy.wait(2000);

    // Click "Sync Google Calendar"
    cy.contains('button', 'Sync Google Calendar').click({ force: true });
    cy.wait(2000);

    // Click Concordia calendar
    cy.contains('li', 'Concordia').click({ force: true });

    cy.get('span.material-symbols-outlined')
      .filter((_, el) => el.textContent?.trim() === 'arrow_back')
      .click({ force: true });
    cy.wait(2000);

    // Swipe up interaction bar
    cy.get('div.w-\\[120px\\].h-\\[10px\\].bg-\\[\\#d5d5d5\\].rounded-full')
      .trigger('mousedown', { which: 1 })
      .trigger('mousemove', { clientY: 100 }) // swipe up
      .trigger('mouseup', { force: true });
    cy.wait(2000);

    // Click second class (ex: SOEN)
    cy.get('app-event-card .hover\\:cursor-pointer').eq(1).click({ force: true });
    cy.wait(2000);

    // Open search bar
    cy.get('span.material-symbols-outlined').contains('search').click();
    cy.wait(2000);

    // Assert destination contains SOEN
    cy.get('input[placeholder="Choose destination point..."]')
      .invoke('val')
      .should('include', 'COMP');

    // Click Start
    cy.contains('button', 'Start').click({ force: true });
    cy.wait(2000);

    // Click End
    cy.contains('button', 'End').click({ force: true });
    cy.wait(2000);
  });
});
