import React, { useState, useEffect } from 'react';
import { store, useStore } from '../store';

export const DashboardScreen: React.FC = () => {
  const { groups, fixtures } = useStore();

  // Cuenta regresiva animada (Simulada que empieza en 2h 14m 55s y decrementa)
  const [timeLeft, setTimeLeft] = useState(2 * 3600 + 14 * 60 + 55);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 2 * 3600 + 14 * 60 + 55));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return {
      hours: h.toString().padStart(2, '0'),
      minutes: m.toString().padStart(2, '0'),
      seconds: s.toString().padStart(2, '0')
    };
  };

  const { hours, minutes, seconds } = formatTime(timeLeft);

  // Obtener el partido inaugural
  const nextMatch = fixtures.find(f => f.id === 101) || fixtures[0];

  // Obtener el último partido calificado para mostrar puntuaciones recientes
  const lastScoredMatch = fixtures.find(f => f.id === 104) || fixtures[3];

  return (
    <div className="screen active" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="scroll">
        {/* Next Match Card */}
        <div 
          className="card next-match-widget" 
          style={{ 
            padding: '20px', 
            borderColor: 'rgba(0, 229, 255, 0.2)', 
            background: 'linear-gradient(180deg, rgba(0, 229, 255, 0.03) 0%, rgba(255, 255, 255, 0.02) 100%)' 
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span className="badge badge-open">PRÓXIMO PARTIDO</span>
            <span style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 700 }}>
              {nextMatch.roundName.toUpperCase()}
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', margin: '18px 0' }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <span className="flag">{nextMatch.homeFlag}</span>
              <h4 style={{ fontFamily: 'var(--font-fun)', fontSize: '14px', marginTop: '4px' }}>
                {nextMatch.homeName.slice(0, 3).toUpperCase()}
              </h4>
            </div>
            
            <div style={{ textAlign: 'center', width: '60px' }}>
              <span style={{ fontFamily: 'var(--font-fun)', fontSize: '20px', fontWeight: 800, color: 'var(--text-muted)' }}>VS</span>
            </div>
            
            <div style={{ textAlign: 'center', flex: 1 }}>
              <span className="flag">{nextMatch.awayFlag}</span>
              <h4 style={{ fontFamily: 'var(--font-fun)', fontSize: '14px', marginTop: '4px' }}>
                {nextMatch.awayName.slice(0, 3).toUpperCase()}
              </h4>
            </div>
          </div>
          
          {/* Countdown */}
          <div className="countdown" style={{ marginBottom: '20px' }}>
            <div className="cd-item">
              <span className="cd-val">{hours}</span>
              <span className="cd-lbl" style={{ display: 'block' }}>HORAS</span>
            </div>
            <span style={{ fontFamily: 'var(--font-fun)', fontSize: '20px', color: 'var(--yellow)', paddingTop: '2px' }}>:</span>
            <div className="cd-item">
              <span className="cd-val">{minutes}</span>
              <span className="cd-lbl" style={{ display: 'block' }}>MIN</span>
            </div>
            <span style={{ fontFamily: 'var(--font-fun)', fontSize: '20px', color: 'var(--yellow)', paddingTop: '2px' }}>:</span>
            <div className="cd-item">
              <span className="cd-val">{seconds}</span>
              <span className="cd-lbl" style={{ display: 'block' }}>SEG</span>
            </div>
          </div>
          
          {nextMatch.userPrediction ? (
            <button 
              className="btn btn-yellow" 
              onClick={() => store.openPredictModal(nextMatch)}
            >
              PREDICCIÓN: {nextMatch.userPrediction.home} - {nextMatch.userPrediction.away} <i className="fa-solid fa-pen" style={{ marginLeft: '6px' }}></i>
            </button>
          ) : (
            <button 
              className="btn btn-green" 
              onClick={() => store.openPredictModal(nextMatch)}
            >
              HACER PREDICCIÓN <i className="fa-solid fa-square-poll-horizontal" style={{ marginLeft: '6px' }}></i>
            </button>
          )}
        </div>
        
        {/* Mis Grupos Quick View */}
        <div className="section">
          <span>MIS GRUPOS</span>
          <span 
            style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--blue)', fontWeight: 700, cursor: 'pointer' }}
            onClick={() => store.navigateTo('screen-groups')}
          >
            VER TODOS
          </span>
        </div>
        
        <div>
          {groups.slice(0, 2).map((group, index) => {
            const initials = group.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            const colors = ['var(--blue)', 'var(--pink)', 'var(--yellow)'];
            return (
              <div 
                key={group.code}
                className="card" 
                onClick={() => store.openGroupDetail(group)} 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="grp-img" style={{ background: colors[index % colors.length] }}>
                    {initials}
                  </div>
                  <div>
                    <h4 style={{ fontFamily: 'var(--font-fun)', fontSize: '15px' }}>{group.name}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {group.membersCount} miembros • Límite {group.maxMembers}
                    </p>
                  </div>
                </div>
                <span className="badge badge-open">#{group.rank}</span>
              </div>
            );
          })}
        </div>
        
        {/* Reciente / Historial Widget */}
        <div className="section">
          <span>ÚLTIMAS PUNTUACIONES</span>
        </div>
        
        {lastScoredMatch && (
          <div 
            className="card" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} 
            onClick={() => store.openMatchLeaderboard(
              lastScoredMatch, 
              'screen-dashboard'
            )}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                MUNDIAL 2026 • FINALIZADO
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="flag-sm">{lastScoredMatch.homeFlag}</span>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>{lastScoredMatch.homeName.slice(0, 3).toUpperCase()}</span>
                <span style={{ fontWeight: 800 }}>
                  {lastScoredMatch.homeGoals} - {lastScoredMatch.awayGoals}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>{lastScoredMatch.awayName.slice(0, 3).toUpperCase()}</span>
                <span className="flag-sm">{lastScoredMatch.awayFlag}</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                Predijiste: <strong style={{ color: 'var(--white)' }}>
                  {lastScoredMatch.userPrediction?.home} - {lastScoredMatch.userPrediction?.away}
                </strong>
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <span className="lb-pts" style={{ fontSize: '15px' }}>
                +{lastScoredMatch.pointsEarned} PTS
              </span>
              <span className={`pts-tag pts-${lastScoredMatch.pointsEarned}`} style={{ margin: 0, fontSize: '9px', padding: '2px 6px', borderRadius: '6px' }}>
                {lastScoredMatch.ptsLabel}
              </span>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
};
