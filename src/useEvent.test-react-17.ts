// Run all the other tests:
import "./useEvent.test";

// Just to make sure our overrides are working:
import React from "react";
it(`we're testing React 17`, async () => {
  expect(React.version).toMatchInlineSnapshot(`"17.0.2"`);
});
