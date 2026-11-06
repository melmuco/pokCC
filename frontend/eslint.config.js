import globals from "globals";
import pluginJs from "@eslint/js";
import { extends } from "eslint-config-next";

export default [
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...extends
];
