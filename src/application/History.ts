import type { UndoableCommand } from './UndoableCommand.js';
export class History {
  private undoStack: UndoableCommand[] = [];
  private redoStack: UndoableCommand[] = [];
  private blocked = true;
  barrier(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.blocked = true;
  }
  record(command: UndoableCommand): void {
    this.undoStack.push(command);
    this.redoStack = [];
    this.blocked = false;
  }
  undo(): string[] {
    this.checkBarrier();
    const command = this.undoStack.at(-1);
    if (!command) throw new Error('nothing to undo');
    const result = command.undo();
    this.undoStack.pop();
    this.redoStack.push(command);
    return result;
  }
  redo(): string[] {
    this.checkBarrier();
    const command = this.redoStack.at(-1);
    if (!command) throw new Error('nothing to redo');
    const result = command.redo();
    this.redoStack.pop();
    this.undoStack.push(command);
    return result;
  }
  private checkBarrier(): void {
    if (this.blocked) throw new Error('undo not allowed after io command');
  }
}
