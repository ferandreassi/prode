import React, { useState } from 'react';
import { store, useStore } from '../store';

export const GroupDetailScreen: React.FC = () => {
  const { activeGroup, currentUser, fixtures } = useStore();
  const [activeTab, setActiveTab] = useState<'ranking' | 'matches' | 'members'>('ranking');

  if (!activeGroup) {
    return null;
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeGroup.code);
    store.showToast('¡Código copiado al portapapeles!');
  };

  const handleKickMember = (name: string) => {
    if (confirm(`¿Estás seguro de que deseas expulsar a ${name} del grupo?`)) {
      alert(`${name} ha sido expulsado del grupo.`);
      store.showToast(`${name} expulsado.`);
    }
  };

  const initials = activeGroup.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  // Integrantes Mock
  const members = [
    { nickname: 'ScaloniTech', avatarSeed: 'Scaloni', isAdmin: true },
    { nickname: currentUser.nickname, avatarSeed: currentUser.avatarSeed, isMe: true },
    { nickname: 'KunAguero19', avatarSeed: 'Aguerito' },
    { nickname: 'DibuMartinez', avatarSeed: 'Dibu' },
    { nickname: 'CutiRomero', avatarSeed: 'Cuti' }
  ];

  return (
    <div className="screen active" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Back Header */}
      <div className="header">
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} 
          onClick={() => store.navigateTo('screen-groups')}
        >
          <i className="fa-solid fa-chevron-left" style={{ fontSize: '16px' }}></i>
          <h2 style={{ fontFamily: 'var(--font-fun)' }}>
            {activeGroup.name}
          </h2>
        </div>
        <button 
          className="close-btn" 
          onClick={() => store.setGroupSettingsModal(true)}
        >
          <i className="fa-solid fa-gear"></i>
        </button>
      </div>
      
      <div className="scroll" style={{ paddingTop: '15px' }}>
        {/* Group Info Card */}
        <div 
          className="card" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            borderColor: 'rgba(255,255,255,0.06)', 
            background: 'rgba(255,255,255,0.01)' 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div 
              className="grp-img" 
              style={{ 
                background: 'var(--blue)', 
                width: '56px', 
                height: '56px', 
                fontSize: '20px', 
                fontWeight: 700 
              }}
            >
              {initials}
            </div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                CÓDIGO DE INVITACIÓN
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <code style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 700, color: 'var(--yellow)', letterSpacing: '1px' }}>
                  {activeGroup.code}
                </code>
                <i 
                  className="fa-regular fa-copy" 
                  style={{ color: 'var(--blue)', cursor: 'pointer' }} 
                  onClick={handleCopyCode}
                ></i>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs Section */}
        <div className="tabs" style={{ marginTop: '20px' }}>
          <div 
            className={`tab ${activeTab === 'ranking' ? 'active' : ''}`} 
            onClick={() => setActiveTab('ranking')}
          >
            🏆 LEADERBOARD
          </div>
          <div 
            className={`tab ${activeTab === 'matches' ? 'active' : ''}`} 
            onClick={() => setActiveTab('matches')}
          >
            ⚽ PARTIDOS
          </div>
          <div 
            className={`tab ${activeTab === 'members' ? 'active' : ''}`} 
            onClick={() => setActiveTab('members')}
          >
            👥 MIEMBROS
          </div>
        </div>
        
        {/* TAB Content 1: Leaderboard (Ranking) */}
        {activeTab === 'ranking' && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {members.map((member, index) => {
              const rank = index + 1;
              const isMe = member.isMe;
              const points = isMe ? currentUser.points : (44 - index * 6);
              const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${member.avatarSeed}`;
              
              return (
                <div key={member.nickname} className={`lb-row ${isMe ? 'me' : ''}`}>
                  <div className="lb-left">
                    <span className="lb-rank">{rank}</span>
                    <img 
                      src={avatarUrl} 
                      alt="avatar" 
                      className="avatar" 
                      style={{ width: '36px', height: '36px', borderColor: isMe ? 'var(--green)' : 'rgba(255,255,255,0.1)' }} 
                    />
                    <span style={{ fontWeight: 800, fontSize: '14px' }}>
                      {member.nickname} {isMe && '(Tú)'}
                    </span>
                  </div>
                  <span className="lb-pts">{points} pts</span>
                </div>
              );
            })}
          </div>
        )}
        
        {/* TAB Content 2: Partidos del Grupo (Fixture) */}
        {activeTab === 'matches' && (
          <div>
            {fixtures.map((fixture) => {
              const isFinished = fixture.status === 'FINISHED';
              return (
                <div 
                  key={fixture.id}
                  className="card" 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '14px' }}
                  onClick={() => isFinished && store.openMatchLeaderboard(fixture, 'screen-group-detail')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="flag-sm">{fixture.homeFlag}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700 }}>{fixture.homeName.slice(0, 3).toUpperCase()}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>vs</span>
                    <span style={{ fontSize: '12px', fontWeight: 700 }}>{fixture.awayName.slice(0, 3).toUpperCase()}</span>
                    <span className="flag-sm">{fixture.awayFlag}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isFinished ? (
                      <>
                        <span className="badge badge-done" style={{ fontSize: '8px' }}>FINALIZADO</span>
                        <span style={{ fontFamily: 'var(--font-fun)', fontSize: '14px', fontWeight: 700 }}>
                          {fixture.homeGoals} - {fixture.awayGoals}
                        </span>
                        <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px', color: 'var(--text-muted)' }}></i>
                      </>
                    ) : (
                      <>
                        <span className="badge badge-open" style={{ fontSize: '8px' }}>ABIERTO</span>
                        <span style={{ fontFamily: 'var(--font-fun)', fontSize: '11px', color: 'var(--yellow)', textTransform: 'uppercase' }}>
                          {fixture.date}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* TAB Content 3: Miembros del Grupo */}
        {activeTab === 'members' && (
          <div>
            {members.map((member) => {
              const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${member.avatarSeed}`;
              return (
                <div 
                  key={member.nickname}
                  className="card" 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img 
                      src={avatarUrl} 
                      alt="avatar" 
                      className="avatar" 
                      style={{ width: '32px', height: '32px', borderColor: member.isMe ? 'var(--green)' : 'rgba(255,255,255,0.1)' }} 
                    />
                    <span style={{ fontWeight: 800, fontSize: '13px' }}>
                      {member.nickname} {member.isMe && '(Tú)'}
                    </span>
                  </div>
                  {member.isAdmin ? (
                    <span 
                      className="badge" 
                      style={{ 
                        background: 'rgba(0,229,255,0.15)', 
                        color: 'var(--blue)', 
                        border: '1px solid var(--blue)', 
                        fontSize: '8px' 
                      }}
                    >
                      ADMIN
                    </span>
                  ) : (
                    !member.isMe && (
                      <button 
                        className="close-btn" 
                        style={{ 
                          width: '28px', 
                          height: '28px', 
                          color: 'var(--red)', 
                          background: 'rgba(255,59,48,0.1)', 
                          borderColor: 'rgba(255,59,48,0.2)' 
                        }}
                        onClick={() => handleKickMember(member.nickname)}
                      >
                        <i className="fa-solid fa-user-minus" style={{ fontSize: '11px' }}></i>
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
