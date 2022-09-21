module.exports = {
  ...require("../../jest.config"),
  rootDir: ".",
  moduleNameMapper: {
    // Ensure we "lock" the React version to v17 for these tests:
    "^react$": "<rootDir>/node_modules/react",
    // Use react-hooks instead (we have a tiny bit of interop code to ensure the tests still work)
    "^@testing-library/react$": "<rootDir>/node_modules/@testing-library/react-hooks",
  },
};
