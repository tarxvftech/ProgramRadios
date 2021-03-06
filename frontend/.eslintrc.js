module.exports = {
  root: true,
  env: {
    node: true
  },
  'extends': [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/typescript/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    '@typescript-eslint/camelcase': 'off',
    'camelcase':'off',
    '@typescript-eslint/no-unused-vars': "off",
    "vue/no-unused-vars":"off",
    "no-unused-vars":"off",
    //"no-constant-condition":"off"
    "prefer-const":"off",
    "@typescript-eslint/no-use-before-define":"off",
    "no-constant-condition":"off",
  }
}
