import { EditorSession } from './application/EditorSession.js';
import { CommandDispatcher } from './cli/CommandDispatcher.js';
import { Repl } from './cli/Repl.js';
import { SvgFileStore } from './infrastructure/SvgFileStore.js';

const session = new EditorSession(new SvgFileStore());
const repl = new Repl(new CommandDispatcher(session));
process.exitCode = await repl.run(process.stdin, process.stdout) ? 0 : 1;
