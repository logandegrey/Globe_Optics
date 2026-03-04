module.exports = {
  root: true,
  env: {
    es2022: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: true,
    tsconfigRootDir: __dirname
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  ignorePatterns: ['dist', 'node_modules', 'coverage'],
  overrides: [
    {
      files: ['apps/web/**/*.{ts,tsx}'],
      env: {
        browser: true
      }
    },
    {
      files: ['apps/api/**/*.ts', 'apps/ingest/**/*.ts'],
      env: {
        node: true
      }
    }
  ]
};
