module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.test.ts?(x)',
    '**/__tests__/**/*.spec.ts?(x)',
    '**/?(*.)+(spec|test).ts?(x)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/setup.ts', '/__tests__/test-utils.tsx'],

  // ES6 모듈 지원을 위한 설정
  extensionsToTreatAsEsm: ['.ts', '.tsx'],

  // 변환 설정
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          jsx: 'react-jsx',
          module: 'ESNext',
          target: 'ES2020',
          moduleResolution: 'node',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          skipLibCheck: true,
          strict: false,
        },
      },
    ],
  },

  // 변환 무시 패턴
  transformIgnorePatterns: [
    'node_modules/(?!(react-resizable-panels|mathjs|marked|dompurify|electron-store)/)',
  ],

  // 모듈 이름 매핑
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@main/(.*)$': '<rootDir>/src/main/$1',
    '^@renderer/(.*)$': '<rootDir>/src/renderer/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^react-resizable-panels$': '<rootDir>/src/__mocks__/react-resizable-panels.tsx',
  },

  // 설정 파일
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],

  // 커버리지 설정
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/__tests__/**',
    '!src/main/**', // 메인 프로세스 제외 (Electron)
    '!src/renderer/main.tsx', // 엔트리 파일 제외
    '!src/renderer/types.ts', // 타입 정의 제외
    '!src/renderer/constants.ts', // 상수만 있는 파일 제외
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  coverageDirectory: 'coverage',

  // 기타 설정
  verbose: true,
  testTimeout: 10000,
  clearMocks: true,
  restoreMocks: true,
};
