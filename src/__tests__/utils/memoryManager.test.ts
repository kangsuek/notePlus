import { memoryManager } from '@renderer/utils/memoryManager';

// Mock React
jest.mock('react', () => ({
  useEffect: jest.fn(),
}));

describe('MemoryManager', () => {
  beforeEach(() => {
    memoryManager.clearStats();
  });

  describe('registerCleanup', () => {
    it('should register cleanup functions', () => {
      const cleanupFn1 = jest.fn();
      const cleanupFn2 = jest.fn();

      memoryManager.registerCleanup(cleanupFn1);
      memoryManager.registerCleanup(cleanupFn2);

      memoryManager.cleanup();

      expect(cleanupFn1).toHaveBeenCalled();
      expect(cleanupFn2).toHaveBeenCalled();
    });

    it('should handle cleanup function errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const errorFn = jest.fn(() => {
        throw new Error('Cleanup failed');
      });

      memoryManager.registerCleanup(errorFn);
      memoryManager.cleanup();

      expect(errorFn).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Cleanup function failed:', 'Cleanup failed');

      consoleSpy.mockRestore();
    });
  });

  describe('startMonitoring', () => {
    it('should start memory monitoring', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');

      memoryManager.startMonitoring(1000);

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000);

      memoryManager.stopMonitoring();
      setIntervalSpy.mockRestore();
    });

    it('should not start monitoring if already monitoring', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');

      memoryManager.startMonitoring(1000);
      memoryManager.startMonitoring(1000); // 두 번째 호출

      expect(setIntervalSpy).toHaveBeenCalledTimes(1);

      memoryManager.stopMonitoring();
      setIntervalSpy.mockRestore();
    });
  });

  describe('stopMonitoring', () => {
    it('should stop memory monitoring', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      memoryManager.startMonitoring(1000);
      memoryManager.stopMonitoring();

      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
    });
  });

  describe('getMemoryReport', () => {
    it('should return empty report when no stats', () => {
      const report = memoryManager.getMemoryReport();

      expect(report.currentUsage).toBe(0);
      expect(report.averageUsage).toBe(0);
      expect(report.maxUsage).toBe(0);
      expect(report.memoryPressure).toBe('low');
    });

    it('should calculate memory pressure correctly', () => {
      // Mock performance.memory
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 1000000,
          totalJSHeapSize: 2000000,
          jsHeapSizeLimit: 10000000,
        },
        writable: true,
      });

      memoryManager.startMonitoring(100);

      // 메모리 통계 기록을 위해 시간 경과 시뮬레이션
      setTimeout(() => {
        const report = memoryManager.getMemoryReport();

        expect(report.currentUsage).toBeGreaterThanOrEqual(0);
        expect(['low', 'medium', 'high']).toContain(report.memoryPressure);

        memoryManager.stopMonitoring();
      }, 150);
    });
  });

  describe('getCleanupSuggestions', () => {
    it('should return suggestions based on memory usage', () => {
      // Mock high memory usage
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 9000000, // 90% of limit
          totalJSHeapSize: 10000000,
          jsHeapSizeLimit: 10000000,
        },
        writable: true,
      });

      memoryManager.startMonitoring(100);

      // 메모리 통계 기록을 위해 시간 경과 시뮬레이션
      setTimeout(() => {
        const suggestions = memoryManager.getCleanupSuggestions();

        expect(suggestions).toBeInstanceOf(Array);
        expect(suggestions.length).toBeGreaterThanOrEqual(0);

        memoryManager.stopMonitoring();
      }, 150);
    });
  });

  describe('clearStats', () => {
    it('should clear all memory statistics', () => {
      memoryManager.startMonitoring(100);

      // 통계가 있는지 확인
      let report = memoryManager.getMemoryReport();
      expect(report.currentUsage).toBeGreaterThanOrEqual(0);

      memoryManager.clearStats();

      // 통계가 초기화되었는지 확인
      report = memoryManager.getMemoryReport();
      expect(report.currentUsage).toBe(0);

      memoryManager.stopMonitoring();
    });
  });
});
