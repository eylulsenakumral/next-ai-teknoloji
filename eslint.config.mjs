import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Build artifacts (Capacitor/Next export chunks):
    "android/**",
    "playwright-report/**",
    "test-results/**",
    // Capacitor mobile app — has its own lint setup:
    "mobile/**",
    // Generated/legacy/scrape artifacts:
    "dt-elektrix/**",
    "dt-elektrix*",
    "misafir/**",
    "yenitasarim/**",
    // Ad-hoc root scripts (one-off data/seed/inspect — not app code):
    "scripts/**",
    "check-logos.ts",
    "check_supplier_data.*",
    "*-test-dealer.ts",
    "get-dealers.ts",
    "inspect-categories.*",
    "qr-server.mjs",
    // Tooling, worktrees, plugin packages:
    ".claude/**",
    ".understand-*/**",
    // Workers (external scraper/whatsapp libs — wrappers, not app code):
    "workers/**",
  ]),
  {
    rules: {
      // Türkçe içerikte apostrof yaygın (KVKK'nın, Türkiye'nin, vb); her birini
      // &apos;/&quot; yapmak kaynak kodunu okunmaz kılar. React düz metindeki
      // tırnakları doğru render eder — bu rule yalnızca katı bir stil tercihi.
      "react/no-unescaped-entities": "off",
      // Next 16 / eslint-plugin-react-hooks v6 yeni kuralları olgunlaşmadı;
      // set-state-in-effect ve refs meşru useEffect/ref pattern'lerinde yoğun
      // false-positive üretiyor. CI'ı kırmamak için warning seviyesine indirildi;
      // gerçek sorunlar warning olarak görünmeye devam ediyor.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/globals": "warn",
    },
  },
]);

export default eslintConfig;
