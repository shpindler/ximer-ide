export interface HighlightToken {
  type: string;
  value: string;
  start: number;
  end: number;
}

export interface HighlightLine {
  tokens: HighlightToken[];
  text: string;
}

// Ключевые слова FunC
const FUNC_KEYWORDS = new Set([
  'int', 'cell', 'slice', 'builder', 'cont', 'forall',
  'if', 'else', 'while', 'do', 'return', 'try', 'catch',
  'global', 'inline', 'inline_ref', 'method_id', 'impure',
  'asm', 'const', 'var', 'repeat', 'until', 'break', 'continue'
]);

// Типы данных FunC
const FUNC_TYPES = new Set([
  'int', 'cell', 'slice', 'builder', 'cont', 'tuple', 'null'
]);

// Встроенные функции FunC
const FUNC_BUILTINS = new Set([
  'begin_cell', 'end_cell', 'begin_parse', 'load_uint', 'load_int',
  'load_bits', 'load_ref', 'store_uint', 'store_int', 'store_ref',
  'store_slice', 'store_builder', 'send_raw_message', 'get_data',
  'set_data', 'get_balance', 'get_c4', 'set_c4', 'get_c5', 'set_c5',
  'get_c7', 'set_c7', 'commit', 'throw', 'throw_if', 'throw_unless',
  'min', 'max', 'abs', 'pow2', 'random', 'now', 'my_address'
]);

// Ключевые слова Tact
const TACT_KEYWORDS = new Set([
  'contract', 'message', 'struct', 'enum', 'const', 'fun', 'extends',
  'init', 'receive', 'get', 'mutate', 'self', 'override', 'virtual'
]);

// Типы Tact
const TACT_TYPES = new Set([
  'Int', 'Bool', 'String', 'Address', 'Cell', 'Slice', 'Builder',
  'Coins', 'Bytes', 'map', 'null', 'maybe'
]);

// Встроенные функции Tact
const TACT_BUILTINS = new Set([
  'require', 'emit', 'send', 'contractAddress', 'now', 'random'
]);

// Операторы
const OPERATORS = new Set([
  '+', '-', '*', '/', '%', '=', '==', '!=', '<', '>', '<=', '>=',
  '&&', '||', '!', '&', '|', '^', '~', '<<', '>>', '+=', '-=',
  '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=', '?', ':'
]);

export class SyntaxHighlighter {
  private language: 'func' | 'tact';
  private keywords: Set<string>;
  private types: Set<string>;
  private builtins: Set<string>;

  constructor(language: 'func' | 'tact' = 'func') {
    this.language = language;
    
    if (language === 'func') {
      this.keywords = FUNC_KEYWORDS;
      this.types = FUNC_TYPES;
      this.builtins = FUNC_BUILTINS;
    } else {
      this.keywords = TACT_KEYWORDS;
      this.types = TACT_TYPES;
      this.builtins = TACT_BUILTINS;
    }
  }

  highlight(code: string): HighlightLine[] {
    const lines = code.split('\n');
    return lines.map((line, index) => this.highlightLine(line, index));
  }

  highlightLine(line: string, lineNumber: number): HighlightLine {
    const tokens: HighlightToken[] = [];
    let i = 0;
    const len = line.length;

    while (i < len) {
      const char = line[i];

      // Комментарии
      if (char === ';' && line[i + 1] === ';') {
        tokens.push({
          type: 'comment',
          value: line.slice(i),
          start: i,
          end: len
        });
        break;
      }

      // Строки
      if (char === '"') {
        const start = i;
        i++;
        while (i < len && line[i] !== '"') {
          if (line[i] === '\\') i++;
          i++;
        }
        i++;
        tokens.push({
          type: 'string',
          value: line.slice(start, i),
          start: start,
          end: i
        });
        continue;
      }

      // Числа
      if (this.isDigit(char) || (char === '-' && this.isDigit(line[i + 1]))) {
        const start = i;
        i++;
        while (i < len && this.isDigit(line[i])) i++;
        
        // Шестнадцатеричные числа
        if (line[i] === 'x' && this.isHex(line[i + 1])) {
          i++;
          while (i < len && this.isHex(line[i])) i++;
        }
        
        tokens.push({
          type: 'number',
          value: line.slice(start, i),
          start: start,
          end: i
        });
        continue;
      }

      // Идентификаторы и ключевые слова
      if (this.isLetter(char) || char === '_') {
        const start = i;
        while (i < len && (this.isLetterOrDigit(line[i]) || line[i] === '_')) i++;
        const word = line.slice(start, i);
        
        let type = 'identifier';
        if (this.keywords.has(word)) type = 'keyword';
        else if (this.types.has(word)) type = 'type';
        else if (this.builtins.has(word)) type = 'builtin';
        
        tokens.push({
          type,
          value: word,
          start: start,
          end: i
        });
        continue;
      }

      // Операторы
      if (OPERATORS.has(char) || this.isOperator(char)) {
        const start = i;
        i++;
        // Двухсимвольные операторы
        if (i < len && OPERATORS.has(char + line[i])) {
          tokens.push({
            type: 'operator',
            value: char + line[i],
            start: start,
            end: i + 1
          });
          i++;
        } else {
          tokens.push({
            type: 'operator',
            value: char,
            start: start,
            end: i
          });
        }
        continue;
      }

      // Специальные символы
      if (this.isSpecial(char)) {
        tokens.push({
          type: this.getSpecialType(char),
          value: char,
          start: i,
          end: i + 1
        });
        i++;
        continue;
      }

      i++;
    }

    return {
      tokens: tokens.length ? tokens : [{ type: 'text', value: line, start: 0, end: len }],
      text: line
    };
  }

  private isDigit(char: string): boolean {
    return /[0-9]/.test(char);
  }

  private isHex(char: string): boolean {
    return /[0-9a-fA-F]/.test(char);
  }

  private isLetter(char: string): boolean {
    return /[a-zA-Z]/.test(char);
  }

  private isLetterOrDigit(char: string): boolean {
    return /[a-zA-Z0-9]/.test(char);
  }

  private isOperator(char: string): boolean {
    return '+-*/%=&|^~<>!?:'.includes(char);
  }

  private isSpecial(char: string): boolean {
    return '{}[](),.;'.includes(char);
  }

  private getSpecialType(char: string): string {
    switch (char) {
      case '{': return 'brace';
      case '}': return 'brace';
      case '(': return 'paren';
      case ')': return 'paren';
      case '[': return 'bracket';
      case ']': return 'bracket';
      case ',': return 'comma';
      case ';': return 'semicolon';
      case '.': return 'dot';
      default: return 'special';
    }
  }

  // Получение CSS классов для токена
  getTokenClass(type: string): string {
    const classes: Record<string, string> = {
      keyword: 'keyword',
      type: 'type',
      builtin: 'builtin',
      function: 'function',
      string: 'string',
      number: 'number',
      comment: 'comment',
      operator: 'operator',
      identifier: 'identifier',
      brace: 'brace',
      paren: 'paren',
      bracket: 'bracket',
      comma: 'comma',
      semicolon: 'semicolon',
      dot: 'dot',
      text: 'text'
    };
    
    return classes[type] || 'text';
  }

  // HTML представление
  toHtml(code: string): string {
    const lines = this.highlight(code);
    
    return lines.map(line => {
      let html = '';
      let lastEnd = 0;
      
      for (const token of line.tokens) {
        if (token.start > lastEnd) {
          html += this.escapeHtml(line.text.slice(lastEnd, token.start));
        }
        
        const className = this.getTokenClass(token.type);
        html += `<span class="hljs-${className}">${this.escapeHtml(token.value)}</span>`;
        lastEnd = token.end;
      }
      
      if (lastEnd < line.text.length) {
        html += this.escapeHtml(line.text.slice(lastEnd));
      }
      
      return html;
    }).join('\n');
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

// Утилиты для быстрого использования
export const highlightFunc = (code: string): HighlightLine[] => {
  const highlighter = new SyntaxHighlighter('func');
  return highlighter.highlight(code);
};

export const highlightTact = (code: string): HighlightLine[] => {
  const highlighter = new SyntaxHighlighter('tact');
  return highlighter.highlight(code);
};

export const toHtml = (code: string, language: 'func' | 'tact' = 'func'): string => {
  const highlighter = new SyntaxHighlighter(language);
  return highlighter.toHtml(code);
};