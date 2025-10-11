/**
 * 성능 모니터링 유틸리티
 * - 컴포넌트 렌더링 시간 측정
 * - 메모리 사용량 추적
 * - 성능 메트릭 수집
 */

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  memoryUsage: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private isEnabled: boolean = process.env.NODE_ENV === 'development';

  /**
   * 컴포넌트 렌더링 시간 측정
   */
  measureRenderTime<T extends React.ComponentType<any>>(componentName: string, Component: T): T {
    if (!this.isEnabled) {
      return Component;
    }

    const WrappedComponent = React.memo((props: any) => {
      const startTime = performance.now();

      React.useEffect(() => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;

        this.recordMetric({
          componentName,
          renderTime,
          memoryUsage: this.getMemoryUsage(),
          timestamp: Date.now(),
        });
      });

      return React.createElement(Component, props);
    });

    WrappedComponent.displayName = `PerformanceMonitor(${componentName})`;
    return WrappedComponent as unknown as T;
  }

  /**
   * 메모리 사용량 측정
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * 성능 메트릭 기록
   */
  private recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // 최대 100개 메트릭만 유지
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  /**
   * 성능 리포트 생성
   */
  getPerformanceReport(): {
    averageRenderTime: number;
    maxRenderTime: number;
    memoryUsage: number;
    slowestComponents: string[];
  } {
    if (this.metrics.length === 0) {
      return {
        averageRenderTime: 0,
        maxRenderTime: 0,
        memoryUsage: 0,
        slowestComponents: [],
      };
    }

    const renderTimes = this.metrics.map((m) => m.renderTime);
    const averageRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
    const maxRenderTime = Math.max(...renderTimes);
    const memoryUsage = this.metrics[this.metrics.length - 1]?.memoryUsage || 0;

    // 가장 느린 컴포넌트들 찾기
    const componentTimes = this.metrics.reduce(
      (acc, metric) => {
        if (!acc[metric.componentName]) {
          acc[metric.componentName] = [];
        }
        acc[metric.componentName].push(metric.renderTime);
        return acc;
      },
      {} as Record<string, number[]>
    );

    const slowestComponents = Object.entries(componentTimes)
      .map(([name, times]) => ({
        name,
        averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 5)
      .map((c) => c.name);

    return {
      averageRenderTime,
      maxRenderTime,
      memoryUsage,
      slowestComponents,
    };
  }

  /**
   * 성능 메트릭 초기화
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * 성능 모니터링 활성화/비활성화
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
}

// 싱글톤 인스턴스
export const performanceMonitor = new PerformanceMonitor();

// React import 추가
import React from 'react';
