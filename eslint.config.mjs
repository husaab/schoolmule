import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// eslint-config-next 16 ships native flat configs, so they are spread in
// directly. Wrapping them in @eslint/eslintrc's FlatCompat (the pre-16
// pattern) fails with "Converting circular structure to JSON".
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    // Separate project with its own eslint.config.mjs and package.json.
    "remotion/**",
  ]),
]);

export default eslintConfig;
