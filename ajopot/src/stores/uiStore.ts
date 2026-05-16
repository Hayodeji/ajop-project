import { create } from 'zustand'

type ModalId = 'create-group' | 'invite-member' | 'record-payout' | 'edit-group' | 'edit-member' | null

interface UiState {
  sidebarOpen: boolean
  activeModal: ModalId
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  openModal: (id: Exclude<ModalId, null>) => void
  closeModal: () => void
}

export const useUiStore = create<UiState>()((set) => ({
  sidebarOpen: false,
  activeModal: null,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
}))
