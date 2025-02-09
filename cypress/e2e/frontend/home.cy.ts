describe("Home Page", () => {
    beforeEach(() => {
      cy.visit("/"); // Open the home page
    });
  
    it("should display the welcome message", () => {
      // Check if the welcome message exists (assuming the user observable emits a default name)
      cy.get("ion-title").contains("Welcome");
    });
  
    it("should load the Google Map component", () => {
      // Check if the <app-google-map> component is present in the DOM
      cy.get("app-google-map").should("exist");
    });
  });
  