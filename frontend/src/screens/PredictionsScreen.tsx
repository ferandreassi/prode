import React, { useState } from 'react';
import { store, useStore } from '../store';

export const PredictionsScreen: React.FC = () => {
  const { fixtures } = useStore();
  const [filter, setFilter] = useState<'all' | 'OPEN' | 'FINISHED'>('all');

  const filteredFixtures = fixtures.filter(f => {
    if (filter === 'all') return true;
    return f.status === filter;
  });

  return (
    <div className="screen active" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="scroll">
        <h2 style={{ fontFamily: 'var(--font-fun)', fontSize: '22px', marginBottom: '12px' }}>
          Predicciones
        </h2>
        
        {/* Filter Chips */}
        <div className="chips">
          <div 
            className={`chip ${filter === 'all' ? 'active' : ''}`} 
            onClick={() => setFilter('all')}
          >
            TODOS
          </div>
          <div 
            className={`chip ${filter === 'OPEN' ? 'active' : ''}`} 
            onClick={() => setFilter('OPEN')}
          >
            PENDIENTES
          </div>
          <div 
            className={`chip ${filter === 'FINISHED' ? 'active' : ''}`} 
            onClick={() => setFilter('FINISHED')}
          >
            REALIZADOS
          </div>
        </div>
        
        {/* Predictions List grouped by round */}
        {filteredFixtures.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px', fontSize: '14px' }}>
            No se encontraron partidos en esta categoría.
          </div>
        ) : (
          filteredFixtures.map((fixture, index) => {
            // Mostrar etiqueta de ronda si es el primer partido o cambia de ronda
            const showRoundLabel = index === 0 || filteredFixtures[index - 1].roundName !== fixture.roundName;

            return (
              <React.Fragment key={fixture.id}>
                {showRoundLabel && (
                  <div className="round-lbl">{fixture.roundName.toUpperCase()}</div>
                )}

                {/* Tarjeta del Partido */}
                {fixture.status === 'FINISHED' ? (
                  // Partido Finalizado (cliqueable para ver leaderboard)
                  <div 
                    className="card match-predict-card" 
                    onClick={() => store.openMatchLeaderboard(fixture, 'screen-predictions')}
                    style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderColor: 'rgba(255,255,255,0.04)', opacity: 0.85, cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <span className="flag-sm">{fixture.homeFlag}</span>
                        <span style={{ fontWeight: 700 }}>{fixture.homeName.slice(0, 3).toUpperCase()}</span>
                      </div>
                      
                      <div className="score-box" style={{ background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.05)' }}>
                        <span className="score-val" style={{ color: 'var(--text-muted)' }}>{fixture.homeGoals}</span>
                        <span className="score-dash">-</span>
                        <span className="score-val" style={{ color: 'var(--text-muted)' }}>{fixture.awayGoals}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
                        <span style={{ fontWeight: 700 }}>{fixture.awayName.slice(0, 3).toUpperCase()}</span>
                        <span className="flag-sm">{fixture.awayFlag}</span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        Mi predicción: <strong>
                          {fixture.userPrediction ? `${fixture.userPrediction.home} - ${fixture.userPrediction.away}` : 'Ninguna'}
                        </strong>
                      </span>
                      {fixture.pointsEarned !== undefined && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="lb-pts" style={{ fontSize: '13px', color: 'var(--yellow)' }}>
                            +{fixture.pointsEarned} PTS
                          </span>
                          <span className={`pts-tag pts-${fixture.pointsEarned}`} style={{ margin: 0, fontSize: '8px', padding: '1px 4px', borderRadius: '4px' }}>
                            {fixture.ptsLabel}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Partido Abierto / Pendiente
                  fixture.userPrediction ? (
                    // Ya predicho (cliqueable la caja para reeditar)
                    <div 
                      className="card match-predict-card" 
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <span className="flag-sm">{fixture.homeFlag}</span>
                        <span style={{ fontWeight: 700 }}>{fixture.homeName.slice(0, 3).toUpperCase()}</span>
                      </div>
                      
                      <div 
                        className="score-box wiggle" 
                        style={{ cursor: 'pointer' }} 
                        onClick={() => store.openPredictModal(fixture)}
                      >
                        <span className="score-val">{fixture.userPrediction.home}</span>
                        <span className="score-dash">-</span>
                        <span className="score-val">{fixture.userPrediction.away}</span>
                        <i className="fa-solid fa-pen" style={{ fontSize: '9px', marginLeft: '4px', color: 'var(--text-muted)' }}></i>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
                        <span style={{ fontWeight: 700 }}>{fixture.awayName.slice(0, 3).toUpperCase()}</span>
                        <span className="flag-sm">{fixture.awayFlag}</span>
                      </div>
                    </div>
                  ) : (
                    // Sin predicción aún (muestra botón grande)
                    <div 
                      className="card match-predict-card" 
                      style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                          <span className="flag-sm">{fixture.homeFlag}</span>
                          <span style={{ fontWeight: 700 }}>{fixture.homeName.slice(0, 3).toUpperCase()}</span>
                        </div>
                        
                        <button 
                          className="btn btn-blue" 
                          onClick={() => store.openPredictModal(fixture)}
                          style={{ width: 'auto', padding: '6px 14px', fontSize: '11px', borderRadius: '8px' }}
                        >
                          PREDECIR
                        </button>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
                          <span style={{ fontWeight: 700 }}>{fixture.awayName.slice(0, 3).toUpperCase()}</span>
                          <span className="flag-sm">{fixture.awayFlag}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '6px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--yellow)', fontWeight: 600 }}>
                          <i className="fa-regular fa-clock"></i> Cierra pronto • {fixture.date}
                        </span>
                        <span className="badge badge-open" style={{ fontSize: '8px' }}>ABIERTO</span>
                      </div>
                    </div>
                  )
                )}
              </React.Fragment>
            );
          })
        )}
      </div>
    </div>
  );
};
