import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { browser: true },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: 'CallExpression[callee.name="fetch"]',
          message: 'Raw fetch is forbidden. Use the typed Zodios API client (e.g. identityApi) instead to ensure runtime schema validation and correct headers.',
        },
      ],
    },
  },
  {
    files: [
      "src/lib/logger.ts", 
      "src/mocks/**", 
      "src/lib/menuStore.ts", 
      "src/hooks/useChatWebSocket.ts", 
      "src/hooks/useWebRTC.ts", 
      "src/components/customer/CustomerAddressPage.tsx", 
      "src/components/customer/CustomerRestaurantCard.tsx", 
      "src/contexts/ConfigContext.tsx"
    ],
    rules: {
      "no-restricted-syntax": "off"
    }
  }
);
