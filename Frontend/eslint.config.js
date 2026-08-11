import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        performance: 'readonly',
        ResizeObserver: 'readonly',
        URLSearchParams: 'readonly',
        console: 'readonly',
        HTMLElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        AudioContext: 'readonly',
        webkitAudioContext: 'readonly',
        MediaRecorder: 'readonly',
        Blob: 'readonly',
        Audio: 'readonly',
        FormData: 'readonly',
        __dirname: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['warn', { varsIgnorePattern: '^React$', argsIgnorePattern: '^_' }],
      'react/jsx-no-target-blank': 'off',
      'react/prop-types': 'off',
      'react/no-unknown-property': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
    settings: { react: { version: '18.3' } },
  },
];
