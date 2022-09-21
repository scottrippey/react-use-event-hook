import React from "react";
import { renderHook } from "@testing-library/react-hooks";

// import useEvent from "../../src/useEvent";

it(`we're testing React 17`, async () => {
  expect(React.version).toMatchInlineSnapshot(`"17.0.2"`);
});

describe("useEvent", () => {
  it("should stuff", async () => {
    const res = renderHook(() => {
      return 5;
      // return React.useMemo(() => 5, []);
    });
    expect(typeof res.result.current).toEqual("function");
  });
});
