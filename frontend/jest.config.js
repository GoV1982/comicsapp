module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest"
  },
  moduleFileExtensions: ["js", "jsx", "ts", "tsx"],
  transformIgnorePatterns: ["node_modules/(?!(your-esm-module)/)"],
  setupFilesAfterEnv: ["@testing-library/jest-dom/extend-expect", "<rootDir>/frontend/jest.setup.js"]
};
