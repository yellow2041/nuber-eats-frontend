describe("Edit Profile", () => {
  const user = cy;
  beforeEach(() => {
    // @ts-ignore
    user.login("yellow2041@naver.com", "1212121212");
  });
  it("can go to /edit-profile using the header", () => {
    user.get('a[href="/edit-profile"]').click();
    user.title().should("eq", "Edit Profile | Nuber eats");
  });
  it("can change email", () => {
    user.intercept("POST", "http://localhost:3030/graphql", (req) => {
      if (req.body?.operationName === "editProfile") {
        // @ts-ignore
        req.body?.variables?.input?.email = "yellow2041@naver.com";
      }
    });
    user.visit("/edit-profile");
    user.findByPlaceholderText(/email/i).clear().type("yellow2041@naver.com");
    user.findByRole("button").click();
  });
});
