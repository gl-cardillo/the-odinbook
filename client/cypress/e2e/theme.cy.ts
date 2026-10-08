describe("Theme", () => {
  const background = (color: string) =>
    cy.get("body").should("have.css", "background-color", color);

  // the browser follows the operating system, the tests pretend it is light
  beforeEach(() => {
    cy.wrap(
      Cypress.automation("remote:debugger:protocol", {
        command: "Emulation.setEmulatedMedia",
        params: {
          features: [{ name: "prefers-color-scheme", value: "light" }],
        },
      })
    );
  });

  it("switches theme from the account menu and remembers it", () => {
    cy.signupApi("Painter").then((me) => cy.visitAs(me, "/home"));
    background("rgb(240, 242, 245)");

    cy.get("[data-cy=account-menu]").click();
    cy.get("[data-cy=theme-system]").should(
      "have.attr",
      "aria-checked",
      "true"
    );
    cy.get("[data-cy=theme-dark]").click();
    cy.get("html").should("have.attr", "data-theme", "dark");
    background("rgb(24, 25, 26)");

    cy.reload();
    background("rgb(24, 25, 26)");

    // logging out keeps the choice of this device
    cy.get("[data-cy=account-menu]").click();
    cy.contains("button", "Log out").click();
    cy.location("pathname").should("eq", "/");
    background("rgb(24, 25, 26)");
  });

  it("goes back to the system setting", () => {
    cy.signupApi("Painter").then((me) => cy.visitAs(me, "/home"));
    cy.get("[data-cy=account-menu]").click();
    cy.get("[data-cy=theme-light]").click();
    cy.get("html").should("have.attr", "data-theme", "light");

    cy.get("[data-cy=theme-system]").click();
    cy.get("html").should("not.have.attr", "data-theme");
    cy.window().then((win) => {
      expect(win.localStorage.getItem("theme")).to.equal(null);
    });
  });
});
