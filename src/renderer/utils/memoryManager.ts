/**
 * 메모리 관리 유틸리티
 * - 메모리 누수 방지
 * - 불필요한 객체 정리
 * - 메모리 사용량 모니터링
 */

interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
}

class MemoryManager {
  private cleanupFunctions: (() => void)[] = [];
  private memoryStats: MemoryStats[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;

  /**
   * 정리 함수 등록
   */
  registerCleanup(cleanupFn: () => void): void {
    this.cleanupFunctions.push(cleanupFn);
  }

  /**
   * 모든 정리 함수 실행
   */
  cleanup(): void {
    // 무한 루프 방지를 위해 cleanupFunctions 배열을 먼저 복사
    const functionsToCleanup = [...this.cleanupFunctions];
    this.cleanupFunctions = [];

    functionsToCleanup.forEach((cleanup) => {
      try {
        cleanup();
      } catch (error) {
        // 에러 로깅을 간단하게 처리하여 무한 루프 방지
        if (error instanceof Error && !error.message.includes('Maximum call stack')) {
          console.warn('Cleanup function failed:', error.message);
        }
      }
    });
  }

  /**
   * 메모리 사용량 모니터링 시작
   */
  startMonitoring(intervalMs: number = 5000): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.recordMemoryStats();
    }, intervalMs);
  }

  /**
   * 메모리 사용량 모니터링 중지
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
  }

  /**
   * 메모리 통계 기록
   */
  private recordMemoryStats(): void {
    if ('memory' in performance) {
      const memory = (performance as Performance & {
        memory?: {
          usedJSHeapSize: number;
          totalJSHeapSize: number;
          jsHeapSizeLimit: number;
        };
      }).memory;
      
      if (memory) {
        this.memoryStats.push({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          timestamp: Date.now(),
        });
      }

      // 최대 50개 통계만 유지
      if (this.memoryStats.length > 50) {
        this.memoryStats = this.memoryStats.slice(-50);
      }
    }
  }

  /**
   * 메모리 사용량 리포트
   */
  getMemoryReport(): {
    currentUsage: number;
    averageUsage: number;
    maxUsage: number;
    memoryPressure: 'low' | 'medium' | 'high';
  } {
    if (this.memoryStats.length === 0) {
      return {
        currentUsage: 0,
        averageUsage: 0,
        maxUsage: 0,
        memoryPressure: 'low',
      };
    }

    const current = this.memoryStats[this.memoryStats.length - 1];
    const usages = this.memoryStats.map((s) => s.usedJSHeapSize);
    const averageUsage = usages.reduce((a, b) => a + b, 0) / usages.length;
    const maxUsage = Math.max(...usages);

    // 메모리 압박도 계산 (사용량 / 제한량)
    const pressureRatio = current.usedJSHeapSize / current.jsHeapSizeLimit;
    let memoryPressure: 'low' | 'medium' | 'high' = 'low';

    if (pressureRatio > 0.8) {
      memoryPressure = 'high';
    } else if (pressureRatio > 0.6) {
      memoryPressure = 'medium';
    }

    return {
      currentUsage: current.usedJSHeapSize,
      averageUsage,
      maxUsage,
      memoryPressure,
    };
  }

  /**
   * 메모리 정리 제안
   */
  getCleanupSuggestions(): string[] {
    const report = this.getMemoryReport();
    const suggestions: string[] = [];

    if (report.memoryPressure === 'high') {
      suggestions.push('메모리 사용량이 높습니다. 불필요한 컴포넌트를 언마운트하세요.');
      suggestions.push('큰 객체나 배열을 정리하세요.');
      suggestions.push('이벤트 리스너를 제거하세요.');
    }

    if (report.maxUsage > report.averageUsage * 1.5) {
      suggestions.push('메모리 사용량이 급증했습니다. 메모리 누수를 확인하세요.');
    }

    return suggestions;
  }

  /**
   * 메모리 통계 초기화
   */
  clearStats(): void {
    this.memoryStats = [];
  }
}

// 싱글톤 인스턴스
export const memoryManager = new MemoryManager();

// React 컴포넌트 언마운트 시 자동 정리
export const useMemoryCleanup = (cleanupFn: () => void) => {
  React.useEffect(() => {
    memoryManager.registerCleanup(cleanupFn);

    return () => {
      cleanupFn();
    };
  }, []); // cleanupFn 의존성 제거하여 무한 루프 방지
};

// React import 추가
import React from 'react';
