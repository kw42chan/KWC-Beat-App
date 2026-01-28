import {Zone} from '../types/zone';

export type HistoryAction =
  | {type: 'CREATE'; zone: Zone}
  | {type: 'UPDATE'; oldZone: Zone; newZone: Zone}
  | {type: 'DELETE'; zone: Zone}
  | {type: 'BULK'; action: HistoryAction[]};

export interface HistoryState {
  past: Zone[][];
  present: Zone[];
  future: Zone[][];
}

const MAX_HISTORY = 50;

export function createHistoryState(initialZones: Zone[]): HistoryState {
  return {
    past: [],
    present: initialZones,
    future: [],
  };
}

export function addToHistory(
  state: HistoryState,
  zones: Zone[],
): HistoryState {
  const newPast = [...state.past, state.present].slice(-MAX_HISTORY);
  return {
    past: newPast,
    present: zones,
    future: [], // Clear future when new action is performed
  };
}

export function undo(state: HistoryState): HistoryState {
  if (state.past.length === 0) {
    return state;
  }

  const previous = state.past[state.past.length - 1];
  const newPast = state.past.slice(0, -1);
  const newFuture = [state.present, ...state.future];

  return {
    past: newPast,
    present: previous,
    future: newFuture,
  };
}

export function redo(state: HistoryState): HistoryState {
  if (state.future.length === 0) {
    return state;
  }

  const next = state.future[0];
  const newPast = [...state.past, state.present];
  const newFuture = state.future.slice(1);

  return {
    past: newPast,
    present: next,
    future: newFuture,
  };
}

export function canUndo(state: HistoryState): boolean {
  return state.past.length > 0;
}

export function canRedo(state: HistoryState): boolean {
  return state.future.length > 0;
}
