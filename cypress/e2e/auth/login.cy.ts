describe("Log In", () => {
  const user = cy;
  it("should go to homepage", () => {
    user.visit("/").title().should("eq", "Login | Nuber eats");
  });
  it("can see email / password validation errors", () => {
    user.visit("/");
    user.findByPlaceholderText(/Email/i).type("adf@afadf");
    user.findByRole("alert").should("have.text", "Please enter a valid email");
    user.findByPlaceholderText(/email/i).clear();
    user.findByRole("alert").should("have.text", "Email is required");
    user.findByPlaceholderText(/Email/i).type("adf@afadf.com");
    user
      .findByPlaceholderText(/password/i)
      .type("1234567890")
      .clear();
    user.findByRole("alert").should("have.text", "Password is required");
  });
  it("can fill out the form", () => {
    // @ts-ignore
    user.login("yellow2041@naver.com", "1212121212");
    user.window().its("localStorage.nuber-token").should("be.a", "string");
  });
  // it("sign up", () => {});
});
