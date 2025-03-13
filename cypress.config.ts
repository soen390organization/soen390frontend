import { defineConfig } from 'cypress';

export default defineConfig({
  projectId: 'xeqrrj', // <- add this line
  viewportWidth: 430,
  viewportHeight: 932,
  e2e: {
    baseUrl: 'http://localhost:8100', // Change to match your Ionic app's local server port
    setupNodeEvents(on, config) {
      // Implement node event listeners here if needed
    },
    supportFile: 'cypress/support/e2e.ts',
    video: true, // Disable video recording (optional)
    chromeWebSecurity: false,
  },
});
