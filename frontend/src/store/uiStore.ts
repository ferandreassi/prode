import { create } from 'zustand';

export type TabType = 'dashboard' | 'predictions' | 'groups' | 'profile';

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
  id: number;
}

interface UIState {
  activeTab: TabType;
  toast: Toast | null;
  predictMatchId: string | null;
  predictMatchTeamA: string | null;
  predictMatchTeamB: string | null;
  predictMatchFlagA: string | null;
  predictMatchFlagB: string | null;
  rulesModalOpen: boolean;
  
  setActiveTab: (tab: TabType) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  openPredictModal: (match: { id: string; teamA: string; teamB: string; flagA: string; flagB: string }) => void;
  closePredictModal: () => void;
  openRulesModal: () => void;
  closeRulesModal: () => void;
}

let toastTimeoutId: any = null;

export const useUIStore = create<UIState>((set, get) => ({
  activeTab: 'dashboard',
  toast: null,
  predictMatchId: null,
  predictMatchTeamA: null,
  predictMatchTeamB: null,
  predictMatchFlagA: null,
  predictMatchFlagB: null,
  rulesModalOpen: false,

  setActiveTab: (activeTab) => set({ activeTab }),

  showToast: (message, type = 'success') => {
    if (toastTimeoutId) {
      clearTimeout(toastTimeoutId);
    }

    const id = Date.now();
    set({ toast: { message, type, id } });

    toastTimeoutId = setTimeout(() => {
      if (get().toast?.id === id) {
        set({ toast: null });
      }
    }, 3000);
  },

  hideToast: () => {
    if (toastTimeoutId) {
      clearTimeout(toastTimeoutId);
    }
    set({ toast: null });
  },

  openPredictModal: (match) => set({
    predictMatchId: match.id,
    predictMatchTeamA: match.teamA,
    predictMatchTeamB: match.teamB,
    predictMatchFlagA: match.flagA,
    predictMatchFlagB: match.flagB
  }),

  closePredictModal: () => set({
    predictMatchId: null,
    predictMatchTeamA: null,
    predictMatchTeamB: null,
    predictMatchFlagA: null,
    predictMatchFlagB: null
  }),

  openRulesModal: () => set({ rulesModalOpen: true }),
  closeRulesModal: () => set({ rulesModalOpen: false }),
}));
