import React, { ErrorInfo, ReactNode } from 'react';
import { errorHandler } from '@renderer/utils/errorHandler';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * React Error Boundary
 * 자식 컴포넌트에서 발생한 에러를 포착하여 앱 전체가 중단되지 않도록 함
 */
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // 에러 발생 시 상태 업데이트
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 개선된 에러 핸들링
    errorHandler.handleReactError(error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = (): void => {
    // 에러 상태 초기화하여 다시 렌더링 시도
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    // 앱 전체 새로고침
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // 커스텀 fallback UI가 제공된 경우
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 에러 UI
      return (
        <div className="error-boundary" data-testid="error-boundary">
          <div className="error-boundary-content">
            <div className="error-boundary-icon">⚠️</div>
            <h1 className="error-boundary-title">문제가 발생했습니다</h1>
            <p className="error-boundary-message">
              앱을 실행하는 중에 예상치 못한 오류가 발생했습니다.
            </p>

            {this.state.error && (
              <details className="error-boundary-details">
                <summary>오류 세부 정보</summary>
                <pre className="error-boundary-error">
                  {this.state.error.toString()}
                  {this.state.errorInfo && (
                    <>
                      {'\n\n'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}

            <div className="error-boundary-actions">
              <button
                className="error-boundary-button error-boundary-button-primary"
                onClick={this.handleReload}
              >
                다시 시작
              </button>
              <button
                className="error-boundary-button error-boundary-button-secondary"
                onClick={this.handleReset}
              >
                오류 무시
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
