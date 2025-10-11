/**
 * requestAnimationFrame 기반 스로틀 함수
 * 스크롤 이벤트 최적화에 사용
 */
export function rafThrottle<T extends (...args: unknown[]) => void>(callback: T): T {
  let rafId: number | null = null;

  const throttled = function (this: unknown, ...args: Parameters<T>) {
    if (rafId !== null) {
      return;
    }

    rafId = requestAnimationFrame(() => {
      callback.apply(this, args);
      rafId = null;
    });
  } as T;

  return throttled;
}

/**
 * 시간 기반 스로틀 함수
 * @param callback 실행할 함수
 * @param delay 지연 시간 (ms)
 */
export function throttle<T extends (...args: unknown[]) => void>(callback: T, delay: number): T {
  let lastCall = 0;

  const throttled = function (this: unknown, ...args: Parameters<T>) {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      callback.apply(this, args);
    }
  } as T;

  return throttled;
}
