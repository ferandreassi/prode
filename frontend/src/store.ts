import { useState, useEffect } from 'react';

// Interfaces del modelo de datos
export interface User {
  nickname: string;
  points: number;
  avatarSeed: string;
}

export interface Group {
  name: string;
  code: string;
  membersCount: number;
  maxMembers: number;
  rank: number;
}

export interface Fixture {
  id: number;
  homeName: string;
  homeFlag: string;
  awayName: string;
  awayFlag: string;
  homeGoals: number | null;
  awayGoals: number | null;
  roundName: string;
  status: 'OPEN' | 'LOCKED' | 'FINISHED';
  date: string;
  userPrediction?: { home: number; away: number };
  pointsEarned?: number;
  ptsType?: string;
  ptsLabel?: string;
}

export interface PredictModalState {
  isOpen: boolean;
  fixtureId: number | null;
  homeName: string;
  homeFlag: string;
  awayName: string;
  awayFlag: string;
  currentHome: number;
  currentAway: number;
}

export interface MatchLeaderboardPlayer {
  nickname: string;
  avatarSeed: string;
  pred: string;
  points: number;
  type: string;
  label: string;
  isMe?: boolean;
}

// Estado Inicial y Mockups
const INITIAL_USER: User = {
  nickname: 'Messi10',
  points: 28,
  avatarSeed: 'Messi10'
};

const INITIAL_GROUPS: Group[] = [
  { name: 'Los Pibes de la Facu', code: 'PIBE8839', membersCount: 8, maxMembers: 50, rank: 3 },
  { name: 'Oficina Tech Squad', code: 'TECH1024', membersCount: 15, maxMembers: 50, rank: 7 },
  { name: 'Familia Mundialista', code: 'FAMI2026', membersCount: 5, maxMembers: 50, rank: 1 }
];

const INITIAL_FIXTURES: Fixture[] = [
  {
    id: 101,
    homeName: 'Argentina',
    homeFlag: '🇦🇷',
    awayName: 'Brasil',
    awayFlag: '🇧🇷',
    homeGoals: null,
    awayGoals: null,
    roundName: 'Grupo A • Fecha 1',
    status: 'OPEN',
    date: 'Hoy, 20:00 hs',
    userPrediction: undefined
  },
  {
    id: 102,
    homeName: 'USA',
    homeFlag: '🇺🇸',
    awayName: 'Marruecos',
    awayFlag: '🇲🇦',
    homeGoals: null,
    awayGoals: null,
    roundName: 'Grupo B • Fecha 1',
    status: 'OPEN',
    date: 'Mañana, 17:00 hs',
    userPrediction: { home: 1, away: 0 }
  },
  {
    id: 103,
    homeName: 'Francia',
    homeFlag: '🇫🇷',
    awayName: 'Australia',
    awayFlag: '🇦🇺',
    homeGoals: 3,
    awayGoals: 0,
    roundName: 'Grupo C • Fecha 1',
    status: 'FINISHED',
    date: 'Finalizado',
    userPrediction: { home: 3, away: 1 },
    pointsEarned: 3,
    ptsType: 'WINNER',
    ptsLabel: 'Ganador'
  },
  {
    id: 104,
    homeName: 'Alemania',
    homeFlag: '🇩🇪',
    awayName: 'México',
    awayFlag: '🇲🇽',
    homeGoals: 1,
    awayGoals: 1,
    roundName: 'Grupo F • Fecha 1',
    status: 'FINISHED',
    date: 'Finalizado',
    userPrediction: { home: 2, away: 2 },
    pointsEarned: 4,
    ptsType: 'WINNER_DIFF',
    ptsLabel: 'Empate'
  }
];

const MOCK_MATCH_LEADERBOARDS: Record<number, MatchLeaderboardPlayer[]> = {
  103: [
    { nickname: 'KunAguero19', avatarSeed: 'Aguerito', pred: '3 - 0', points: 7, type: 'EXACT', label: 'Exacto' },
    { nickname: 'DibuMartinez', avatarSeed: 'Dibu', pred: '2 - 0', points: 4, type: 'WINNER_DIFF', label: 'Ganador + Dif' },
    { nickname: 'Messi10', avatarSeed: 'Messi10', pred: '3 - 1', points: 3, type: 'WINNER', label: 'Ganador', isMe: true },
    { nickname: 'ScaloniTech', avatarSeed: 'Scaloni', pred: '1 - 0', points: 3, type: 'WINNER', label: 'Ganador' },
    { nickname: 'CutiRomero', avatarSeed: 'Cuti', pred: '1 - 1', points: 0, type: 'MISS', label: 'Errado' }
  ],
  104: [
    { nickname: 'DibuMartinez', avatarSeed: 'Dibu', pred: '1 - 1', points: 7, type: 'EXACT', label: 'Exacto' },
    { nickname: 'Messi10', avatarSeed: 'Messi10', pred: '2 - 2', points: 4, type: 'WINNER_DIFF', label: 'Empate', isMe: true },
    { nickname: 'KunAguero19', avatarSeed: 'Aguerito', pred: '0 - 0', points: 4, type: 'WINNER_DIFF', label: 'Empate' },
    { nickname: 'ScaloniTech', avatarSeed: 'Scaloni', pred: '2 - 1', points: 1, type: 'PARTIAL', label: 'Parcial (GER)' },
    { nickname: 'CutiRomero', avatarSeed: 'Cuti', pred: '0 - 3', points: 0, type: 'MISS', label: 'Errado' }
  ]
};

// Implementación simple de Pub/Sub para persistencia reactiva global
type Listener = () => void;
const listeners = new Set<Listener>();

let state = {
  currentScreen: 'screen-splash',
  currentUser: INITIAL_USER,
  groups: INITIAL_GROUPS,
  fixtures: INITIAL_FIXTURES,
  activeGroup: null as Group | null,
  activeMatchDetail: null as Fixture | null,
  lastScreenBeforeMatch: 'screen-predictions',
  toastMessage: '',
  language: 'Español' as 'Español' | 'English',
  predictModal: {
    isOpen: false,
    fixtureId: null,
    homeName: '',
    homeFlag: '',
    awayName: '',
    awayFlag: '',
    currentHome: 0,
    currentAway: 0
  } as PredictModalState,
  createGroupModalOpen: false,
  joinGroupModalOpen: false,
  groupSettingsModalOpen: false
};

function emit() {
  listeners.forEach(l => l());
}

export const store = {
  getState() {
    return state;
  },

  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  // Acciones
  navigateTo(screenId: string) {
    state.currentScreen = screenId;
    emit();
  },

  setUser(nickname: string) {
    state.currentUser = {
      nickname: nickname,
      points: state.currentUser.points,
      avatarSeed: nickname
    };
    // Actualizar jugador 'isMe' en tablas de puntuación
    Object.keys(MOCK_MATCH_LEADERBOARDS).forEach(key => {
      const list = MOCK_MATCH_LEADERBOARDS[Number(key)];
      const me = list.find(p => p.isMe);
      if (me) {
        me.nickname = nickname;
        me.avatarSeed = nickname;
      }
    });
    emit();
  },

  updateAvatar(seed: string) {
    state.currentUser.avatarSeed = seed;
    // Actualizar jugador en tablas comparativas
    Object.keys(MOCK_MATCH_LEADERBOARDS).forEach(key => {
      const list = MOCK_MATCH_LEADERBOARDS[Number(key)];
      const me = list.find(p => p.isMe);
      if (me) {
        me.avatarSeed = seed;
      }
    });
    emit();
  },

  changeLanguage() {
    state.language = state.language === 'Español' ? 'English' : 'Español';
    emit();
  },

  // Crear Grupo
  createGroup(name: string) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) code += letters.charAt(Math.floor(Math.random() * letters.length));
    for (let i = 0; i < 4; i++) code += numbers.charAt(Math.floor(Math.random() * numbers.length));

    const newGroup: Group = {
      name,
      code,
      membersCount: 1,
      maxMembers: 50,
      rank: 1
    };

    state.groups = [newGroup, ...state.groups];
    state.createGroupModalOpen = false;
    emit();
    return code;
  },

  // Unirse a Grupo
  joinGroup(code: string) {
    const newGroup: Group = {
      name: 'Los Amigos del Mundial',
      code: code.toUpperCase(),
      membersCount: 14,
      maxMembers: 50,
      rank: 14
    };

    state.groups = [newGroup, ...state.groups];
    state.joinGroupModalOpen = false;
    emit();
  },

  // Configuración de Grupo
  updateGroupName(newName: string) {
    if (state.activeGroup) {
      state.activeGroup.name = newName;
      state.groups = state.groups.map(g => g.code === state.activeGroup?.code ? { ...g, name: newName } : g);
    }
    state.groupSettingsModalOpen = false;
    emit();
  },

  deleteActiveGroup() {
    if (state.activeGroup) {
      state.groups = state.groups.filter(g => g.code !== state.activeGroup?.code);
      state.activeGroup = null;
      state.currentScreen = 'screen-groups';
    }
    state.groupSettingsModalOpen = false;
    emit();
  },

  // Modales
  openPredictModal(fixture: Fixture) {
    state.predictModal = {
      isOpen: true,
      fixtureId: fixture.id,
      homeName: fixture.homeName,
      homeFlag: fixture.homeFlag,
      awayName: fixture.awayName,
      awayFlag: fixture.awayFlag,
      currentHome: fixture.userPrediction?.home ?? 0,
      currentAway: fixture.userPrediction?.away ?? 0
    };
    emit();
  },

  closePredictModal() {
    state.predictModal.isOpen = false;
    emit();
  },

  changePredictGoals(team: 'home' | 'away', delta: number) {
    if (team === 'home') {
      state.predictModal.currentHome = Math.max(0, state.predictModal.currentHome + delta);
    } else {
      state.predictModal.currentAway = Math.max(0, state.predictModal.currentAway + delta);
    }
    emit();
  },

  submitPrediction() {
    const { fixtureId, currentHome, currentAway } = state.predictModal;
    if (fixtureId) {
      state.fixtures = state.fixtures.map(f => {
        if (f.id === fixtureId) {
          return {
            ...f,
            userPrediction: { home: currentHome, away: currentAway }
          };
        }
        return f;
      });

      // Si es el partido inaugural (101), actualiza el leaderboard mock o estado
      if (fixtureId === 104) {
        // Actualizar predicción de me en la tabla comparativa de Alemania vs México
        const list = MOCK_MATCH_LEADERBOARDS[104] || [];
        const me = list.find(p => p.isMe);
        if (me) me.pred = `${currentHome} - ${currentAway}`;
      }
    }
    state.predictModal.isOpen = false;
    emit();
  },

  // Detalle de Grupo
  openGroupDetail(group: Group) {
    state.activeGroup = group;
    state.currentScreen = 'screen-group-detail';
    emit();
  },

  // Detalle de Partido / Leaderboard de Partido
  openMatchLeaderboard(fixture: Fixture, fromScreen: string) {
    state.activeMatchDetail = fixture;
    state.lastScreenBeforeMatch = fromScreen;
    state.currentScreen = 'screen-match-leaderboard';
    emit();
  },

  // Modales de Grupo
  setCreateGroupModal(isOpen: boolean) {
    state.createGroupModalOpen = isOpen;
    emit();
  },

  setJoinGroupModal(isOpen: boolean) {
    state.joinGroupModalOpen = isOpen;
    emit();
  },

  setGroupSettingsModal(isOpen: boolean) {
    state.groupSettingsModalOpen = isOpen;
    emit();
  },

  // Mostrar Toast
  showToast(message: string) {
    state.toastMessage = message;
    emit();
    setTimeout(() => {
      if (state.toastMessage === message) {
        state.toastMessage = '';
        emit();
      }
    }, 2000);
  },

  // Obtener la tabla del partido
  getMatchLeaderboard(fixtureId: number) {
    return MOCK_MATCH_LEADERBOARDS[fixtureId] || [];
  }
};

// Custom Hook para suscribirse al estado global
export function useStore() {
  const [localState, setLocalState] = useState(state);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setLocalState({ ...state });
    });
    return () => {
      unsubscribe();
    };
  }, []);

  return localState;
}
