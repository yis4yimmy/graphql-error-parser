import { UNIQUE_VIOLATION } from "pg-error-constants";
import { Errors } from "../index";
import { SERVER_ERROR } from "../messages";

const UNIQUE_VIOLATION_DETAIL_PARTS = new RegExp(/^Key \((.*)\)=\((.*)\)\s(.*)$/);

export type PostgresQueryError = {
  code: string;
  detail: string;
};

export const processPostgresError = (error: PostgresQueryError): Errors => {
  switch (error.code) {
    case UNIQUE_VIOLATION: {
      const detailParts = error.detail.match(UNIQUE_VIOLATION_DETAIL_PARTS);
      if (detailParts?.length) {
        detailParts.shift();

        return { [detailParts[0]]: [detailParts.join(" ")] };
      }
      break;
    }
    default: {
      break;
    }
  }
  return { server: [SERVER_ERROR] };
};
