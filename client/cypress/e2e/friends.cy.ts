import type { AuthResponse } from "../../src/types";

describe("Friends and notifications", () => {
  let alice: AuthResponse;
  let bob: AuthResponse;

  beforeEach(() => {
    cy.signupApi("Alice").then((session) => (alice = session));
    cy.signupApi("Bob").then((session) => (bob = session));
  });

  it("sends, accepts and notifies a friend request", () => {
    // Alice asks from Bob's profile
    cy.then(() => cy.visitAs(alice, `/profile/${bob.user.id}`));
    cy.contains("button", "Add friend").click();
    cy.contains("button", "Remove friend request");

    // Bob sees the request and its notification
    cy.then(() => cy.visitAs(bob, "/home"));
    cy.get("[data-cy=requests-badge]").should("have.text", "1");
    cy.get("[data-cy=notifications-badge]").should("have.text", "1");
    cy.get("[data-cy=notifications-button]").click();
    cy.contains("[data-cy=notifications-panel]", "sent you a friend request");
    cy.get("[data-cy=notifications-badge]").should("not.exist");

    cy.visit("/friendRequests");
    cy.contains("[data-cy=request]", alice.user.fullname).within(() => {
      cy.contains("button", "Accept").click();
    });
    cy.contains("No friend requests at the moment");
    cy.visit("/friends");
    cy.contains("[data-cy=person]", alice.user.fullname);

    // Alice is told, and Bob is now her friend
    cy.then(() => cy.visitAs(alice, "/notifications"));
    cy.contains(".notification", "accepted your friend request");
    cy.visit(`/profile/${bob.user.id}`);
    cy.contains("button", "Remove friend");
  });

  it("finds people with the search", () => {
    cy.then(() => cy.visitAs(alice, "/home"));
    cy.get("#search").type(bob.user.lastname);
    cy.contains("[data-cy=search-results] a", bob.user.fullname).click();
    cy.location("pathname").should("eq", `/profile/${bob.user.id}`);
    cy.contains("[data-cy=profile-name]", bob.user.fullname);
  });

  it("opens the search page with Enter", () => {
    cy.then(() => cy.visitAs(alice, "/home"));
    cy.get("#search").type(`${bob.user.lastname}{enter}`);
    cy.location("search").should("contain", bob.user.lastname);
    cy.contains("[data-cy=search-result]", bob.user.fullname);

    cy.visit("/searchPage?q=nobody-has-this-name");
    cy.contains("No users found");
  });

  it("declines a request", () => {
    cy.then(() =>
      cy.apiAs(bob, "POST", `/users/${alice.user.id}/friend-request`)
    );
    cy.then(() => cy.visitAs(alice, "/friendRequests"));
    cy.contains("[data-cy=request]", bob.user.fullname).within(() => {
      cy.contains("button", "Decline").click();
    });
    cy.contains("No friend requests at the moment");
  });
});
