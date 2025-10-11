import { throttle, rafThrottle } from './throttle';

describe('throttle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should throttle function calls', () => {
    const callback = jest.fn();
    const throttled = throttle(callback, 100);

    throttled();
    throttled();
    throttled();

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should call function again after delay', () => {
    const callback = jest.fn();
    const throttled = throttle(callback, 100);

    throttled();
    expect(callback).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(100);
    throttled();
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('should pass arguments correctly', () => {
    const callback = jest.fn();
    const throttled = throttle(callback, 100);

    throttled('test', 123);
    expect(callback).toHaveBeenCalledWith('test', 123);
  });
});

describe('rafThrottle', () => {
  it('should throttle function calls using requestAnimationFrame', () => {
    const callback = jest.fn();
    const throttled = rafThrottle(callback);

    throttled();
    throttled();
    throttled();

    // requestAnimationFrame이 실행되기 전에는 1번도 호출되지 않음
    expect(callback).toHaveBeenCalledTimes(0);
  });

  it('should pass arguments correctly', () => {
    const callback = jest.fn();
    const throttled = rafThrottle(callback);

    throttled('test', 123);
    expect(callback).toHaveBeenCalledTimes(0);
  });
});
