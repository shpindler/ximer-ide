export interface ValidationError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

export const validateFunC = (code: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  const lines = code.split('\n');
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();
    
    if (!trimmed || trimmed.startsWith(';;')) return;
    
    // Проверка комментариев
    if (line.includes('//') && !line.includes(';;')) {
      errors.push({
        line: lineNumber,
        column: line.indexOf('//') + 1,
        message: 'Use ;; for comments in FunC, not //',
        severity: 'warning'
      });
    }
    
    // Проверка точки с запятой
    if (!line.endsWith(';') && 
        !line.endsWith('{') && 
        !line.endsWith('}') &&
        !line.startsWith('#pragma') &&
        !line.includes('method_id') &&
        !line.match(/^\s*$/) &&
        !line.includes('?') &&
        !line.includes(':')) {
      errors.push({
        line: lineNumber,
        column: line.length,
        message: 'Missing semicolon at end of statement',
        severity: 'error'
      });
    }
    
    // Проверка recv_internal
    if (line.includes('recv_internal') && !line.includes('impure')) {
      errors.push({
        line: lineNumber,
        column: line.indexOf('recv_internal') + 1,
        message: 'recv_internal function should be marked as impure',
        severity: 'warning'
      });
    }
    
    // Проверка get методов
    if (line.includes('method_id') && !line.includes('get_')) {
      errors.push({
        line: lineNumber,
        column: line.indexOf('method_id') + 1,
        message: 'Get methods should be prefixed with "get_"',
        severity: 'warning'
      });
    }
    
    // Проверка переменной var
    const varMatch = line.match(/^\s*var\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
    if (varMatch) {
      errors.push({
        line: lineNumber,
        column: line.indexOf('var') + 1,
        message: `Use explicit type instead of "var" for variable "${varMatch[1]}"`,
        severity: 'warning'
      });
    }
  });
  
  // Проверка баланса скобок
  let braceCount = 0;
  let parenCount = 0;
  let lineWithIssue = 0;
  
  lines.forEach((line, index) => {
    braceCount += (line.match(/{/g) || []).length;
    braceCount -= (line.match(/}/g) || []).length;
    parenCount += (line.match(/\(/g) || []).length;
    parenCount -= (line.match(/\)/g) || []).length;
    
    if ((braceCount !== 0 || parenCount !== 0) && lineWithIssue === 0) {
      lineWithIssue = index + 1;
    }
  });
  
  if (braceCount !== 0) {
    errors.push({
      line: lineWithIssue,
      column: 1,
      message: `Unbalanced braces: ${Math.abs(braceCount)} unclosed ${braceCount > 0 ? 'opening' : 'closing'} brace(s)`,
      severity: 'error'
    });
  }
  
  if (parenCount !== 0) {
    errors.push({
      line: lineWithIssue,
      column: 1,
      message: `Unbalanced parentheses: ${Math.abs(parenCount)} unclosed ${parenCount > 0 ? 'opening' : 'closing'}`,
      severity: 'error'
    });
  }
  
  return errors;
};