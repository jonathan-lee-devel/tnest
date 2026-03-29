import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/', 'node_modules/', '*.js', '*.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  prettier,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Allow explicit `any` in generic constraints and type utilities — common in library code
      '@typescript-eslint/no-explicit-any': 'warn',

      // The contract interfaces use branded phantom fields that are never read at runtime
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Allow non-null assertions — useful in factory/test code where the developer knows more than the compiler
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // Disable — we intentionally use `any` in some cast positions (define-helpers, mock-typed-client)
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',

      // Empty functions are fine in no-op implementations (mock close, default serializer, etc.)
      '@typescript-eslint/no-empty-function': 'off',

      // NestJS modules are classes with only static methods by design
      '@typescript-eslint/no-extraneous-class': 'off',

      // Allow returning `undefined as any` in zero-overhead contract helpers
      '@typescript-eslint/no-confusing-void-expression': 'off',

      // Enforce consistent type imports
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // Enforce consistent type exports
      '@typescript-eslint/consistent-type-exports': [
        'error',
        { fixMixedExportsWithInlineTypeSpecifier: true },
      ],

      // Prefer nullish coalescing and optional chaining
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',

      // Require return types on exported functions for API clarity
      '@typescript-eslint/explicit-module-boundary-types': 'error',
    },
  },
);
