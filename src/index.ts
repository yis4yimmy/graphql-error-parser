import { isApolloError } from "apollo-client";
import { GraphQLError } from "graphql";
import { SERVER_ERROR } from "./messages";
import { processPostgresError } from "./databaseAdapters/Postgres";

export type FieldErrors = {
  [name: string]: string | string[];
};

export type Errors = {
  [name: string]: string[];
};

type ValidationError = {
  target: { [name: string]: any };
  value: any;
  property: string;
  constraints: { [name: string]: string };
};

type FieldErrorsAs = "array" | "string";

type FieldErrorFormatting = "lowercase" | "sentence-case" | "none";

export type FormatOptions = {
  fieldErrorValues: {
    as?: FieldErrorsAs;
    format?: FieldErrorFormatting;
  };
};

const processValidationErrors = (validationErrors: [ValidationError]): Errors => {
  const fieldValidationErrors = validationErrors.reduce((memo: Errors, error: ValidationError) => {
    memo[error.property] = Object.values(error.constraints);
    return memo;
  }, {});

  return fieldValidationErrors;
};

const processGraphQLErrors = (glqErrors: readonly GraphQLError[]): Errors => {
  const errors = glqErrors.reduce((memo: Errors, error) => {
    const exception = error.extensions?.exception;
    if (exception?.validationErrors) {
      const validationErrors = processValidationErrors(exception.validationErrors);
      memo = { ...memo, ...validationErrors };
    } else if (exception?.code) {
      const databaseErrors = processPostgresError(exception);
      memo = { ...memo, ...databaseErrors };
    } else {
      memo.server = [SERVER_ERROR];
    }

    return memo;
  }, {});

  return errors;
};

const formatErrors = (errors: Errors, options: FormatOptions): FieldErrors => {
  const format: FieldErrorFormatting = options.fieldErrorValues.format || "none";
  const as: FieldErrorsAs = options.fieldErrorValues.as || "array";

  const formattedErrors = Object.entries(errors).reduce((memo: FieldErrors, [field, messages]) => {
    switch (format) {
      case "lowercase":
        messages = messages.map((message) => message.toLowerCase());
        break;
      case "sentence-case":
        messages = messages.map((message) => message.charAt(0).toUpperCase() + message.slice(1));
        break;
      case "none":
      default:
        break;
    }

    if (as === "string") {
      memo[field] = messages.join(", ");
    } else {
      memo[field] = messages;
    }

    return memo;
  }, {});

  return formattedErrors;
};

export const getFieldErrors = (
  error: Error,
  options: FormatOptions = { fieldErrorValues: { as: "array", format: "none" } }
): FieldErrors => {
  let fieldErrors: Errors = { server: [SERVER_ERROR] };
  if (isApolloError(error) && error.graphQLErrors.length) {
    fieldErrors = processGraphQLErrors(error.graphQLErrors);
  }

  const formattedErrors = formatErrors(fieldErrors, options);
  return formattedErrors;
};
