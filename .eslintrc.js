module.exports = {
  extends: [
    'next/core-web-vitals',
  ],
  rules: {
    'react/no-unescaped-entities': 'off',
    'react-hooks/exhaustive-deps': 'warn' // Downgrade from error to warning
  }
} 