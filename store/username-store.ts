import { create } from 'zustand';

interface UsernameStore {
  username: string | null;
  setUsername: (username: string | null) => void;
}

export const useUsernameStore = create<UsernameStore>((set) => ({
  username: null,
  setUsername: (username) => set({ username }),
}));
