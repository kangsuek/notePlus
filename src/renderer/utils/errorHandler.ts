/**
 * 전역 에러 핸들러
 * - JavaScript 에러 캐치
 * - Promise rejection 처리
 * - 에러 로깅 및 사용자 알림
 */

interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: number;
  userAgent: string;
  url: string;
}

interface ErrorReport {
  error: ErrorInfo;
  context: {
    userId?: string;
    sessionId?: string;
    feature: string;
  };
}

class ErrorHandler {
  private errorReports: ErrorReport[] = [];
  private maxReports: number = 50;
  private isReportingEnabled: boolean = true;

  constructor() {
    this.setupGlobalErrorHandlers();
  }

  /**
   * 전역 에러 핸들러 설정
   */
  private setupGlobalErrorHandlers(): void {
    // JavaScript 에러 처리
    window.addEventListener('error', (event) => {
      this.handleError(
        {
          message: event.message,
          stack: event.error?.stack,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        },
        'JavaScript Error'
      );
    });

    // Promise rejection 처리
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        {
          message: event.reason?.message || 'Unhandled Promise Rejection',
          stack: event.reason?.stack,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        },
        'Promise Rejection'
      );
    });
  }

  /**
   * React 에러 바운더리용 핸들러
   */
  handleReactError(error: Error, errorInfo: React.ErrorInfo): void {
    this.handleError(
      {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack || undefined,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
      'React Error'
    );
  }

  /**
   * 에러 처리 및 로깅
   */
  private handleError(errorInfo: ErrorInfo, errorType: string): void {
    // 리포팅이 비활성화된 경우 에러를 기록하지 않음
    if (!this.isReportingEnabled) {
      return;
    }

    const report: ErrorReport = {
      error: errorInfo,
      context: {
        feature: errorType,
        sessionId: this.getSessionId(),
      },
    };

    // 에러 리포트 저장
    this.errorReports.push(report);
    if (this.errorReports.length > this.maxReports) {
      this.errorReports = this.errorReports.slice(-this.maxReports);
    }

    // 콘솔에 에러 로깅
    console.error(`[${errorType}]`, errorInfo);

    // 사용자에게 에러 알림 (중요한 에러만)
    if (this.shouldNotifyUser(errorInfo)) {
      this.notifyUser(errorInfo);
    }

    // 에러 리포트 전송 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      this.sendErrorReport(report);
    }
  }

  /**
   * 사용자에게 알림할 에러인지 판단
   */
  private shouldNotifyUser(errorInfo: ErrorInfo): boolean {
    // 치명적인 에러만 사용자에게 알림
    const criticalErrors = [
      'Cannot read property',
      'Cannot read properties',
      'TypeError',
      'ReferenceError',
      'SyntaxError',
    ];

    return criticalErrors.some((pattern) => errorInfo.message.includes(pattern));
  }

  /**
   * 사용자에게 에러 알림
   */
  private notifyUser(errorInfo: ErrorInfo): void {
    // 간단한 알림 (실제로는 더 정교한 UI 필요)
    const message = `오류가 발생했습니다: ${errorInfo.message}`;

    // 브라우저 알림 또는 커스텀 모달
    if ((window as any).electronAPI?.showErrorDialog) {
      (window as any).electronAPI.showErrorDialog(message);
    } else {
      alert(message);
    }
  }

  /**
   * 에러 리포트 전송
   */
  private sendErrorReport(report: ErrorReport): void {
    // 실제로는 서버로 전송하거나 로컬 파일로 저장
    console.log('Error Report:', report);
  }

  /**
   * 세션 ID 생성
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('error-session-id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('error-session-id', sessionId);
    }
    return sessionId;
  }

  /**
   * 에러 통계 조회
   */
  getErrorStats(): {
    totalErrors: number;
    errorTypes: Record<string, number>;
    recentErrors: ErrorInfo[];
  } {
    const errorTypes = this.errorReports.reduce(
      (acc, report) => {
        const type = report.context.feature;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalErrors: this.errorReports.length,
      errorTypes,
      recentErrors: this.errorReports.slice(-10).map((report) => report.error),
    };
  }

  /**
   * 에러 리포트 초기화
   */
  clearErrorReports(): void {
    this.errorReports = [];
  }

  /**
   * 에러 리포팅 활성화/비활성화
   */
  setReportingEnabled(enabled: boolean): void {
    this.isReportingEnabled = enabled;
  }
}

// 싱글톤 인스턴스
export const errorHandler = new ErrorHandler();

// React import 추가
import React from 'react';
