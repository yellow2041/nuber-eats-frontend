import {
  ApolloClient,
  createHttpLink,
  InMemoryCache,
  makeVar,
} from "@apollo/client";
import { LOCALSTORAGE_TOKEN } from "./constant";
import { setContext } from "@apollo/client/link/context";

const token = localStorage.getItem(LOCALSTORAGE_TOKEN);

export const isLoggedInVar = makeVar(Boolean(token));
export const authToken = makeVar(token);

const httpLink = createHttpLink({
  uri: "http://localhost:3030/graphql",
});

const authLink = setContext((_, { headers }) => {
  // console.log("token: " + token, "authToken: " + authToken());
  return {
    headers: {
      ...headers,
      "x-jwt": authToken() || "",
    },
  };
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          isLoggedIn: {
            read() {
              return isLoggedInVar();
            },
          },
          token: {
            read() {
              return authToken();
            },
          },
        },
      },
    },
  }),
});
