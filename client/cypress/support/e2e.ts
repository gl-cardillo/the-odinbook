import type { AuthResponse } from "../../src/types";

const api = (path: string) => `${Cypress.expose("apiUrl")}${path}`;

// unique per call, names must be 2 to 15 letters or numbers
let count = 0;
const stamp = () => `${Date.now().toString(36).slice(-5)}${++count}`;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      // a new account made through the API, faster than the form
      signupApi(
        firstname?: string
      ): Chainable<AuthResponse & { email: string; password: string }>;
      // opens a page already logged in as that account
      visitAs(session: AuthResponse, url: string): Chainable<void>;
      // calls the API as that account, to act as a second user
      apiAs(
        session: AuthResponse,
        method: string,
        path: string,
        body?: object
      ): Chainable<Cypress.Response<unknown>>;
    }
  }
}

Cypress.Commands.add("signupApi", (firstname = "Tester") => {
  const password = "password123";
  const email = `${firstname.toLowerCase()}.${stamp()}@example.com`;
  return cy
    .request("POST", api("/auth/signup"), {
      firstname,
      lastname: `T${stamp()}`,
      email,
      password,
    })
    .then((res) => ({ ...(res.body as AuthResponse), email, password }));
});

Cypress.Commands.add("visitAs", (session, url) => {
  cy.visit(url, {
    onBeforeLoad(win) {
      win.localStorage.setItem("user", JSON.stringify(session.user));
      win.localStorage.setItem("token", JSON.stringify(session.token));
    },
  });
});

Cypress.Commands.add("apiAs", (session, method, path, body) =>
  cy.request({
    method,
    url: api(path),
    body,
    headers: { Authorization: `Bearer ${session.token}` },
  })
);

// anything the content security policy blocks fails the test
Cypress.on("window:before:load", (win) => {
  win.document.addEventListener("securitypolicyviolation", (event) => {
    throw new Error(
      `CSP blocked ${event.blockedURI} (${event.violatedDirective})`
    );
  });
});

export {};
