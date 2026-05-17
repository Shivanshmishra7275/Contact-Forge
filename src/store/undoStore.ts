import { create } from 'zustand';

interface UndoStoreState {
  showUndo: boolean;
  message: string;
  triggerUndo: () => void;
  setUndoableAction: (message: string) => void;
  hideUndo: () => void;
}

export const useUndoStore = create<UndoStoreState>((set) => ({
  showUndo: false,
  message: '',
  triggerUndo: () => {},
  setUndoableAction: (message: string) =>
    set({ showUndo: true, message }),
  hideUndo: () => set({ showUndo: false, message: '' }),
}));
