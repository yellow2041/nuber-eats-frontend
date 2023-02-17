/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CreatePaymentInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: createPayment
// ====================================================

export interface createPayment_createPayment {
  __typename: "CreatePaymentOutput";
  ok: boolean;
  error: string | null;
}

export interface createPayment {
  createPayment: createPayment_createPayment;
}

export interface createPaymentVariables {
  input: CreatePaymentInput;
}
