import { errorHandler } from '@renderer/utils/errorHandler';

// Mock window.electronAPI
const mockElectronAPI = {
  showErrorDialog: jest.fn(),
};

Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
});

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

describe('ErrorHandler', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    errorHandler.clearErrorReports();
    errorHandler.setReportingEnabled(true); // 기본값으로 활성화
    jest.clearAllMocks();

    // console.error 모킹하여 테스트 중 에러 출력 억제
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('handleReactError', () => {
    it('should handle React errors correctly', () => {
      const error = new Error('Test React error');
      const errorInfo = {
        componentStack: 'TestComponent\n  at TestComponent',
      } as React.ErrorInfo;

      errorHandler.handleReactError(error, errorInfo);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[React Error]',
        expect.objectContaining({
          message: 'Test React error',
          stack: expect.any(String),
          componentStack: expect.any(String),
        })
      );
    });
  });

  describe('getErrorStats', () => {
    it('should return empty stats when no errors', () => {
      const stats = errorHandler.getErrorStats();

      expect(stats.totalErrors).toBe(0);
      expect(stats.errorTypes).toEqual({});
      expect(stats.recentErrors).toEqual([]);
    });

    it('should return error statistics', () => {
      const error = new Error('Test error');
      const errorInfo = {
        componentStack: 'TestComponent',
      } as React.ErrorInfo;

      errorHandler.handleReactError(error, errorInfo);

      const stats = errorHandler.getErrorStats();

      expect(stats.totalErrors).toBe(1);
      expect(stats.errorTypes).toHaveProperty('React Error');
      expect(stats.errorTypes['React Error']).toBe(1);
      expect(stats.recentErrors).toHaveLength(1);
    });
  });

  describe('clearErrorReports', () => {
    it('should clear all error reports', () => {
      const error = new Error('Test error');
      const errorInfo = {
        componentStack: 'TestComponent',
      } as React.ErrorInfo;

      errorHandler.handleReactError(error, errorInfo);

      let stats = errorHandler.getErrorStats();
      expect(stats.totalErrors).toBe(1);

      errorHandler.clearErrorReports();

      stats = errorHandler.getErrorStats();
      expect(stats.totalErrors).toBe(0);
    });
  });

  describe('setReportingEnabled', () => {
    it('should enable/disable error reporting', () => {
      errorHandler.setReportingEnabled(false);

      const error = new Error('Test error');
      const errorInfo = {
        componentStack: 'TestComponent',
      } as React.ErrorInfo;

      errorHandler.handleReactError(error, errorInfo);

      // 비활성화 상태에서는 에러가 기록되지 않아야 함
      const stats = errorHandler.getErrorStats();
      expect(stats.totalErrors).toBe(0);

      // 다시 활성화
      errorHandler.setReportingEnabled(true);
    });
  });

  describe('error notification', () => {
    it('should notify user for critical errors', () => {
      const error = new Error('Cannot read property of undefined');
      const errorInfo = {
        componentStack: 'TestComponent',
      } as React.ErrorInfo;

      errorHandler.handleReactError(error, errorInfo);

      // 중요한 에러의 경우 사용자에게 알림
      expect(mockElectronAPI.showErrorDialog).toHaveBeenCalledWith(
        expect.stringContaining('오류가 발생했습니다')
      );
    });

    it('should not notify user for non-critical errors', () => {
      const error = new Error('Non-critical error');
      const errorInfo = {
        componentStack: 'TestComponent',
      } as React.ErrorInfo;

      errorHandler.handleReactError(error, errorInfo);

      // 중요하지 않은 에러의 경우 사용자에게 알림하지 않음
      expect(mockElectronAPI.showErrorDialog).not.toHaveBeenCalled();
    });
  });

  describe('session management', () => {
    it('should generate session ID', () => {
      mockSessionStorage.getItem.mockReturnValue(null);
      mockSessionStorage.setItem.mockImplementation(() => {});

      const error = new Error('Test error');
      const errorInfo = {
        componentStack: 'TestComponent',
      } as React.ErrorInfo;

      errorHandler.handleReactError(error, errorInfo);

      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('error-session-id');
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'error-session-id',
        expect.stringMatching(/^session-\d+-[a-z0-9]+$/)
      );
    });

    it('should reuse existing session ID', () => {
      const existingSessionId = 'session-123456789-abc123';
      mockSessionStorage.getItem.mockReturnValue(existingSessionId);

      const error = new Error('Test error');
      const errorInfo = {
        componentStack: 'TestComponent',
      } as React.ErrorInfo;

      errorHandler.handleReactError(error, errorInfo);

      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('error-session-id');
      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
    });
  });
});
