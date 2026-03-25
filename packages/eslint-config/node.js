/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["./base.js"],
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  rules: {
    "no-console": "off",
  },
};
