import { create } from 'zustand'

export const useSyncStore = create((set) => ({
  currentGroup: null,
  members: [],
  rallyPoint: null,

  setGroup: (group) => set({ currentGroup: group }),
  setMembers: (members) => set({ members }),
  setRallyPoint: (poi) => set({ rallyPoint: poi }),

  updateMember: (updatedMember) => set((state) => ({
    members: state.members.map(m =>
      m.user_id === updatedMember.user_id ? { ...m, ...updatedMember } : m
    )
  })),

  addMember: (member) => set((state) => ({
    members: [...state.members.filter(m => m.user_id !== member.user_id), member]
  })),

  reset: () => set({ currentGroup: null, members: [], rallyPoint: null })
}))
