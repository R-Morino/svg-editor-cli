import { createInterface } from 'node:readline';
import type { Readable, Writable } from 'node:stream';
import type { CommandDispatcher } from './CommandDispatcher.js';
export class Repl {
  constructor(private readonly dispatcher: CommandDispatcher) {}
  async run(input: Readable & { isTTY?: boolean }, output: Writable): Promise<boolean> {
    const terminal = Boolean(input.isTTY);
    const reader = createInterface({ input, output, terminal });
    let failed = false;
    let closed = false;
    reader.once('close', () => {
      closed = true;
    });
    output.write("svg-editor 0.1 — type 'help' for commands\n");
    if (terminal) {
      reader.setPrompt('svg> ');
      reader.prompt();
    }
    for await (const line of reader) {
      const results = this.dispatcher.execute(line);
      for (const result of results) {
        output.write(`${result}\n`);
        if (result.startsWith('error:')) failed = true;
      }
      if (terminal && !closed) reader.prompt();
    }
    return !failed;
  }
}
