import prettier from 'eslint-plugin-prettier';
import tsParser from '@typescript-eslint/parser';
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
const eslintConfig = {
    files: ['**/*.{ts,mts,tsx}'],
    ignores: ['node_modules/**', 'dist/**', 'build/**', 'release/**', '*.min.*'],
    languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        parser: tsParser,
        globals: {
            node: true,
            es2021: true,
        },
    },
    plugins: {
        '@typescript-eslint': typescriptEslintPlugin,
        prettier,
    },
    rules: {
        'prettier/prettier': [
            'error',
            {
                printWidth: 100,
                tabWidth: 2,
                useTabs: false,
                singleQuote: true,
                semi: true,
                quoteProps: 'as-needed',
                trailingComma: 'all',
                bracketSpacing: true,
                bracketSameLine: false,
                arrowParens: 'always',
                endOfLine: 'lf',
                proseWrap: 'preserve',
            },
        ],
        '@typescript-eslint/explicit-function-return-type': 'warn',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/consistent-type-imports': 'error',
        '@typescript-eslint/no-explicit-any': 'warn',
    },
};
export default [eslintConfig];
