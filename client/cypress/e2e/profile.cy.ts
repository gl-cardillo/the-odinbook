import type { AuthResponse } from "../../src/types";

describe("Profile", () => {
  let me: AuthResponse;

  beforeEach(() => {
    cy.signupApi("Owner").then((session) => {
      me = session;
    });
  });

  it("edits the details in the about section", () => {
    cy.then(() => cy.visitAs(me, `/profile/${me.user.id}`));
    cy.contains("[data-cy=profile-name]", me.user.fullname);
    cy.contains("button", "About").click();
    cy.contains("Add some details so people can get to know you");

    cy.contains("button", "Edit details").click();
    cy.get("#hometown").type("Florence");
    cy.get("#worksAt").type("Odinbook");
    cy.get("#relationship").select("Single");
    cy.contains("button", "Save").click();

    cy.get("[data-cy=about-details]")
      .should("contain", "From Florence")
      .and("contain", "Works at Odinbook")
      .and("contain", "Single");

    cy.reload();
    cy.contains("button", "About").click();
    cy.contains("[data-cy=about-details]", "From Florence");
  });

  it("checks the details before saving them", () => {
    cy.then(() => cy.visitAs(me, `/profile/${me.user.id}`));
    cy.contains("button", "About").click();
    cy.contains("button", "Edit details").click();
    cy.get("#hometown").type("Not/valid");
    cy.contains("button", "Save").click();
    cy.contains("Special character not allowed.");

    cy.contains("button", "Cancel").click();
    cy.contains("Add some details so people can get to know you");
  });

  it("only lets the owner edit the profile", () => {
    cy.signupApi("Visitor").then((visitor) => {
      cy.visitAs(visitor, `/profile/${me.user.id}`);
    });
    cy.contains("[data-cy=profile-name]", me.user.fullname);
    cy.contains("button", "Add friend");
    cy.get("input[aria-label='Change profile picture']").should("not.exist");
    cy.contains("button", "About").click();
    cy.contains("No details to show");
    cy.contains("button", "Edit details").should("not.exist");
  });
});
