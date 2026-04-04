export interface ExecutionNoteResult {
  noteId: string;
  noteTitle: string;
  status: 'done' | 'partial' | 'failed';
  summary: string;
}

export interface AiExecutionResult {
  instructionId: string;
  completedNotes: ExecutionNoteResult[];
  additionalNotes?: string;
  filesChanged?: string[];
  testsResult?: 'pass' | 'fail' | 'skip';
}
