export const env = {
  es6: true,
  node: true,
};
export const extendsConfig = [
  "eslint:recommended",
  "google",
];
export const parserOptions = {
  ecmaVersion: 2020,
  sourceType: "module",
};
export const rules = {
  "no-unused-vars": "warn",
  "no-undef": "off",
  "prefer-arrow-callback": "error",
  "quotes": ["error", "double", { "allowTemplateLiterals": true }],
};
