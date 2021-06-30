module.exports = {
  preset: "ts-jest",
  clearMocks: true,
  moduleFileExtensions: ['ts', 'js'],
  testMatch: ['**/tests/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  moduleNameMapper: {
    '^@App/(.*)$': '<rootDir>/src/$1'
  },
  modulePaths: [
    "<rootDir>/src",
    "<rootDir>/node_modules"
  ],
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json"
    }
  },
  verbose: true
}
