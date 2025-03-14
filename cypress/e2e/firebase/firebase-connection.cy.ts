describe('Firebase Connection Test', () => {
  it('should successfully connect to Firebase', () => {
    cy.checkFirebaseConnection().then((isConnected) => {
      expect(isConnected).to.be.true;
    });
  });
});
