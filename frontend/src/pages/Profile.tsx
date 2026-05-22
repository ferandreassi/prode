import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getAvatarUrl } from '@/services/api';
import { LogOut, User, ShieldCheck, Camera } from 'lucide-react';
import { calculatePoints } from './PredictionsHub';

interface Fixture {
  id: number;
  date: string;
  status: string;
  round: string;
  homeTeam: { name: string; flag: string; code: string };
  awayTeam: { name: string; flag: string; code: string };
  goals: { home: number | null; away: number | null };
  venue?: { name: string; city: string } | null;
}

interface Prediction {
  id: string;
  fixtureId: number;
  homeGoals: number;
  awayGoals: number;
}

export const Profile: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, logout, updateUser } = useAuthStore();
  const { showToast } = useUIStore();

  const [nickname, setNickname] = useState(user?.nickname || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [uploading, setUploading] = useState(false);

  // Synchronize local states when user object loads or updates
  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  // 1. Fetch public matches from data-worker
  const { data: fixturesRes } = useQuery({
    queryKey: ['fixtures'],
    queryFn: async () => {
      const res = await api.data.get('/fixtures');
      return res.fixtures as Fixture[];
    }
  });

  // 2. Fetch user's predictions from api-worker
  const { data: predictionsRes } = useQuery({
    queryKey: ['predictions'],
    queryFn: async () => {
      const res = await api.get('/predictions/me');
      return res.predictions as Prediction[];
    }
  });

  // 3. Compute detailed stats for this user
  let exactCount = 0;
  let totalPoints = 0;
  let playedCount = 0;

  if (predictionsRes && fixturesRes) {
    predictionsRes.forEach(pred => {
      const match = fixturesRes.find(f => f.id === pred.fixtureId);
      if (match && match.status === 'FT' && match.goals.home !== null && match.goals.away !== null) {
        playedCount++;
        const p = { homeGoals: pred.homeGoals, awayGoals: pred.awayGoals };
        const a = { homeGoals: match.goals.home, awayGoals: match.goals.away };
        const scoring = calculatePoints(p, a);
        totalPoints += scoring.points;
        if (scoring.points === 7) {
          exactCount++;
        }
      }
    });
  }

  // Mutation to Save Profile details (PUT /users/me)
  const saveMutation = useMutation({
    mutationFn: async (payload: { nickname: string; avatarUrl: string }) => {
      return await api.put('/users/me', payload);
    },
    onSuccess: (res: any) => {
      showToast('¡Perfil actualizado con éxito!', 'success');
      localStorage.setItem('prode_u_jwt', res.token);
      updateUser({
        nickname: res.user.nickname,
        avatarUrl: res.user.avatarUrl
      });
      queryClient.invalidateQueries({ queryKey: ['group-members'] });
      queryClient.invalidateQueries({ queryKey: ['fixtures'] });
    },
    onError: (err: any) => {
      showToast(err.message || 'Error al guardar perfil.', 'error');
    }
  });

  // Handle R2 avatar image upload (Auto-saves to database immediately)
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('La imagen supera el límite de 2MB.', 'error');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/upload', formData);
      setAvatarUrl(res.url);
      
      // Auto-save the new avatar URL in D1 database immediately!
      const updateRes = await api.put('/users/me', {
        nickname: nickname.trim() || user?.nickname || '',
        avatarUrl: res.url
      });
      
      localStorage.setItem('prode_u_jwt', updateRes.token);
      updateUser({
        nickname: updateRes.user.nickname,
        avatarUrl: updateRes.user.avatarUrl
      });
      
      queryClient.invalidateQueries({ queryKey: ['group-members'] });
      queryClient.invalidateQueries({ queryKey: ['my-groups'] });
      queryClient.invalidateQueries({ queryKey: ['fixtures'] });
      
      showToast('¡Imagen de perfil actualizada con éxito!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar imagen de perfil.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      showToast('El nickname no puede estar vacío.', 'error');
      return;
    }
    saveMutation.mutate({
      nickname: nickname.trim(),
      avatarUrl: avatarUrl
    });
  };

  return (
    <div className="scroll">
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontFamily: 'var(--font-fun)', fontSize: '24px' }}>Mi Perfil</h2>
        <p style={{ fontSize: '11px', fontWeight: '800', color: 'var(--yellow)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>
          Configura tu cuenta y mira tus estadísticas
        </p>
      </div>

      {/* Profile Card & Photo Selector */}
      <div 
        className="card" 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
          padding: '24px 16px',
          background: 'rgba(255,255,255,0.06)'
        }}
      >
        <div style={{ position: 'relative' }}>
          <img 
            src={getAvatarUrl(avatarUrl || user?.avatarUrl)} 
            alt="User Avatar" 
            className="avatar" 
            width={90} 
            height={90} 
            style={{ objectFit: 'cover', borderRadius: '50%', border: '4px solid var(--yellow)', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}
          />
          <label 
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              background: 'var(--yellow)',
              color: '#5D4037',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: '2px solid #fff',
              boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
            }}
          >
            <Camera size={14} />
            <input 
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={handleImageChange}
              disabled={uploading}
            />
          </label>
        </div>

        {uploading && (
          <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--yellow)' }}>
            Subiendo archivo...
          </span>
        )}

        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-fun)', fontSize: '20px' }}>{user?.nickname}</h3>
          <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Jugador registrado
          </span>
        </div>
      </div>

      {/* User Stats Widgets */}
      <div className="section">
        <span>Estadísticas de Juego</span>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="stat-v" style={{ color: 'var(--yellow)' }}>{totalPoints}</div>
          <div className="stat-l">Puntos</div>
        </div>
        <div className="stat">
          <div className="stat-v" style={{ color: 'var(--green)' }}>{exactCount}</div>
          <div className="stat-l">Exactos</div>
        </div>
        <div className="stat">
          <div className="stat-v" style={{ color: 'var(--blue)' }}>{playedCount}</div>
          <div className="stat-l">Completos</div>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="card" style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '18px' }}>
        <h3 style={{ fontFamily: 'var(--font-fun)', fontSize: '15px', color: 'var(--yellow)', marginBottom: '14px', display: 'flex', gap: '6px', alignItems: 'center' }}>
          <User size={16} /> Editar Información
        </h3>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Nickname de Usuario
            </label>
            <input
              type="text"
              className="input"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={saveMutation.isPending || uploading}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-green" 
            disabled={saveMutation.isPending || uploading}
            style={{ display: 'flex', gap: '8px' }}
          >
            <ShieldCheck size={18} />
            {saveMutation.isPending ? 'Guardando...' : 'Confirmar Cambios'}
          </button>
        </form>
      </div>

      {/* Logout button */}
      <button 
        onClick={logout}
        className="btn btn-pink" 
        style={{
          marginTop: '16px',
          background: '#FF6B6B',
          borderColor: 'rgba(0,0,0,0.1)',
          boxShadow: '0 6px 0 #C92A2A',
          display: 'flex',
          gap: '8px'
        }}
      >
        <LogOut size={18} />
        <span>Cerrar Sesión</span>
      </button>
    </div>
  );
};
