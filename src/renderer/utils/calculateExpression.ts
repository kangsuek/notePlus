import { evaluate } from 'mathjs';

/**
 * 문자열이 유효한 수식인지 확인
 * 단순 숫자만 있는 경우는 수식이 아님
 *
 * @param expression 확인할 표현식
 * @returns 수식 여부
 */
function isValidExpression(expression: string): boolean {
  const trimmed = expression.trim();

  // 빈 문자열
  if (!trimmed) {
    return false;
  }

  // 연산자 포함 여부 확인 (+, -, *, /, ^, %)
  const hasOperator = /[+\-*/^%]/.test(trimmed);

  // 함수 포함 여부 확인 (sqrt, sin, cos, tan, pow, abs, log, exp 등)
  const hasFunction =
    /\b(sqrt|sin|cos|tan|asin|acos|atan|pow|abs|log|log10|exp|ceil|floor|round|min|max)\s*\(/.test(
      trimmed
    );

  // 괄호 포함 여부 확인
  const hasParentheses = /[()]/.test(trimmed);

  // 수식으로 간주: 연산자, 함수, 또는 괄호 중 하나라도 포함
  return hasOperator || hasFunction || hasParentheses;
}

/**
 * 수식을 안전하게 계산하는 함수
 * mathjs.evaluate()를 사용하여 eval() 없이 안전하게 계산
 *
 * @param expression 계산할 수식 문자열
 * @returns 계산 결과 문자열 또는 에러 메시지
 *
 * @example
 * calculateExpression('2 + 3') // '5'
 * calculateExpression('sqrt(16)') // '4'
 * calculateExpression('123') // 'Error: Not a valid expression'
 * calculateExpression('2 + +') // 'Error: ...'
 */
export function calculateExpression(expression: string): string {
  try {
    // 빈 문자열 또는 공백만 있는 경우
    if (!expression || expression.trim() === '') {
      return 'Error: Empty expression';
    }

    // 유효한 수식인지 확인 (단순 숫자는 제외)
    if (!isValidExpression(expression)) {
      return 'Error: Not a valid expression';
    }

    // mathjs로 안전하게 계산 (eval 사용 안 함)
    const result = evaluate(expression);

    // 결과를 문자열로 변환
    return String(result);
  } catch (error) {
    // 에러 메시지 반환
    if (error instanceof Error) {
      return `Error: ${error.message}`;
    }
    return 'Error: Unknown error occurred';
  }
}
