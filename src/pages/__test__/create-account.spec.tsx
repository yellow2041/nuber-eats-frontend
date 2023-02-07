import { ApolloProvider } from "@apollo/client";
import { createMockClient, MockApolloClient } from "mock-apollo-client";
import { render, waitFor } from "../../test-utils";
import { screen } from "@testing-library/react";
import { CreateAccount, CREATE_ACCOUNT_MUTATION } from "../create-account";
import userEvent from "@testing-library/user-event";
import { UserRole } from "../../__generated__/globalTypes";

const mockPush = jest.fn();

jest.mock("react-router-dom", () => {
  const realModule = jest.requireActual("react-router-dom");
  return {
    ...realModule,
    useHistory: () => {
      return {
        push: mockPush,
      };
    },
  };
});

describe("<CreateAccount />", () => {
  let mockedClient: MockApolloClient;
  beforeEach(async () => {
    mockedClient = createMockClient();
    render(
      <ApolloProvider client={mockedClient}>
        <CreateAccount />
      </ApolloProvider>
    );
  });
  it("renders OK", async () => {
    await waitFor(() => {
      expect(document.title).toBe("Create Account | Nuber eats");
    });
  });
  it("renders validation errors", async () => {
    const email = screen.getByPlaceholderText(/email/i);
    const button = screen.getByRole("button");

    userEvent.type(email, "wont@fdf");
    let errorMessage;
    await waitFor(() => {
      errorMessage = screen.getByRole("alert");
      expect(errorMessage).toHaveTextContent(/Please enter a valid email/i);
    });
    userEvent.clear(email);
    await waitFor(() => {
      errorMessage = screen.getByRole("alert");
      expect(errorMessage).toHaveTextContent(/email is required/i);
    });
    userEvent.type(email, "asdf@qwer.com");
    userEvent.click(button);

    await waitFor(() => {
      errorMessage = screen.getByRole("alert");
      expect(errorMessage).toHaveTextContent(/password is required/i);
    });
  });
  it("submits mutation with form values", async () => {
    const email = screen.getByPlaceholderText(/email/i);
    const password = screen.getByPlaceholderText(/password/i);
    const button = screen.getByRole("button");
    const formData = {
      email: "qwewqe@adffa.com",
      password: "1234567890",
      role: UserRole.Client,
    };
    const mockedLoginMutationResponse = jest.fn().mockResolvedValue({
      data: {
        createAccount: {
          ok: true,
          error: "mutation-error",
        },
      },
    });
    mockedClient.setRequestHandler(
      CREATE_ACCOUNT_MUTATION,
      mockedLoginMutationResponse
    );
    userEvent.type(email, formData.email);
    userEvent.type(password, formData.password);
    userEvent.click(button);
    jest.spyOn(window, "alert").mockImplementation(() => null);
    await waitFor(() => {
      expect(mockedLoginMutationResponse).toHaveBeenCalledTimes(1);
    });

    expect(mockedLoginMutationResponse).toHaveBeenCalledWith({
      createAccountInput: {
        email: formData.email,
        password: formData.password,
        role: formData.role,
      },
    });
    expect(window.alert).toHaveBeenCalledWith("Account Created! Log in now!");
    const mutationError = screen.getByRole("alert");
    expect(mockPush).toHaveBeenCalledWith("/");
    expect(mutationError).toHaveTextContent(/mutation-error/i);
  });
  afterAll(() => {
    jest.clearAllMocks();
  });
});
