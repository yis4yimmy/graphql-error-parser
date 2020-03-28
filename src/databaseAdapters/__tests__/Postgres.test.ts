import { OUT_OF_MEMORY, UNIQUE_VIOLATION } from "pg-error-constants";
import { processPostgresError, PostgresQueryError } from "../Postgres";
import { SERVER_ERROR } from "../../messages";

describe("processPostgresError", () => {
  let subject: PostgresQueryError;

  describe("when the error code is not a unique_violation", () => {
    beforeEach(() => {
      subject = { code: OUT_OF_MEMORY, detail: "Failed on request of size 1840" };
    });

    it("returns a generic server error message", () => {
      expect(processPostgresError(subject)).toEqual({
        server: [SERVER_ERROR],
      });
    });
  });

  describe("when the error code is a unique_violation", () => {
    describe("when the detail does not match the expected format", () => {
      beforeEach(() => {
        subject = { code: UNIQUE_VIOLATION, detail: "Key username joe already taken" };
      });

      it("returns a generic server error message", () => {
        expect(processPostgresError(subject)).toEqual({
          server: [SERVER_ERROR],
        });
      });
    });

    describe("when the detail matches the expected format", () => {
      beforeEach(() => {
        subject = { code: UNIQUE_VIOLATION, detail: "Key (username)=(joe) already taken" };
      });

      it("returns a generic server error message", () => {
        expect(processPostgresError(subject)).toEqual({
          username: ["username joe already taken"],
        });
      });
    });
  });
});
