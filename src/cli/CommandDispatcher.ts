import type { Command } from '../application/Command.js';
import type { EditorSession } from '../application/EditorSession.js';
import { InitCommand } from '../application/commands/InitCommand.js';
import { ReadCommand } from '../application/commands/ReadCommand.js';
import { SaveCommand } from '../application/commands/SaveCommand.js';
import { CanvasCommand } from '../application/commands/CanvasCommand.js';
import { CreateCommand } from '../application/commands/CreateCommand.js';
import { DeleteCommand } from '../application/commands/DeleteCommand.js';
import { MoveCommand } from '../application/commands/MoveCommand.js';
import { ScaleCommand } from '../application/commands/ScaleCommand.js';
import { SetCommand } from '../application/commands/SetCommand.js';
import { GroupCommand } from '../application/commands/GroupCommand.js';
import { UngroupCommand } from '../application/commands/UngroupCommand.js';
import { AddToCommand } from '../application/commands/AddToCommand.js';
import { FrontCommand } from '../application/commands/FrontCommand.js';
import { BackCommand } from '../application/commands/BackCommand.js';
import { TreeCommand } from '../application/commands/TreeCommand.js';
import { ShowCommand } from '../application/commands/ShowCommand.js';
import { UndoCommand } from '../application/commands/UndoCommand.js';
import { RedoCommand } from '../application/commands/RedoCommand.js';
import { HelpCommand } from '../application/commands/HelpCommand.js';
import { Tokenizer } from './Tokenizer.js';

export class CommandDispatcher {
  // Name dispatch point 2/2. TODO: provider registration in the plugin phase.
  private readonly commands: Map<
    string,
    { usage: string; build: (args: readonly string[]) => Command }
  >;
  private readonly tokenizer = new Tokenizer();
  constructor(session: EditorSession) {
    this.commands = new Map([
      ['init', { usage: 'init [w] [h]', build: (a) => new InitCommand(session, a) }],
      ['read', { usage: 'read <file.svg>', build: (a) => new ReadCommand(session, a) }],
      ['save', { usage: 'save [file.svg]', build: (a) => new SaveCommand(session, a) }],
      ['canvas', { usage: 'canvas [w] [h]', build: (a) => new CanvasCommand(session, a) }],
      [
        'create',
        {
          usage:
            'create <type> <id> [params...] [in <containerId>]\n  rect: x y w h [fill]; circle: cx cy r [fill]; ellipse: cx cy rx ry [fill]\n  line: x1 y1 x2 y2 [stroke]; text: x y "content"; g: (no params)',
          build: (a) => new CreateCommand(session, a),
        },
      ],
      ['delete', { usage: 'delete <id>', build: (a) => new DeleteCommand(session, a) }],
      ['move', { usage: 'move <id> <dx> <dy>', build: (a) => new MoveCommand(session, a) }],
      ['scale', { usage: 'scale <id> <factor>', build: (a) => new ScaleCommand(session, a) }],
      ['set', { usage: 'set <id> <attr> <value>', build: (a) => new SetCommand(session, a) }],
      [
        'group',
        { usage: 'group <newGid> <id1> <id2>...', build: (a) => new GroupCommand(session, a) },
      ],
      ['ungroup', { usage: 'ungroup <gid>', build: (a) => new UngroupCommand(session, a) }],
      ['addto', { usage: 'addto <gid> <id>', build: (a) => new AddToCommand(session, a) }],
      ['front', { usage: 'front <id>', build: (a) => new FrontCommand(session, a) }],
      ['back', { usage: 'back <id>', build: (a) => new BackCommand(session, a) }],
      ['tree', { usage: 'tree [id]', build: (a) => new TreeCommand(session, a) }],
      ['show', { usage: 'show <id>', build: (a) => new ShowCommand(session, a) }],
      ['undo', { usage: 'undo', build: (a) => new UndoCommand(session, a) }],
      ['redo', { usage: 'redo', build: (a) => new RedoCommand(session, a) }],
      [
        'help',
        {
          usage: 'help',
          build: (a) =>
            new HelpCommand(session, a, () =>
              [...this.commands.values()].map((entry) => entry.usage),
            ),
        },
      ],
    ]);
  }
  execute(line: string): string[] {
    try {
      const tokens = this.tokenizer.tokenize(line);
      if (!tokens.length) return [];
      const command = this.commands.get(tokens[0]!);
      if (!command) throw new Error(`unknown command: ${tokens[0]}`);
      return command.build(tokens.slice(1)).execute();
    } catch (error) {
      return [
        `error: ${(error instanceof Error ? error.message : String(error)).replace(/[\r\n]+/gu, ' ')}`,
      ];
    }
  }
}
