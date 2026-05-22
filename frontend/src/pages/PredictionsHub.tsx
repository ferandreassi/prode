import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useUIStore } from '@/store/uiStore';
import { Calendar, Lock, Edit2, Gamepad2, MapPin, HelpCircle } from 'lucide-react';
import { TeamFlag } from '@/components/TeamFlag';

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

type FilterType = 'todos' | 'pendientes' | 'jugados' | 'pronosticados';

// Frontend points calculator mirroring backend rules
export function calculatePoints(
  pred: { homeGoals: number; awayGoals: number },
  actual: { homeGoals: number; awayGoals: number }
): { points: number; label: string; class: string } {
  const pHome = pred.homeGoals;
  const pAway = pred.awayGoals;
  const aHome = actual.homeGoals;
  const aAway = actual.awayGoals;

  if (pHome === aHome && pAway === aAway) {
    return { points: 7, label: 'Exacto (+7)', class: 'pts-7' };
  }

  const predDiff = pHome - pAway;
  const resDiff = aHome - aAway;
  const predOutcome = Math.sign(predDiff);
  const resOutcome = Math.sign(resDiff);

  if (predOutcome === resOutcome && predDiff === resDiff) {
    return { points: 4, label: 'Diferencia (+4)', class: 'pts-4' };
  }

  if (predOutcome === resOutcome) {
    return { points: 3, label: 'Resultado (+3)', class: 'pts-3' };
  }

  if (pHome === aHome || pAway === aAway) {
    return { points: 1, label: 'Parcial (+1)', class: 'pts-1' };
  }

  return { points: 0, label: 'Sin puntos', class: '' };
}

export const PredictionsHub: React.FC = () => {
  const { openPredictModal, openRulesModal } = useUIStore();
  const [filter, setFilter] = useState<FilterType>('todos');

  // 1. Fetch public matches from data-worker
  const { data: fixturesRes, isLoading: isLoadingFixtures, isError: isErrorFixtures } = useQuery({
    queryKey: ['fixtures'],
    queryFn: async () => {
      const res = await api.data.get('/fixtures');
      return res.fixtures as Fixture[];
    }
  });

  // 2. Fetch user's predictions from api-worker
  const { data: predictionsRes, isLoading: isLoadingPredictions, isError: isErrorPredictions } = useQuery({
    queryKey: ['predictions'],
    queryFn: async () => {
      const res = await api.get('/predictions/me');
      return res.predictions as Prediction[];
    }
  });

  const isLoading = isLoadingFixtures || isLoadingPredictions;
  const isError = isErrorFixtures || isErrorPredictions;

  // 3. Merging fixtures & predictions
  const mergedMatches = fixturesRes?.map(fixture => {
    const prediction = predictionsRes?.find(p => p.fixtureId === fixture.id);
    
    // Check if match starts in less than 1 hour (closure threshold)
    const matchTime = new Date(fixture.date).getTime();
    const closureThreshold = matchTime - 60 * 60 * 1000;
    const isClosed = Date.now() > closureThreshold;

    return {
      ...fixture,
      prediction,
      isClosed
    };
  }) || [];

  // Filter logic
  const filteredMatches = mergedMatches.filter(match => {
    if (filter === 'pendientes') {
      return match.status === 'NS' && !match.prediction;
    }
    if (filter === 'jugados') {
      return match.status === 'FT';
    }
    if (filter === 'pronosticados') {
      return !!match.prediction;
    }
    return true; // 'todos'
  });

  // Sort chronologically ascending
  filteredMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handlePredict = (match: any) => {
    if (match.isClosed) return;
    openPredictModal({
      id: match.id.toString(),
      teamA: match.homeTeam.name,
      teamB: match.awayTeam.name,
      flagA: match.homeTeam.flag,
      flagB: match.awayTeam.flag
    });
  };

  // Group matches by round for nice grouped visual lists
  const groupedByRound = filteredMatches.reduce((groups: Record<string, typeof filteredMatches>, match) => {
    const round = match.round;
    if (!groups[round]) groups[round] = [];
    groups[round].push(match);
    return groups;
  }, {});

  return (
    <div className="scroll">
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-fun)', fontSize: '24px' }}>Rondas y Partidos</h2>
          <p style={{ fontSize: '11px', fontWeight: '800', color: 'var(--yellow)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>
            Pronostica hasta 1h antes del partido
          </p>
        </div>
        
        {/* Rules trigger button */}
        <button
          onClick={openRulesModal}
          style={{
            background: 'rgba(255, 195, 0, 0.1)',
            border: '2px solid rgba(255, 195, 0, 0.4)',
            borderRadius: '12px',
            color: 'var(--yellow)',
            padding: '8px 12px',
            fontFamily: 'var(--font-fun)',
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease',
            boxShadow: '0 4px 12px rgba(255, 195, 0, 0.1)',
            outline: 'none',
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 195, 0, 0.2)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 195, 0, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 195, 0, 0.1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 195, 0, 0.1)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <HelpCircle size={16} />
          <span>Reglas</span>
        </button>
      </div>

      {/* Filter chips */}
      <div className="chips">
        <div 
          className={`chip ${filter === 'todos' ? 'active' : ''}`}
          onClick={() => setFilter('todos')}
        >
          Todos
        </div>
        <div 
          className={`chip ${filter === 'pendientes' ? 'active' : ''}`}
          onClick={() => setFilter('pendientes')}
        >
          Pendientes
        </div>
        <div 
          className={`chip ${filter === 'pronosticados' ? 'active' : ''}`}
          onClick={() => setFilter('pronosticados')}
        >
          Hechos
        </div>
        <div 
          className={`chip ${filter === 'jugados' ? 'active' : ''}`}
          onClick={() => setFilter('jugados')}
        >
          Jugados
        </div>
      </div>

      {isError ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--red)', border: '2px dashed var(--red)' }}>
          ⚠️ No se pudo cargar los partidos y predicciones del servidor.
        </div>
      ) : isLoading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          Cargando partidos...
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No hay partidos que coincidan con este filtro.
        </div>
      ) : (
        Object.keys(groupedByRound).map(round => (
          <div key={round}>
            <div className="round-lbl">{round}</div>
            
            {groupedByRound[round].map(match => {
              const formattedDate = new Date(match.date).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              });

              // Check points if match finished
              let pointsDisplay = null;
              if (match.status === 'FT' && match.prediction && match.goals.home !== null && match.goals.away !== null) {
                const pred = { homeGoals: match.prediction.homeGoals, awayGoals: match.prediction.awayGoals };
                const actual = { homeGoals: match.goals.home, awayGoals: match.goals.away };
                pointsDisplay = calculatePoints(pred, actual);
              }

              return (
                <div 
                  key={match.id}
                  className="card"
                  style={{
                    padding: '16px',
                    background: match.status === 'FT' ? 'rgba(255,255,255,0.04)' : 'var(--card)',
                    border: match.prediction ? '2px solid rgba(0, 214, 143, 0.25)' : '2px solid var(--border)'
                  }}
                >
                  {/* Top info header */}
                  <div 
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      fontSize: '10px',
                      fontWeight: '800',
                      color: 'var(--text-muted)',
                      marginBottom: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} /> {formattedDate} hs
                      </span>
                      {match.venue && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255, 255, 255, 0.45)', fontWeight: '500' }}>
                          <MapPin size={11} style={{ color: 'var(--yellow)' }} />
                          {match.venue.city ? `${match.venue.name} (${match.venue.city})` : match.venue.name}
                        </span>
                      )}
                    </div>
                    
                    {match.status === 'FT' ? (
                      <span className="badge badge-done">Finalizado</span>
                    ) : match.isClosed ? (
                      <span className="badge badge-locked" style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                        <Lock size={10} /> Cerrado
                      </span>
                    ) : match.prediction ? (
                      <span className="badge badge-open" style={{ borderColor: 'var(--yellow)', color: 'var(--yellow)', background: 'rgba(255, 203, 71, 0.12)', marginTop: '2px' }}>
                        ✓ Guardado
                      </span>
                    ) : (
                      <span className="badge badge-open" style={{ marginTop: '2px' }}>Abierto</span>
                    )}
                  </div>

                  {/* Core scoring row */}
                  <div 
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px'
                    }}
                  >
                    {/* Home Team */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '38%' }}>
                      <TeamFlag flag={match.homeTeam.flag} className="flag-sm" />
                      <span style={{ fontFamily: 'var(--font-fun)', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {match.homeTeam.name}
                      </span>
                    </div>

                    {/* Score display */}
                    <div style={{ display: 'flex', justifyContent: 'center', width: '24%' }}>
                      {match.status === 'FT' ? (
                        <div className="score-box" style={{ background: 'rgba(0,0,0,0.2)', padding: '4px 10px', borderRadius: '8px' }}>
                          <span className="score-val" style={{ color: 'var(--white)' }}>{match.goals.home}</span>
                          <span className="score-dash">-</span>
                          <span className="score-val" style={{ color: 'var(--white)' }}>{match.goals.away}</span>
                        </div>
                      ) : (
                        <span style={{ fontFamily: 'var(--font-fun)', fontSize: '13px', color: 'rgba(255,255,255,0.2)' }}>VS</span>
                      )}
                    </div>

                    {/* Away Team */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', width: '38%' }}>
                      <span style={{ fontFamily: 'var(--font-fun)', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {match.awayTeam.name}
                      </span>
                      <TeamFlag flag={match.awayTeam.flag} className="flag-sm" />
                    </div>
                  </div>

                  {/* Prediction row or CTA */}
                  <div 
                    style={{
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    {match.prediction ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Mi pronóstico
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                          <span style={{ fontSize: '14px', fontFamily: 'var(--font-fun)', color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <TeamFlag flag={match.homeTeam.flag} className="flag-sm" />
                            <span>{match.prediction.homeGoals} - {match.prediction.awayGoals}</span>
                            <TeamFlag flag={match.awayTeam.flag} className="flag-sm" />
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        {match.isClosed ? 'Sin pronóstico guardado.' : ''}
                      </span>
                    )}

                    {match.status === 'FT' ? (
                      pointsDisplay ? (
                        <span className={`pts-tag ${pointsDisplay.class}`}>
                          {pointsDisplay.label}
                        </span>
                      ) : (
                        <span className="pts-tag" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
                          0 pts
                        </span>
                      )
                    ) : match.isClosed ? (
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800' }}>
                        <Lock size={12} /> Pronósticos cerrados
                      </div>
                    ) : match.prediction ? (
                      <button 
                        className="btn btn-ghost" 
                        onClick={() => handlePredict(match)}
                        style={{ width: 'auto', padding: '6px 12px', borderRadius: '10px', fontSize: '11px', display: 'flex', gap: '6px' }}
                      >
                        <Edit2 size={12} />
                        Editar
                      </button>
                    ) : (
                      <button 
                        className="btn btn-green" 
                        onClick={() => handlePredict(match)}
                        style={{ width: 'auto', padding: '6px 12px', borderRadius: '10px', fontSize: '11px', display: 'flex', gap: '6px', boxShadow: 'none' }}
                      >
                        <Gamepad2 size={12} />
                        Jugar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
};
