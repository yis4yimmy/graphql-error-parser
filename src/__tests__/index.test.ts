import { Hello } from "../index";

describe("Hello", () => {
  it("returns a greeting", () => {
    expect(Hello("friend")).toEqual("Hello friend");
  });
});
