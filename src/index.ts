import { isApolloError } from "apollo-client";
import { GraphQLError } from "graphql";

const SERVER_ERROR = "An internal server error occurred";

type FieldErrors = {
  [name: string]: string[];
};

type ValidationError = {
  target: { [name: string]: any };
  value: any;
  property: string;
  constraints: { [name: string]: string };
};

const processValidationErrors = (validationErrors: [ValidationError]): FieldErrors => {
  const fieldValidationErrors = validationErrors.reduce((memo: FieldErrors, error: ValidationError) => {
    memo[error.property] = Object.values(error.constraints);
    return memo;
  }, {});

  return fieldValidationErrors;
};

const processGraphQLErrors = (glqErrors: readonly GraphQLError[]): FieldErrors => {
  const errors = glqErrors.reduce((memo: FieldErrors, error) => {
    const exception = error.extensions?.exception;
    if (exception?.validationErrors) {
      const validationErrors = processValidationErrors(exception.validationErrors);
      memo = { ...memo, ...validationErrors };
    } else {
      memo.server = [SERVER_ERROR];
    }

    return memo;
  }, {});

  return errors;
};

export const getFieldErrors = (error: Error): FieldErrors => {
  if (isApolloError(error) && error.graphQLErrors.length) {
    return processGraphQLErrors(error.graphQLErrors);
  }

  return { server: [SERVER_ERROR] };
};
