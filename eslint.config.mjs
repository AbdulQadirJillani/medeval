import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Database/ is generated question data (~20 MB of JSX), not app code
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "Database/**"]),
]);

export default eslintConfig;
