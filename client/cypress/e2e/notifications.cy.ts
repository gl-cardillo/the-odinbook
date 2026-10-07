import type { AuthResponse, Post } from "../../src/types";

describe("Notifications and single posts", () => {
  let me: AuthResponse;
  let friend: AuthResponse;

  beforeEach(() => {
    cy.signupApi("Author").then((session) => (me = session));
    cy.signupApi("Fan").then((session) => (friend = session));
  });

  const createPost = (text: string) =>
    cy
      .then(() => cy.apiAs(me, "POST", "/posts", { text }))
      .then((res) => res.body as Post);

  it("lists a like, marks it seen and opens the post", () => {
    createPost("Like this one").then((post) => {
      cy.apiAs(friend, "PUT", `/posts/${post.id}/like`);
      cy.visitAs(me, "/notifications");

      cy.contains("[data-cy=notification]", "liked your post").within(() => {
        // still shown as new while the page is open
        cy.get("[aria-label=new]");
      });
      cy.get("[data-cy=notifications-badge]").should("not.exist");

      cy.contains("[data-cy=notification]", "liked your post").click();
      cy.location("pathname").should("eq", `/singlePost/${post.id}`);
      cy.contains("[data-cy=post]", "Like this one");

      cy.visit("/notifications");
      cy.get("[aria-label=new]").should("not.exist");
    });
  });

  it("shows when there is nothing to see", () => {
    cy.then(() => cy.visitAs(me, "/notifications"));
    cy.contains("No notifications at the moment");
  });

  it("says when a post was deleted", () => {
    createPost("Soon gone").then((post) => {
      cy.apiAs(me, "DELETE", `/posts/${post.id}`);
      cy.visitAs(me, `/singlePost/${post.id}`);
    });
    cy.contains("This post is no longer available");
    cy.contains("a", "Back to the feed").click();
    cy.location("pathname").should("eq", "/home");
  });
});
