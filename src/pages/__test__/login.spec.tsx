import { ApolloProvider } from "@apollo/client";
import { render, RenderResult, waitFor, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockClient, MockApolloClient } from "mock-apollo-client";
import React from "react";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter as Router } from "react-router-dom";
import { Login, LOGIN_MUTATION } from "../login";

describe("<Login />", () => {
  let renderResult: RenderResult;
  let mockedClient: MockApolloClient;
  beforeEach(() => {
    mockedClient = createMockClient();
    renderResult = render(
      <HelmetProvider>
        <Router>
          <ApolloProvider client={mockedClient}>
            <Login />
          </ApolloProvider>
        </Router>
      </HelmetProvider>
    );
  });
  it("should render OK", async () => {
    await waitFor(() => {
      expect(document.title).toBe("Login | Nuber eats");
    });
  });
  it("displays email validation errors", async () => {
    const email = screen.getByPlaceholderText(/email/i);
    let errorMessage;
    userEvent.type(email, "jannabizzang@asd");
    await waitFor(() => {
      errorMessage = screen.getByRole("alert");
      expect(
        screen.getByText("Please enter a valid email")
      ).toBeInTheDocument();
    });
    userEvent.clear(email);
    await waitFor(() => {
      errorMessage = screen.getByRole("alert");
      expect(errorMessage).toHaveTextContent(/Email is required/i);
    });
  });
  it("displays password required  errors", async () => {
    const email = screen.getByPlaceholderText(/email/i);
    const submitBtn = screen.getByRole("button");
    userEvent.type(email, "jannabizzang@asd.com");
    userEvent.click(submitBtn);
    await waitFor(() => {
      const errorMessage = screen.getByRole("alert");
      expect(errorMessage).toHaveTextContent(/password is required/i);
    });
  });
  it("submits form and calls mutation", async () => {
    const formData = {
      email: "real@test.com",
      password: "1234567890",
    };
    const email = screen.getByPlaceholderText(/email/i);
    const password = screen.getByPlaceholderText(/password/i);
    const submitBtn = screen.getByRole("button");

    const mockedMutationResponse = jest.fn().mockResolvedValue({
      data: {
        login: { ok: true, token: "XXX", error: "mutation-error" },
      },
    });
    mockedClient.setRequestHandler(LOGIN_MUTATION, mockedMutationResponse);
    jest.spyOn(Storage.prototype, "setItem");
    userEvent.type(email, formData.email);
    userEvent.type(password, formData.password);
    userEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockedMutationResponse).toHaveBeenCalledTimes(1);
    });

    expect(mockedMutationResponse).toHaveBeenCalledWith({
      loginInput: {
        email: formData.email,
        password: formData.password,
      },
    });
    const errorMessage = screen.getByRole("alert");
    expect(errorMessage).toHaveTextContent(/mutation-error/i);
    expect(localStorage.setItem).toHaveBeenCalledWith("nuber-token", "XXX");
  });
});
