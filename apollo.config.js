module.exports = {
  client: {
    includes: ["./src/**/*.{tsx,ts}"],
    tagName: "gql",
    service: {
      name: "nuber-eats-backend",
      url: "http://localhost:3030/graphql",
    },
  },
};
