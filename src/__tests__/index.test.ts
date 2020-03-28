import { ApolloError } from "apollo-client";
import { GraphQLError } from "graphql";
import { UNIQUE_VIOLATION } from "pg-error-constants";
import { getFieldErrors } from "../index";
import { PostgresQueryError } from "../databaseAdapters/Postgres";

describe("getFieldErrors", () => {
  let subject: Error;

  describe("when the error is not an ApolloError", () => {
    beforeEach(() => {
      subject = new Error("Internal server error");
    });

    it("returns a generic server error message", () => {
      expect(getFieldErrors(subject)).toEqual({
        server: ["An internal server error occurred"],
      });
    });
  });

  describe("when the error is an ApolloError", () => {
    describe("and it does not include GraphQLErrors", () => {
      beforeEach(() => {
        const networkError = new Error("Failed to Fetch");
        subject = new ApolloError({ networkError });
      });

      it("returns a generic server error message", () => {
        expect(getFieldErrors(subject)).toEqual({
          server: ["An internal server error occurred"],
        });
      });
    });

    describe("and it includes GraphQLErrors", () => {
      describe("when the GraphQLErrors do not have any extensions", () => {
        beforeEach(() => {
          const gqlError = new GraphQLError("Query failed");
          subject = new ApolloError({ graphQLErrors: [gqlError] });
        });

        it("returns a generic server error message", () => {
          expect(getFieldErrors(subject)).toEqual({
            server: ["An internal server error occurred"],
          });
        });
      });

      describe("when the GraphQLErrors have extensions with an exception", () => {
        describe("and the exception is not a validation or database error", () => {
          beforeEach(() => {
            const gqlError = new GraphQLError("Query failed", undefined, undefined, undefined, undefined, undefined, {
              exception: { message: "duplicate key error" },
            });
            subject = new ApolloError({ graphQLErrors: [gqlError] });
          });

          it("returns a generic server error message", () => {
            expect(getFieldErrors(subject)).toEqual({
              server: ["An internal server error occurred"],
            });
          });
        });

        describe("and the exception is a database error", () => {
          beforeEach(() => {
            const dbError: PostgresQueryError = {
              code: UNIQUE_VIOLATION,
              detail: "Key (email)=(joe@email.com) already taken",
            };
            const gqlError = new GraphQLError(
              "INTERNAL_SERVER_ERROR",
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              { exception: { ...dbError } }
            );
            subject = new ApolloError({ graphQLErrors: [gqlError] });
          });

          it("returns the database error", () => {
            expect(getFieldErrors(subject)).toEqual({ email: ["email joe@email.com already taken"] });
          });
        });

        describe("and the exception has validationErrors", () => {
          beforeEach(() => {
            const gqlError = new GraphQLError("Query failed", undefined, undefined, undefined, undefined, undefined, {
              exception: {
                validationErrors: [
                  {
                    target: { email: "joe", password: "weak" },
                    value: "joe",
                    property: "email",
                    constraints: { isEmail: "email must be an email" },
                  },
                  {
                    target: { email: "joe", password: "weak" },
                    value: "weak",
                    property: "password",
                    constraints: {
                      length: "password must be at least 6 characters",
                      customValidation: "password must include a special character",
                    },
                  },
                ],
              },
            });
            subject = new ApolloError({ graphQLErrors: [gqlError] });
          });

          it("returns constrain errors for each property", () => {
            expect(getFieldErrors(subject)).toEqual({
              email: ["email must be an email"],
              password: ["password must be at least 6 characters", "password must include a special character"],
            });
          });
        });
      });
    });
  });
});
