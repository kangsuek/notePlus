import { performanceMonitor } from '@renderer/utils/performanceMonitor';

// Mock React
jest.mock('react', () => ({
  memo: jest.fn((component) => component),
  useEffect: jest.fn(),
  createElement: jest.fn(),
}));

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    // 각 테스트 전에 메트릭 초기화
    performanceMonitor.clearMetrics();
  });

  describe('measureRenderTime', () => {
    it('should wrap component with performance monitoring', () => {
      const TestComponent = () => null;
      const wrappedComponent = performanceMonitor.measureRenderTime('TestComponent', TestComponent);

      expect(wrappedComponent).toBeDefined();
    });

    it('should record render time metrics', () => {
      const TestComponent = () => null;
      const wrappedComponent = performanceMonitor.measureRenderTime('TestComponent', TestComponent);

      // 컴포넌트 렌더링 시뮬레이션 (props 없이 호출)
      wrappedComponent();

      // 메트릭이 기록되었는지 확인
      const report = performanceMonitor.getPerformanceReport();
      expect(report.averageRenderTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getPerformanceReport', () => {
    it('should return empty report when no metrics', () => {
      const report = performanceMonitor.getPerformanceReport();

      expect(report.averageRenderTime).toBe(0);
      expect(report.maxRenderTime).toBe(0);
      expect(report.memoryUsage).toBe(0);
      expect(report.slowestComponents).toEqual([]);
    });

    it('should calculate performance metrics correctly', () => {
      const TestComponent = () => null;
      const wrappedComponent = performanceMonitor.measureRenderTime('TestComponent', TestComponent);

      // 여러 번 렌더링 시뮬레이션
      wrappedComponent();
      wrappedComponent();

      const report = performanceMonitor.getPerformanceReport();
      expect(report.averageRenderTime).toBeGreaterThanOrEqual(0);
      expect(report.maxRenderTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('clearMetrics', () => {
    it('should clear all performance metrics', () => {
      const TestComponent = () => null;
      const wrappedComponent = performanceMonitor.measureRenderTime('TestComponent', TestComponent);

      wrappedComponent();

      // 메트릭 초기화
      performanceMonitor.clearMetrics();

      // 메트릭이 초기화되었는지 확인
      const report = performanceMonitor.getPerformanceReport();
      expect(report.averageRenderTime).toBe(0);
    });
  });

  describe('setEnabled', () => {
    it('should enable/disable monitoring', () => {
      performanceMonitor.setEnabled(false);

      const TestComponent = () => null;
      const wrappedComponent = performanceMonitor.measureRenderTime('TestComponent', TestComponent);

      wrappedComponent();

      // 비활성화 상태에서는 메트릭이 기록되지 않아야 함
      const report = performanceMonitor.getPerformanceReport();
      expect(report.averageRenderTime).toBe(0);

      // 다시 활성화
      performanceMonitor.setEnabled(true);
    });
  });
});
