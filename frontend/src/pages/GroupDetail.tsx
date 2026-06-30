import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getAvatarUrl } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { ArrowLeft, Settings, UserMinus, ShieldAlert, Edit, Trash2, Lock, Eye, Copy, Check, MapPin } from 'lucide-react';
import { TeamFlag } from '@/components/TeamFlag';

interface GroupDetailProps {
  groupId: string;
  onBack: () => void;
}

interface Group {
  id: string;
  name: string;
  code: string;
  imageUrl: string | null;
  adminUserId: string;
  maxMembers: number;
  membersCount: number;
}

interface Member {
  userId: string;
  nickname: string;
  avatarUrl: string;
  totalPoints: number;
  joinedAt: number;
}

interface MatchLeaderboardItem {
  userId: string;
  nickname: string;
  avatarUrl: string;
  predHome: number | null;
  predAway: number | null;
  points: number;
  scoreType: string | null;
}

interface Fixture {
  id: number;
  date: string;
  status: string;
  round: string;
  homeTeam: { name: string; flag: string; code: string };
  awayTeam: { name: string; flag: string; code: string };
  goals: { home: number | null; away: number | null };
  penalty?: { home: number | null; away: number | null } | null;
  venue?: { name: string; city: string } | null;
}

export const GroupDetail: React.FC<GroupDetailProps> = ({ groupId, onBack }) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showToast } = useUIStore();

  const [activeSubTab, setActiveSubTab] = useState<'ranking' | 'matches' | 'settings'>('ranking');
  const [selectedFixtureId, setSelectedFixtureId] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Edit settings states
  const [editName, setEditName] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  // 1. Fetch Group Core Details
  const { data: detailRes, isLoading: isLoadingDetail, isError: isErrorDetail } = useQuery({
    queryKey: ['group-detail', groupId],
    queryFn: async () => {
      const res = await api.get(`/groups/${groupId}`);
      setEditName(res.group.name);
      setEditImageUrl(res.group.imageUrl || '');
      return res.group as Group;
    }
  });

  // 2. Fetch Group Members Standings
  const { data: membersRes, isLoading: isLoadingMembers, isError: isErrorMembers } = useQuery({
    queryKey: ['group-members', groupId],
    queryFn: async () => {
      const res = await api.get(`/groups/${groupId}/members`);
      return res.members as Member[];
    }
  });

  // 3. Fetch public fixtures from data-worker
  const { data: fixturesRes, isLoading: isLoadingFixtures, isError: isErrorFixtures } = useQuery({
    queryKey: ['fixtures'],
    queryFn: async () => {
      const res = await api.data.get('/fixtures');
      const fixtures = (res.fixtures as Fixture[]) || [];
      return fixtures.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
  });

  // 4. Fetch specific fixture comparison leaderboard inside this group
  const { data: compareRes, isLoading: isLoadingCompare } = useQuery({
    queryKey: ['group-compare', groupId, selectedFixtureId],
    queryFn: async () => {
      if (!selectedFixtureId) return null;
      const res = await api.get(`/groups/${groupId}/fixtures/${selectedFixtureId}/leaderboard`);
      return res.leaderboard as MatchLeaderboardItem[];
    },
    enabled: !!selectedFixtureId
  });

  // MUTATIONS FOR ADMINS
  // A. Kick Member
  const kickMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await api.delete(`/groups/${groupId}/members/${userId}`);
    },
    onSuccess: () => {
      showToast('Miembro expulsado del grupo.', 'success');
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group-detail', groupId] });
    },
    onError: (err: any) => {
      showToast(err.message || 'Error al expulsar miembro', 'error');
    }
  });

  // B. Update Group details
  const updateMutation = useMutation({
    mutationFn: async (payload: { name: string; imageUrl?: string }) => {
      return await api.put(`/groups/${groupId}`, payload);
    },
    onSuccess: () => {
      showToast('Configuración del grupo actualizada.', 'success');
      queryClient.invalidateQueries({ queryKey: ['group-detail', groupId] });
      queryClient.invalidateQueries({ queryKey: ['my-groups'] });
    },
    onError: (err: any) => {
      showToast(err.message || 'Error al actualizar grupo', 'error');
    }
  });

  // C. Delete Group
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await api.delete(`/groups/${groupId}`);
    },
    onSuccess: () => {
      showToast('Grupo eliminado permanentemente.', 'success');
      queryClient.invalidateQueries({ queryKey: ['my-groups'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onBack();
    },
    onError: (err: any) => {
      showToast(err.message || 'Error al eliminar grupo', 'error');
    }
  });

  const handleCopyCode = () => {
    if (detailRes?.code) {
      navigator.clipboard.writeText(detailRes.code);
      setCopiedCode(true);
      showToast('¡Código copiado!', 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleKick = (userId: string, nickname: string) => {
    if (window.confirm(`¿Estás seguro de que deseas expulsar a ${nickname} de este grupo?`)) {
      kickMutation.mutate(userId);
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      showToast('El nombre del grupo es obligatorio.', 'error');
      return;
    }
    updateMutation.mutate({
      name: editName.trim(),
      imageUrl: editImageUrl.trim() || undefined
    });
  };

  const handleDelete = () => {
    if (window.confirm('🚨 ¡ATENCIÓN! ¿Estás completamente seguro de eliminar este grupo? Esta acción no se puede deshacer y borrará a todos los miembros de la clasificación.')) {
      deleteMutation.mutate();
    }
  };

  const isLoading = isLoadingDetail || isLoadingMembers || isLoadingFixtures;
  const isError = isErrorDetail || isErrorMembers || isErrorFixtures;
  const isAdmin = detailRes && user && detailRes.adminUserId === user.id;

  return (
    <div className="scroll" style={{ paddingTop: '10px' }}>
      {/* Back button and title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
        <button 
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '12px',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 style={{ fontFamily: 'var(--font-fun)', fontSize: '20px' }}>
            {isLoadingDetail ? 'Cargando...' : detailRes?.name}
          </h2>
          <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Liga Privada PRODE
          </span>
        </div>
      </div>

      {isError ? (
        <div 
          className="card animate-fade-in" 
          style={{ 
            textAlign: 'center', 
            padding: '40px 20px', 
            color: 'var(--red)', 
            border: '2px dashed var(--red)',
            background: 'rgba(255, 69, 58, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            marginTop: '10px'
          }}
        >
          <div style={{ fontSize: '32px' }}>⚠️</div>
          <h3 style={{ fontFamily: 'var(--font-fun)', fontSize: '15px', color: 'var(--red)', margin: 0 }}>
            Error al conectar con la Liga
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '280px', lineHeight: '1.4', margin: 0 }}>
            No se pudieron obtener los detalles del grupo o la lista de integrantes desde el servidor. Por favor, reintenta más tarde.
          </p>
        </div>
      ) : isLoading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          Cargando detalles de liga...
        </div>
      ) : !detailRes ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--red)' }}>
          Error al cargar el grupo.
        </div>
      ) : (
        <>
          {/* Header Card with invitation code */}
          <div className="card" style={{ background: 'rgba(255, 255, 255, 0.06)', border: '2px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            {detailRes.imageUrl ? (
              <img 
                src={detailRes.imageUrl} 
                alt={detailRes.name} 
                style={{ width: '60px', height: '60px', borderRadius: '16px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }}
              />
            ) : (
              <div className="grp-img" style={{ width: '60px', height: '60px', borderRadius: '16px', fontSize: '24px' }}>
                {detailRes.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            
            <div style={{ flex: 1 }}>
              <div 
                onClick={handleCopyCode}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 203, 71, 0.12)',
                  border: '1px solid rgba(255, 203, 71, 0.25)',
                  padding: '4px 10px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '800',
                  color: 'var(--yellow)',
                  cursor: 'pointer'
                }}
              >
                <span>INVITAR: {detailRes.code}</span>
                {copiedCode ? <Check size={12} style={{ color: 'var(--green)' }} /> : <Copy size={12} />}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', fontWeight: '800', textTransform: 'uppercase' }}>
                👥 {detailRes.membersCount} integrantes
              </p>
            </div>
          </div>

          {/* Sub-tabs switch */}
          <div className="tabs" style={{ marginBottom: '16px' }}>
            <div 
              className={`tab ${activeSubTab === 'ranking' ? 'active' : ''}`}
              onClick={() => { setActiveSubTab('ranking'); setSelectedFixtureId(null); }}
            >
              Clasificación
            </div>
            <div 
              className={`tab ${activeSubTab === 'matches' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('matches')}
            >
              Comparador
            </div>
            <div 
              className={`tab ${activeSubTab === 'settings' ? 'active' : ''}`}
              onClick={() => { setActiveSubTab('settings'); setSelectedFixtureId(null); }}
            >
              Líder / Ajustes
            </div>
          </div>

          {/* SUB-TAB: CLASIFICACIÓN (OVERALL LEADERBOARD) */}
          {activeSubTab === 'ranking' && (
            <div>
              {membersRes && membersRes.length > 0 ? (
                membersRes.map((member, idx) => {
                  const rank = idx + 1;
                  const isMe = user && member.userId === user.id;

                  return (
                    <div 
                      key={member.userId} 
                      className={`lb-row ${isMe ? 'me' : ''}`}
                      style={{ padding: '12px 14px' }}
                    >
                      <div className="lb-left">
                        <span className="lb-rank">#{rank}</span>
                        <img 
                          src={getAvatarUrl(member.avatarUrl)} 
                          alt={member.nickname} 
                          className="avatar" 
                          width={32} 
                          height={32} 
                          style={{ objectFit: 'cover' }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '800', fontSize: '14px' }}>
                            {member.nickname} {isMe ? ' (Tú)' : ''}
                          </span>
                          {detailRes.adminUserId === member.userId && (
                            <span style={{ fontSize: '9px', fontWeight: '900', color: 'var(--yellow)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Creador ★
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="lb-pts">{member.totalPoints} pts</span>
                    </div>
                  );
                })
              ) : (
                <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
                  No hay miembros registrados en este grupo.
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB: COMPARADOR (MATCH PREDICTIONS VIEW) */}
          {activeSubTab === 'matches' && (
            <div>
              {!selectedFixtureId ? (
                <>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
                    Selecciona un partido para comparar pronósticos
                  </div>
                  {fixturesRes?.map(match => {
                    // Check if match started / closed (predictions can only be seen once closed)
                    const matchTime = new Date(match.date).getTime();
                    const isClosed = Date.now() > (matchTime - 60 * 60 * 1000);

                    return (
                      <div 
                        key={match.id}
                        className="card"
                        onClick={() => setSelectedFixtureId(match.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          cursor: 'pointer',
                          background: 'rgba(255,255,255,0.06)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '75%', overflow: 'hidden' }}>
                          <TeamFlag flag={match.homeTeam.flag} className="flag-sm" style={{ fontSize: '20px' }} />
                          <span style={{ fontFamily: 'var(--font-fun)', fontSize: '12px', width: '25px', textAlign: 'center' }}>
                            {['FT', 'AET', 'PEN'].includes(match.status) ? match.goals.home : '-'}
                          </span>
                          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>vs</span>
                          <span style={{ fontFamily: 'var(--font-fun)', fontSize: '12px', width: '25px', textAlign: 'center' }}>
                            {['FT', 'AET', 'PEN'].includes(match.status) ? match.goals.away : '-'}
                          </span>
                          <TeamFlag flag={match.awayTeam.flag} className="flag-sm" style={{ fontSize: '20px' }} />
                          
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {match.homeTeam.code} vs {match.awayTeam.code}
                          </span>
                          {match.status === 'PEN' && match.penalty && (
                            <span style={{ fontSize: '9px', color: 'var(--yellow)', fontWeight: 'bold', marginLeft: '6px' }}>
                              ({match.penalty.home}-{match.penalty.away} Pen)
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isClosed ? (
                            <Eye size={14} style={{ color: 'var(--green)' }} />
                          ) : (
                            <Lock size={14} style={{ color: 'var(--orange)' }} />
                          )}
                          <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: isClosed ? 'var(--green)' : 'var(--orange)' }}>
                            {isClosed ? 'Ver' : 'Privado'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div>
                  <button 
                    onClick={() => setSelectedFixtureId(null)}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      color: 'var(--yellow)',
                      fontFamily: 'var(--font-fun)',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginBottom: '16px',
                      textTransform: 'uppercase'
                    }}
                  >
                    ← Volver a Partidos
                  </button>

                  {/* Selected Match Card */}
                  {(() => {
                    const match = fixturesRes?.find(f => f.id === selectedFixtureId);
                    if (!match) return null;
                    
                    const matchTime = new Date(match.date).getTime();
                    const isClosed = Date.now() > (matchTime - 60 * 60 * 1000);

                    return (
                      <div className="card" style={{ border: '2px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.15)', padding: '16px' }}>
                        <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center', marginBottom: '8px' }}>
                          {match.round}
                        </div>
                        
                        {match.venue && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '10px' }}>
                            <MapPin size={10} style={{ color: 'var(--yellow)' }} />
                            <span>{match.venue.city ? `${match.venue.name} (${match.venue.city})` : match.venue.name}</span>
                          </div>
                        )}
                        
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '35%' }}>
                            <TeamFlag flag={match.homeTeam.flag} className="flag" style={{ fontSize: '32px' }} />
                            <span style={{ fontFamily: 'var(--font-fun)', fontSize: '12px', textAlign: 'center', marginTop: '2px' }}>{match.homeTeam.name}</span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div className="score-box" style={{ background: 'rgba(0,0,0,0.3)' }}>
                              <span className="score-val" style={{ fontSize: '20px' }}>{match.goals.home ?? '-'}</span>
                              <span className="score-dash">:</span>
                              <span className="score-val" style={{ fontSize: '20px' }}>{match.goals.away ?? '-'}</span>
                            </div>
                            {match.status === 'PEN' && match.penalty && (
                              <span style={{ fontSize: '11px', color: 'var(--yellow)', marginTop: '4px', fontWeight: 'bold' }}>
                                ({match.penalty.home} - {match.penalty.away} Pen)
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '35%' }}>
                            <TeamFlag flag={match.awayTeam.flag} className="flag" style={{ fontSize: '32px' }} />
                            <span style={{ fontFamily: 'var(--font-fun)', fontSize: '12px', textAlign: 'center', marginTop: '2px' }}>{match.awayTeam.name}</span>
                          </div>
                        </div>

                        {!isClosed && (
                          <div 
                            style={{
                              marginTop: '12px',
                              background: 'rgba(255, 159, 67, 0.15)',
                              border: '1px solid var(--orange)',
                              borderRadius: '10px',
                              padding: '10px',
                              textAlign: 'center',
                              fontSize: '11px',
                              fontWeight: '700',
                              color: '#FFD3B4',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <Lock size={12} />
                            <span>Las predicciones de otros miembros son privadas hasta 1 hora antes de que inicie.</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Leaderboard Table for this match */}
                  {isLoadingCompare ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>Cargando comparación...</div>
                  ) : compareRes && compareRes.length > 0 ? (
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Pronósticos de la Liga
                      </div>

                      {compareRes.map(item => {
                        const isMe = user && item.userId === user.id;
                        
                        // Check if match started or closed
                        const match = fixturesRes?.find(f => f.id === selectedFixtureId);
                        const matchTime = match ? new Date(match.date).getTime() : 0;
                        const isClosed = Date.now() > (matchTime - 60 * 60 * 1000);

                        return (
                          <div 
                            key={item.userId} 
                            className="lb-row"
                            style={{
                              padding: '10px 12px',
                              background: isMe ? 'rgba(255, 203, 71, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                              borderColor: isMe ? 'var(--yellow)' : 'rgba(255, 255, 255, 0.08)'
                            }}
                          >
                            <div className="lb-left" style={{ width: '50%' }}>
                              <img 
                                src={getAvatarUrl(item.avatarUrl)} 
                                alt={item.nickname} 
                                className="avatar" 
                                width={24} 
                                height={24} 
                                style={{ objectFit: 'cover' }}
                              />
                              <span style={{ fontSize: '13px', fontWeight: '800', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.nickname} {isMe ? ' (Tú)' : ''}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', width: '50%' }}>
                              {item.predHome !== null && item.predAway !== null ? (
                                isClosed || isMe ? (
                                  <span style={{ fontFamily: 'var(--font-fun)', fontSize: '13px', color: 'var(--yellow)' }}>
                                    {item.predHome} - {item.predAway}
                                  </span>
                                ) : (
                                  <Lock size={12} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
                                )
                              ) : (
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin pronóstico</span>
                              )}

                              {['FT', 'AET', 'PEN'].includes(match?.status || '') && item.predHome !== null && (
                                <span 
                                  style={{
                                    fontSize: '9px',
                                    fontWeight: '900',
                                    background: item.points > 0 ? 'var(--green)' : 'rgba(255,255,255,0.08)',
                                    color: item.points > 0 ? '#fff' : 'var(--text-muted)',
                                    padding: '2px 6px',
                                    borderRadius: '6px'
                                  }}
                                >
                                  +{item.points} pts
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="card" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                      No hay datos de predicciones.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB: SETTINGS (ADMIN / LEADER ONLY) */}
          {activeSubTab === 'settings' && (
            <div>
              {/* Member list to kick */}
              <div className="card" style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '16px' }}>
                <h3 style={{ fontFamily: 'var(--font-fun)', fontSize: '15px', color: 'var(--yellow)', marginBottom: '12px' }}>
                  Integrantes del Grupo
                </h3>

                {membersRes?.map(member => {
                  const isCurrentAdmin = detailRes.adminUserId === member.userId;
                  const canKick = isAdmin && !isCurrentAdmin;

                  return (
                    <div 
                      key={member.userId} 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.05)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img 
                          src={getAvatarUrl(member.avatarUrl)} 
                          alt={member.nickname} 
                          className="avatar" 
                          width={24} 
                          height={24} 
                          style={{ objectFit: 'cover' }}
                        />
                        <span style={{ fontSize: '13px', fontWeight: '700' }}>
                          {member.nickname} {member.userId === user?.id ? ' (Tú)' : ''}
                        </span>
                        {isCurrentAdmin && (
                          <span style={{ fontSize: '9px', fontWeight: '900', color: 'var(--yellow)', textTransform: 'uppercase' }}>
                            Creador
                          </span>
                        )}
                      </div>

                      {canKick && (
                        <button 
                          onClick={() => handleKick(member.userId, member.nickname)}
                          style={{
                            background: 'rgba(255, 107, 107, 0.1)',
                            border: '1px solid var(--red)',
                            borderRadius: '8px',
                            color: 'var(--red)',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: '700'
                          }}
                        >
                          <UserMinus size={12} />
                          Expulsar
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Core admin settings */}
              {isAdmin ? (
                <div className="card" style={{ border: '2px solid rgba(255,107,107,0.2)', padding: '18px' }}>
                  <h3 style={{ fontFamily: 'var(--font-fun)', fontSize: '15px', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                    <Settings size={18} />
                    Panel de Administración
                  </h3>

                  <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Modificar Nombre de Grupo
                      </label>
                      <input
                        type="text"
                        className="input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        disabled={updateMutation.isPending}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Modificar URL de Imagen
                      </label>
                      <input
                        type="text"
                        inputMode="url"
                        className="input"
                        value={editImageUrl}
                        onChange={(e) => setEditImageUrl(e.target.value)}
                        placeholder="Ej. https://url-imagen.png"
                        disabled={updateMutation.isPending}
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="btn btn-green"
                      disabled={updateMutation.isPending}
                      style={{ padding: '10px', fontSize: '13px', display: 'flex', gap: '6px' }}
                    >
                      <Edit size={14} />
                      {updateMutation.isPending ? 'Actualizando...' : 'Guardar Ajustes'}
                    </button>
                  </form>

                  <div style={{ marginTop: '20px', borderTop: '2px dashed rgba(255,107,107,0.2)', paddingTop: '16px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: '700' }}>
                      Zona de Peligro
                    </div>
                    <button 
                      className="btn btn-pink"
                      onClick={handleDelete}
                      disabled={deleteMutation.isPending}
                      style={{ background: 'var(--red)', boxShadow: '0 6px 0 #C92A2A', display: 'flex', gap: '6px' }}
                    >
                      <Trash2 size={16} />
                      {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar Liga Privada'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="card" style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <ShieldAlert size={32} style={{ color: 'var(--orange)', marginBottom: '8px' }} />
                  <div>Solo el creador del grupo tiene permisos para editar los ajustes del grupo o expulsar miembros.</div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
