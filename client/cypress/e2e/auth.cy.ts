describe("Authentication", () => {
  it("signs up through the form and lands on the feed", () => {
    const stamp = Date.now().toString(36).slice(-6);
    cy.visit("/signin");
    cy.get("input[name=firstname]").type("Ada");
    cy.get("input[name=lastname]").type(`Lovelace${stamp}`);
    cy.get("input[name=email]").type(`ada.${stamp}@example.com`);
    cy.get("input[name=password]").type("password1!");
    cy.get("input[name=confirmPassword]").type("password1!");
    cy.contains("button", "Sign up").click();

    cy.location("pathname").should("eq", "/home");
    cy.get("textarea[name=text]").should(
      "have.attr",
      "placeholder",
      "What's on your mind, Ada?"
    );
  });

  it("shows the form errors before sending anything", () => {
    cy.visit("/signin");
    cy.get("input[name=firstname]").type("A");
    cy.get("input[name=password]").type("short");
    cy.contains("button", "Sign up").click();
    cy.contains("First name must be at least 2 characters");
    cy.contains("Password must be at least 8 characters");
    cy.location("pathname").should("eq", "/signin");
  });

  it("refuses a wrong password", () => {
    cy.signupApi().then((session) => {
      cy.visit("/");
      cy.get("input[name=email]").type(session.email);
      cy.get("input[name=password]").type("wrong-password");
      cy.contains("button", "Log in").click();
      cy.contains("Invalid email or password");
      cy.location("pathname").should("eq", "/");
    });
  });

  it("logs in and out", () => {
    cy.signupApi("Grace").then((session) => {
      cy.visit("/");
      cy.get("input[name=email]").type(session.email);
      cy.get("input[name=password]").type(session.password);
      cy.contains("button", "Log in").click();
      cy.location("pathname").should("eq", "/home");

      cy.get("[data-cy=account-menu]").click();
      cy.contains("Log out").click();
      cy.location("pathname").should("eq", "/");

      // the session is gone, the feed sends back to the login page
      cy.visit("/home");
      cy.location("pathname").should("eq", "/");
      cy.contains("button", "Log in");
    });
  });

  it("logs out when the session is no longer valid", () => {
    cy.signupApi().then((session) => {
      cy.visitAs({ ...session, token: "expired-or-forged" }, "/home");
      cy.location("pathname").should("eq", "/");
    });
  });
});
