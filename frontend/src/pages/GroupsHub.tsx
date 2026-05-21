import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useUIStore } from '@/store/uiStore';
import { GroupDetail } from './GroupDetail';
import { Plus, UserPlus, Copy, Check, ArrowRight } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  code: string;
  image_url: string | null;
  admin_user_id: string;
  max_members: number;
  members_count: number;
}

export const GroupsHub: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useUIStore();
  
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  
  // Modals inside page
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  
  // Form states
  const [groupName, setGroupName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // 1. Fetch user's groups
  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-groups'],
    queryFn: async () => {
      const res = await api.get('/users/me/groups');
      return res.groups as Group[];
    }
  });

  // 2. Mutation to Create Group
  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; imageUrl?: string }) => {
      return await api.post('/groups', payload);
    },
    onSuccess: (res: any) => {
      showToast(`¡Grupo "${res.group.name}" creado con éxito!`, 'success');
      queryClient.invalidateQueries({ queryKey: ['my-groups'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowCreateModal(false);
      setGroupName('');
      setImageUrl('');
    },
    onError: (err: any) => {
      showToast(err.message || 'Error al crear grupo', 'error');
    }
  });

  // 3. Mutation to Join Group
  const joinMutation = useMutation({
    mutationFn: async (code: string) => {
      return await api.post('/groups/join', { code });
    },
    onSuccess: (res: any) => {
      showToast(`¡Te has unido al grupo "${res.group.name}"!`, 'success');
      queryClient.invalidateQueries({ queryKey: ['my-groups'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowJoinModal(false);
      setJoinCode('');
    },
    onError: (err: any) => {
      showToast(err.message || 'Código inválido o ya perteneces al grupo.', 'error');
    }
  });

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      showToast('El nombre del grupo es obligatorio.', 'error');
      return;
    }
    createMutation.mutate({
      name: groupName.trim(),
      imageUrl: imageUrl.trim() || undefined
    });
  };

  const handleJoinGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || joinCode.trim().length !== 8) {
      showToast('El código de invitación debe tener exactamente 8 caracteres (ej. ABCD1234).', 'error');
      return;
    }
    joinMutation.mutate(joinCode.trim().toUpperCase());
  };

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast('¡Código de invitación copiado!', 'success');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // If viewing a group detail, render that view instead
  if (activeGroupId) {
    return <GroupDetail groupId={activeGroupId} onBack={() => setActiveGroupId(null)} />;
  }

  return (
    <div className="scroll">
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}
      >
        <div>
          <h2 style={{ fontFamily: 'var(--font-fun)', fontSize: '24px' }}>Mis Grupos</h2>
          <p style={{ fontSize: '11px', fontWeight: '800', color: 'var(--yellow)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>
            Compite con amigos y compañeros
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn btn-yellow" 
            onClick={() => setShowJoinModal(true)} 
            style={{ width: '42px', height: '42px', padding: 0, borderRadius: '12px' }}
            title="Unirse con Código"
          >
            <UserPlus size={18} />
          </button>
          <button 
            className="btn btn-green" 
            onClick={() => setShowCreateModal(true)}
            style={{ width: '42px', height: '42px', padding: 0, borderRadius: '12px' }}
            title="Crear Nuevo Grupo"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {isError ? (
        <div 
          className="card" 
          style={{ 
            textAlign: 'center', 
            padding: '40px 20px', 
            color: 'var(--red)', 
            border: '2px dashed var(--red)',
            background: 'rgba(255, 69, 58, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div style={{ fontSize: '32px' }}>⚠️</div>
          <h3 style={{ fontFamily: 'var(--font-fun)', fontSize: '15px', color: 'var(--red)', margin: 0 }}>
            No se pudieron cargar tus grupos
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '280px', lineHeight: '1.4', margin: 0 }}>
            No se pudo obtener la información de tus ligas desde el servidor. Por favor, inténtalo de nuevo más tarde.
          </p>
        </div>
      ) : isLoading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          Cargando tus grupos...
        </div>
      ) : !data || data.length === 0 ? (
        <div 
          className="card" 
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '2px dashed var(--border)',
            textAlign: 'center',
            padding: '40px 20px',
            marginTop: '10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div style={{ fontSize: '48px' }}>🏆🛡️</div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-fun)', fontSize: '16px', color: 'var(--yellow)', marginBottom: '8px' }}>
              ¿Aún sin grupos de competencia?
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Crea un grupo para competir con tus compañeros o pídele a un amigo su código de invitación de 8 caracteres para unirte a su grupo.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
            <button className="btn btn-ghost" onClick={() => setShowJoinModal(true)}>
              <UserPlus size={16} /> Unirse
            </button>
            <button className="btn btn-green" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} /> Crear Grupo
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {data.map((group) => (
            <div 
              key={group.id} 
              className="card"
              onClick={() => setActiveGroupId(group.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '65%' }}>
                {group.image_url ? (
                  <img 
                    src={group.image_url} 
                    alt={group.name} 
                    style={{ width: '48px', height: '48px', borderRadius: '14px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }}
                  />
                ) : (
                  <div className="grp-img" style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.08)', color: 'var(--yellow)' }}>
                    {group.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div style={{ overflow: 'hidden' }}>
                  <h4 style={{ fontFamily: 'var(--font-fun)', fontSize: '15px', color: 'var(--white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {group.name}
                  </h4>
                  <div 
                    onClick={(e) => handleCopyCode(e, group.code)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(0,0,0,0.15)',
                      padding: '2px 8px',
                      borderRadius: '8px',
                      marginTop: '4px',
                      fontSize: '10px',
                      fontWeight: '800',
                      color: 'var(--yellow)',
                      cursor: 'pointer',
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}
                  >
                    <span>CÓDIGO: {group.code}</span>
                    {copiedCode === group.code ? <Check size={10} style={{ color: 'var(--green)' }} /> : <Copy size={10} />}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span 
                  style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    color: 'var(--text-muted)',
                    background: 'rgba(255,255,255,0.06)',
                    padding: '4px 10px',
                    borderRadius: '12px'
                  }}
                >
                  👥 {group.members_count}
                </span>
                <ArrowRight size={16} style={{ color: 'rgba(255,255,255,0.3)' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE GROUP MODAL */}
      {showCreateModal && (
        <div className="modal active" onClick={() => setShowCreateModal(false)}>
          <div className="modal-body" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: '32px' }}>
            <div className="modal-top">
              <h3>Crear Nuevo Grupo</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Nombre del Grupo
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej. Los Reyes del Pronóstico"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  disabled={createMutation.isPending}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  URL de Imagen (Opcional)
                </label>
                <input
                  type="url"
                  className="input"
                  placeholder="Ej. https://url-imagen.png"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  disabled={createMutation.isPending}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-green" 
                disabled={createMutation.isPending}
                style={{ marginTop: '10px' }}
              >
                {createMutation.isPending ? 'Creando...' : 'Crear LIGA PRIVADA'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* JOIN GROUP MODAL */}
      {showJoinModal && (
        <div className="modal active" onClick={() => setShowJoinModal(false)}>
          <div className="modal-body" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: '32px' }}>
            <div className="modal-top">
              <h3>Unirse a Grupo</h3>
              <button className="close-btn" onClick={() => setShowJoinModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleJoinGroup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Código de Invitación (8 caracteres)
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej. SILO9823"
                  maxLength={8}
                  style={{ textTransform: 'uppercase', letterSpacing: '2px', textAlign: 'center', fontSize: '18px', fontFamily: 'var(--font-fun)', color: 'var(--yellow)' }}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  disabled={joinMutation.isPending}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-yellow" 
                disabled={joinMutation.isPending}
                style={{ marginTop: '10px' }}
              >
                {joinMutation.isPending ? 'Uniéndote...' : 'Unirse al Grupo'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
