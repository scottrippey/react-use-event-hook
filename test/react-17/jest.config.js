module.exports = {
  ...require("../../jest.config"),
  rootDir: ".",
  moduleNameMapper: {
    // Ensure we "lock" the React version for these tests:
    "^react$": "<rootDir>/node_modules/react",
    // Use react-hooks instead:
    "^@testing-library/react$": "<rootDir>/node_modules/@testing-library/react-hooks",
  },
};
