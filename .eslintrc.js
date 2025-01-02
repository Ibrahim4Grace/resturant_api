const { parse } = require("path");

module.exports = {
  parser: "@typesscript-eslint/parser",
  extends: [
    "plugin:@typesscript-eslint/recommended",
    "prettier/@typesscript-eslint",
    "plugin:prttier/recommended",
  ],
  parseOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
  },
  rules: {},
};
