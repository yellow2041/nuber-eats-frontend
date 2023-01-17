/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: PotationMutation
// ====================================================

export interface PotationMutation_login {
  __typename: "LoginOutput";
  ok: boolean;
  token: string | null;
  error: string | null;
}

export interface PotationMutation {
  login: PotationMutation_login;
}

export interface PotationMutationVariables {
  email: string;
  password: string;
}
