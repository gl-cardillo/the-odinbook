import { defineConfig } from "cypress";

// runs against the built client and the e2e API, see "npm run e2e"
export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:4173",
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts",
    video: false,
    // read in the tests with Cypress.expose("apiUrl")
    expose: {
      apiUrl: "http://localhost:5050",
    },
  },
});
