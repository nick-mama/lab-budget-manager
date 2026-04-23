"use client";

import { create } from "zustand";

type CurrentUserStore = {
  userId: number;
  setUserId: (id: number) => void;
};

export const useCurrentUserStore = create<CurrentUserStore>((set) => ({
  userId: 5,
  setUserId: (id) => set({ userId: id }),
}));
