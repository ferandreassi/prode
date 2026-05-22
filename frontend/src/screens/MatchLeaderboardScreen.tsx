import React from 'react';
import { store, useStore } from '../store';

export const MatchLeaderboardScreen: React.FC = () => {
  const { activeMatchDetail, lastScreenBeforeMatch } = useStore();

  if (!activeMatchDetail) {
    return null;
  }

  const leaderboard = store.getMatchLeaderboard(activeMatchDetail.id);

  return (
    <div className="screen active" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Back Header */}
      <div className="header">
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} 
          onClick={() => store.navigateTo(lastScreenBeforeMatch)}
        >
          <i className="fa-solid fa-chevron-left" style={{ fontSize: '16px' }}></i>
          <h2 style={{ fontFamily: 'var(--font-fun)' }}>Comparativa</h2>
        </div>
      </div>
      
      <div className="scroll">
        <p 
          style={{ 
            fontSize: '11px', 
            fontWeight: 800, 
            color: 'var(--text-muted)', 
            textAlign: 'center', 
            textTransform: 'uppercase', 
            margin: '10px 0 6px' 
          }}
        >
          {activeMatchDetail.roundName.toUpperCase()}
        </p>
        
        {/* Scoreboard Card */}
        <div 
          className="card" 
          style={{ 
            padding: '20px 14px', 
            borderColor: 'rgba(255,255,255,0.06)', 
            background: 'rgba(255,255,255,0.01)' 
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <span className="flag" style={{ fontSize: '40px' }}>
                {activeMatchDetail.homeFlag}
              </span>
              <h4 style={{ fontFamily: 'var(--font-fun)', fontSize: '14px', marginTop: '4px' }}>
                {activeMatchDetail.homeName.slice(0, 3).toUpperCase()}
              </h4>
            </div>
            
            <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontFamily: 'var(--font-fun)', fontSize: '36px', fontWeight: 800 }}>
                {activeMatchDetail.homeGoals}
              </span>
              <span style={{ fontFamily: 'var(--font-fun)', fontSize: '20px', fontWeight: 800, color: 'var(--text-muted)', paddingBottom: '4px' }}>
                -
              </span>
              <span style={{ fontFamily: 'var(--font-fun)', fontSize: '36px', fontWeight: 800 }}>
                {activeMatchDetail.awayGoals}
              </span>
            </div>
            
            <div style={{ textAlign: 'center', flex: 1 }}>
              <span className="flag" style={{ fontSize: '40px' }}>
                {activeMatchDetail.awayFlag}
              </span>
              <h4 style={{ fontFamily: 'var(--font-fun)', fontSize: '14px', marginTop: '4px' }}>
                {activeMatchDetail.awayName.slice(0, 3).toUpperCase()}
              </h4>
            </div>
          </div>
        </div>
        
        {/* Leaderboard Table Label */}
        <div className="section">
          <span>PREDICCIONES DEL GRUPO</span>
        </div>
        
        {/* Players predictions list */}
        <div>
          {leaderboard.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '20px', fontSize: '13px' }}>
              No hay predicciones disponibles para este partido.
            </div>
          ) : (
            leaderboard.map((player, index) => {
              const rank = index + 1;
              const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${player.avatarSeed}`;
              
              return (
                <div 
                  key={player.nickname} 
                  className={`lb-row ${player.isMe ? 'me' : ''}`}
                  style={{ marginBottom: '8px' }}
                >
                  <div className="lb-left">
                    <span className="lb-rank">{rank}</span>
                    <img 
                      src={avatarUrl} 
                      alt="avatar" 
                      className="avatar" 
                      style={{ width: '36px', height: '36px', border: '2px solid rgba(255,255,255,0.35)' }} 
                    />
                    <div>
                      <span style={{ fontWeight: 800, display: 'block', lineHeight: 1.2, fontSize: '14px' }}>
                        {player.nickname} {player.isMe && '(Tú)'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        Predijo: <strong style={{ color: 'var(--white)' }}>{player.pred}</strong>
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span className="lb-pts" style={{ fontSize: '14px' }}>
                      {player.points} pts
                    </span>
                    <span className={`pts-tag pts-${player.points}`} style={{ margin: 0, fontSize: '9px', padding: '2px 6px', borderRadius: '6px' }}>
                      {player.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
