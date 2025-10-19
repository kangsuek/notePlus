import { cleanupManager, useCleanup } from '@renderer/utils/memoryManager';

// Mock React
jest.mock('react', () => ({
  useEffect: jest.fn((callback) => {
    // useEffect를 즉시 실행하여 테스트
    callback();
    return () => {}; // cleanup function
  }),
}));

describe('CleanupManager', () => {
  describe('registerCleanup', () => {
    it('should register cleanup functions', () => {
      const cleanupFn1 = jest.fn();
      const cleanupFn2 = jest.fn();

      cleanupManager.registerCleanup(cleanupFn1);
      cleanupManager.registerCleanup(cleanupFn2);

      cleanupManager.cleanup();

      expect(cleanupFn1).toHaveBeenCalled();
      expect(cleanupFn2).toHaveBeenCalled();
    });

    it('should handle cleanup function errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const errorFn = jest.fn(() => {
        throw new Error('Cleanup failed');
      });

      cleanupManager.registerCleanup(errorFn);
      cleanupManager.cleanup();

      expect(errorFn).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Cleanup function failed:', 'Cleanup failed');

      consoleSpy.mockRestore();
    });

    it('should clear cleanup functions after execution', () => {
      const cleanupFn = jest.fn();

      cleanupManager.registerCleanup(cleanupFn);
      cleanupManager.cleanup();

      // 두 번째 cleanup 호출 시 함수가 다시 호출되지 않아야 함
      cleanupManager.cleanup();

      expect(cleanupFn).toHaveBeenCalledTimes(1);
    });

    it('should handle empty cleanup functions array', () => {
      expect(() => {
        cleanupManager.cleanup();
      }).not.toThrow();
    });
  });

  describe('useCleanup hook', () => {
    it('should register cleanup function when component mounts', () => {
      const cleanupFn = jest.fn();
      const registerSpy = jest.spyOn(cleanupManager, 'registerCleanup');

      useCleanup(cleanupFn);

      expect(registerSpy).toHaveBeenCalledWith(cleanupFn);
    });

    it('should call cleanup function when component unmounts', () => {
      const cleanupFn = jest.fn();
      const mockUseEffect = require('react').useEffect;

      // useEffect의 cleanup function을 캡처
      let cleanupCallback: (() => void) | undefined;
      mockUseEffect.mockImplementation((callback: () => void | (() => void)) => {
        const result = callback();
        if (typeof result === 'function') {
          cleanupCallback = result;
        }
        return () => {};
      });

      useCleanup(cleanupFn);

      // cleanup function 호출
      if (cleanupCallback) {
        cleanupCallback();
      }

      expect(cleanupFn).toHaveBeenCalled();
    });
  });

  describe('backward compatibility', () => {
    it('should maintain memoryManager alias', () => {
      const { memoryManager } = require('@renderer/utils/memoryManager');
      expect(memoryManager).toBe(cleanupManager);
    });

    it('should maintain useMemoryCleanup alias', () => {
      const { useMemoryCleanup } = require('@renderer/utils/memoryManager');
      expect(useMemoryCleanup).toBe(useCleanup);
    });
  });
});
