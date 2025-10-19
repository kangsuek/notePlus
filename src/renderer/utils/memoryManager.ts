/**
 * 메모리 정리 유틸리티
 * - 메모리 누수 방지
 * - 불필요한 객체 정리
 */

import React from 'react';

class CleanupManager {
  private cleanupFunctions: (() => void)[] = [];

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
}

// 싱글톤 인스턴스
export const cleanupManager = new CleanupManager();

// React 컴포넌트 언마운트 시 자동 정리
export const useCleanup = (cleanupFn: () => void) => {
  React.useEffect(() => {
    cleanupManager.registerCleanup(cleanupFn);

    return () => {
      cleanupFn();
    };
  }, []); // cleanupFn 의존성 제거하여 무한 루프 방지
};

// 하위 호환성을 위한 별칭 (기존 코드와의 호환성 유지)
export const memoryManager = cleanupManager;
export const useMemoryCleanup = useCleanup;