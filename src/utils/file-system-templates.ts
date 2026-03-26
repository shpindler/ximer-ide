import { FileType } from '../types/file-system';

export const getFileTemplate = (type: FileType, name: string): string => {
  const templates: Record<FileType, string> = {
    func: `;; ${name}
;; Created at ${new Date().toLocaleString()}

#pragma version >=0.4.0;

() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    ;; Your code here
}

;; Get methods
int get_example() method_id {
    return 0;
}`,
    tact: `contract ${name.replace('.tact', '')} {
    // Contract state
    owner: Address;
    counter: Int as uint32;
    
    // Initialize contract
    init(owner: Address) {
        self.owner = owner;
        self.counter = 0;
    }
    
    // Receive function
    receive("increment") {
        self.counter += 1;
    }
    
    // Get methods
    get fun counter(): Int {
        return self.counter;
    }
}`,
    typescript: `// ${name}
import { Contract, ContractProvider, Sender, Address, Cell, contractAddress, beginCell } from "ton";

export class ${name.replace('.ts', '')} implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {}
    
    static createFromAddress(address: Address) {
        return new ${name.replace('.ts', '')}(address);
    }
    
    async sendIncrement(provider: ContractProvider, sender: Sender) {
        await provider.internal(sender, {
            value: "0.01",
            body: beginCell().storeUint(1, 32).endCell()
        });
    }
    
    async getCounter(provider: ContractProvider) {
        const result = await provider.get("get_counter", []);
        return result.stack.readNumber();
    }
}`,
    javascript: `// ${name}
class ${name.replace('.js', '')} {
    constructor() {
        this.counter = 0;
    }
    
    increment() {
        this.counter++;
    }
    
    getCounter() {
        return this.counter;
    }
}

module.exports = ${name.replace('.js', '')};`,
    json: `{
    "name": "${name.replace('.json', '')}",
    "version": "1.0.0",
    "description": "TON smart contract",
    "main": "build/${name.replace('.json', '')}.js",
    "scripts": {
        "build": "func build",
        "test": "jest"
    },
    "dependencies": {
        "ton": "^13.0.0"
    }
}`,
    md: `# ${name.replace('.md', '')}

## Description
Smart contract for TON Blockchain

## Methods
- \`increment()\` - Increases counter by 1
- \`getCounter()\` - Returns current counter value

## Usage
\`\`\`typescript
const contract = new ${name.replace('.md', '')}(address);
await contract.sendIncrement();
const counter = await contract.getCounter();
\`\`\`

## License
MIT`,
    txt: `File: ${name}
Created: ${new Date().toLocaleString()}
Type: TON Smart Contract Related
`
  };
  
  return templates[type] || templates.txt;
};

export const getFileIcon = (type: FileType | string): string => {
  const icons: Record<string, string> = {
    func: '🔵',
    tact: '🟣',
    typescript: '📘',
    javascript: '🟨',
    json: '📋',
    md: '📝',
    txt: '📄',
    directory: '📁'
  };
  
  return icons[type] || '📄';
};

export const getFileExtension = (type: FileType): string => {
  const extensions: Record<FileType, string> = {
    func: '.fc',
    tact: '.tact',
    typescript: '.ts',
    javascript: '.js',
    json: '.json',
    md: '.md',
    txt: '.txt'
  };
  
  return extensions[type];
};