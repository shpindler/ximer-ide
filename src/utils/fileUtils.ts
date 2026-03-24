export const getFileLanguage = (fileName: string): 'func' | 'typescript' | 'javascript' | 'json' => {
  if (fileName.endsWith('.fc')) return 'func';
  if (fileName.endsWith('.ts')) return 'typescript';
  if (fileName.endsWith('.js')) return 'javascript';
  if (fileName.endsWith('.json')) return 'json';
  return 'func';
};

export const getTemplateContent = (language: string): string => {
  switch (language) {
    case 'func':
      return `;; New TON contract
;; Created at ${new Date().toLocaleString()}

#pragma version >=0.4.0;

() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    ;; Your code here
}`;
    case 'typescript':
      return `// Deployment script for TON contract
import { toNano } from 'ton';

export async function run() {
  // Your deployment logic here
}`;
    default:
      return '';
  }
};