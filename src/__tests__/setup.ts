import '@testing-library/jest-dom';

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  measureText: jest.fn((text: string) => ({
    width: text.length * 8, // 간단한 폭 계산 (고정폭 가정)
  })),
  font: '',
})) as any;

// Mock Electron IPC
global.window = Object.create(window);
const mockElectronAPI = {
  send: jest.fn(),
  on: jest.fn(),
  invoke: jest.fn(),
};

Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
});

// Suppress console errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string') {
      // Warning 메시지 필터링
      if (args[0].includes('Warning: ReactDOM.render')) {
        return;
      }
      // Canvas getContext 에러 필터링
      if (args[0].includes('Not implemented: HTMLCanvasElement.prototype.getContext')) {
        return;
      }
    }
    // Error 객체 필터링
    if (args[0] instanceof Error) {
      if (args[0].message?.includes('Not implemented: HTMLCanvasElement.prototype.getContext')) {
        return;
      }
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

