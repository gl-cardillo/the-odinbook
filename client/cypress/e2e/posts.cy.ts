import type { AuthResponse } from "../../src/types";

describe("Posts, likes and comments", () => {
  let me: AuthResponse;

  beforeEach(() => {
    cy.signupApi("Poster").then((session) => {
      me = session;
      cy.visitAs(me, "/home");
    });
  });

  const writePost = (text: string) => {
    cy.get("textarea[name=text]").type(text);
    cy.contains("button", "Add Post").click();
    cy.contains("[data-cy=post]", text).should("exist");
  };

  it("publishes a post that is still there after a reload", () => {
    writePost("My first post");
    cy.reload();
    cy.contains("[data-cy=post]", "My first post").within(() => {
      cy.contains(me.user.fullname);
    });
  });

  it("asks for some text", () => {
    cy.contains("button", "Add Post").click();
    cy.contains("Text is required");
  });

  it("limits the length of a post", () => {
    cy.get("textarea[name=text]").should("have.attr", "maxlength", "5000");
  });

  it("likes and unlikes a post", () => {
    writePost("Like me");
    cy.contains("[data-cy=post]", "Like me").within(() => {
      cy.contains("button", "Like").click();
      cy.get("[data-cy=like-count]").should("contain", me.user.fullname);
      cy.contains("button", "Like").click();
      cy.get("[data-cy=like-count]").should("not.exist");
    });
  });

  it("comments, replies and deletes the comment", () => {
    writePost("Talk to me");
    cy.contains("[data-cy=post]", "Talk to me").within(() => {
      cy.contains("button", "Comment").click();
      cy.get("textarea[placeholder='Write a comment...']").type("First!");
      cy.contains("button", "Add Comment").click();
      cy.contains("[data-cy=comment-text]", "First!");
      cy.contains("1 comment");

      cy.get("[data-cy=reply-toggle]").click();
      cy.get("textarea[placeholder='Reply to the comment...']").type("Thanks");
      cy.contains("button", "Add Reply").click();
      cy.contains("[data-cy=replies]", "Thanks");
      cy.get("[data-cy=reply-toggle]").click();
      cy.contains("button", "1 reply");
    });

    // the replies are hidden, so the only delete button is the comment's own
    cy.contains("[data-cy=comment]", "First!")
      .find("[data-cy=delete-comment]")
      .click();
    cy.contains("button", "Delete").click();
    cy.contains("[data-cy=comment-text]", "First!").should("not.exist");
  });

  it("keeps a post when the delete is cancelled, removes it when confirmed", () => {
    writePost("Maybe delete me");

    cy.contains("[data-cy=post]", "Maybe delete me")
      .find("[data-cy=delete-post]")
      .click();
    cy.contains("Are you sure you want to delete this post?");
    // the safe answer has the focus
    cy.focused().should("have.text", "Cancel");
    cy.contains("button", "Cancel").click();
    cy.contains("[data-cy=post]", "Maybe delete me").should("exist");

    cy.contains("[data-cy=post]", "Maybe delete me")
      .find("[data-cy=delete-post]")
      .click();
    cy.contains("button", "Delete").click();
    cy.contains("[data-cy=post]", "Maybe delete me").should("not.exist");
    cy.contains("Post deleted successfully");
  });

  it("shows friends' posts in the feed", () => {
    cy.signupApi("Friend").then((friend) => {
      cy.apiAs(friend, "POST", `/users/${me.user.id}/friend-request`);
      cy.apiAs(
        me,
        "POST",
        `/users/me/friend-requests/${friend.user.id}/accept`
      );
      cy.apiAs(friend, "POST", "/posts", { text: "Hello from a friend" });
    });
    cy.reload();
    cy.contains("[data-cy=post]", "Hello from a friend");
  });
});
