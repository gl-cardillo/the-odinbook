describe("Accessibility and security basics", () => {
  it("names every page and lets keyboard users skip the navbar", () => {
    cy.signupApi("Reader").then((me) => {
      cy.visitAs(me, "/home");
      cy.title().should("eq", "Home · Odinbook");
      cy.get("h1").should("have.text", "Home");

      cy.get("a[href='#main']").focus().should("be.visible").click();
      cy.focused().should("have.attr", "id", "main");

      cy.visit("/notifications");
      cy.title().should("eq", "Notifications · Odinbook");
      cy.visit(`/profile/${me.user.id}`);
      cy.title().should("eq", `${me.user.fullname} · Odinbook`);
      cy.get("h1").should("have.length", 1);
    });
  });

  it("names the login and sign up pages", () => {
    cy.visit("/");
    cy.title().should("eq", "Log in · Odinbook");
    cy.visit("/signin");
    cy.title().should("eq", "Sign up · Odinbook");
  });

  it("ships a content security policy", () => {
    cy.visit("/");
    cy.get("meta[http-equiv='Content-Security-Policy']")
      .should("have.attr", "content")
      .and("contain", "script-src 'self'")
      .and("contain", "object-src 'none'");
  });
});
