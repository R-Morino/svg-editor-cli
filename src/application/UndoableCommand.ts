import type { Command } from './Command.js';
export interface UndoableCommand extends Command { undo(): string[]; redo(): string[]; }
