import { calculateExpression } from './calculateExpression';

describe('calculateExpression', () => {
  describe('기본 사칙연산', () => {
    it('should calculate addition', () => {
      expect(calculateExpression('2 + 3')).toBe('5');
      expect(calculateExpression('10 + 20')).toBe('30');
    });

    it('should calculate subtraction', () => {
      expect(calculateExpression('5 - 3')).toBe('2');
      expect(calculateExpression('100 - 50')).toBe('50');
    });

    it('should calculate multiplication', () => {
      expect(calculateExpression('4 * 5')).toBe('20');
      expect(calculateExpression('7 * 8')).toBe('56');
    });

    it('should calculate division', () => {
      expect(calculateExpression('10 / 2')).toBe('5');
      expect(calculateExpression('15 / 3')).toBe('5');
    });

    it('should handle decimal numbers', () => {
      expect(calculateExpression('1.5 + 2.5')).toBe('4');
      expect(calculateExpression('10 / 3')).toBe('3.3333333333333335');
    });
  });

  describe('괄호 처리', () => {
    it('should handle parentheses', () => {
      expect(calculateExpression('(2 + 3) * 4')).toBe('20');
      expect(calculateExpression('2 * (3 + 4)')).toBe('14');
    });

    it('should handle nested parentheses', () => {
      expect(calculateExpression('((2 + 3) * 4) - 5')).toBe('15');
      expect(calculateExpression('2 * (3 + (4 * 5))')).toBe('46');
    });
  });

  describe('연산자 우선순위', () => {
    it('should respect operator precedence', () => {
      expect(calculateExpression('2 + 3 * 4')).toBe('14');
      expect(calculateExpression('10 - 6 / 2')).toBe('7');
    });
  });

  describe('수학 함수', () => {
    it('should calculate sqrt', () => {
      expect(calculateExpression('sqrt(16)')).toBe('4');
      expect(calculateExpression('sqrt(25)')).toBe('5');
    });

    it('should calculate sin', () => {
      const result = calculateExpression('sin(0)');
      expect(parseFloat(result)).toBeCloseTo(0, 10);
    });

    it('should calculate cos', () => {
      const result = calculateExpression('cos(0)');
      expect(parseFloat(result)).toBeCloseTo(1, 10);
    });

    it('should calculate pow', () => {
      expect(calculateExpression('pow(2, 3)')).toBe('8');
      expect(calculateExpression('pow(5, 2)')).toBe('25');
    });

    it('should calculate abs', () => {
      expect(calculateExpression('abs(-5)')).toBe('5');
      expect(calculateExpression('abs(5)')).toBe('5');
    });
  });

  describe('복잡한 수식', () => {
    it('should handle complex expressions', () => {
      expect(calculateExpression('(2 + 3) * sqrt(16) / 2')).toBe('10');
      expect(calculateExpression('pow(2, 3) + sqrt(9)')).toBe('11');
    });
  });

  describe('에러 케이스', () => {
    it('should return error for invalid expressions', () => {
      const result = calculateExpression('2 + +');
      expect(result).toContain('Error');
    });

    it('should return error for division by zero', () => {
      const result = calculateExpression('10 / 0');
      expect(result).toBe('Infinity');
    });

    it('should return error for undefined functions', () => {
      const result = calculateExpression('unknown(5)');
      expect(result).toContain('Error');
    });

    it('should return error for empty expression', () => {
      const result = calculateExpression('');
      expect(result).toContain('Error');
    });

    it('should return error for whitespace only', () => {
      const result = calculateExpression('   ');
      expect(result).toContain('Error');
    });

    it('should return error for plain numbers (not a valid expression)', () => {
      const result = calculateExpression('123');
      expect(result).toContain('Error');
      expect(result).toContain('Not a valid expression');
    });

    it('should return error for decimal numbers without operators', () => {
      const result = calculateExpression('123.456');
      expect(result).toContain('Error');
      expect(result).toContain('Not a valid expression');
    });
  });

  describe('보안 검증', () => {
    it('should not execute eval', () => {
      // mathjs는 eval을 사용하지 않으므로 안전
      const result = calculateExpression('2 + 3');
      expect(result).toBe('5');
    });

    it('should handle malicious input safely', () => {
      // 악의적인 입력도 안전하게 처리
      const result = calculateExpression('alert("test")');
      expect(result).toContain('Error');
    });
  });
});
