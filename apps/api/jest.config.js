module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@legal-aid-ai/shared$': '<rootDir>/../../packages/shared/src',
    '^@legal-aid-ai/ai$': '<rootDir>/../../packages/ai/src',
    '^@legal-aid-ai/legal-research$': '<rootDir>/../../packages/legal-research/src',
  },
};
