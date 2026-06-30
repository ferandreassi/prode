import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, getAvatarUrl } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { ArrowRight, Gamepad2, Calendar, MapPin } from 'lucide-react';
import { TeamFlag } from '@/components/TeamFlag';

interface Group {
  id: string;
  name: string;
  code: string;
  image_url: string | null;
  members_count: number;
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

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { setActiveTab, openPredictModal } = useUIStore();

  // 1. Fetch public matches from data-worker
  const { data: fixturesRes, isLoading: isLoadingFixtures, isError: isErrorFixtures } = useQuery({
    queryKey: ['fixtures'],
    queryFn: async () => {
      const res = await api.data.get('/fixtures');
      return res.fixtures as Fixture[];
    }
  });

  // 2. Fetch user's joined groups from api-worker
  const { data: groupsRes, isLoading: isLoadingGroups, isError: isErrorGroups } = useQuery({
    queryKey: ['my-groups'],
    queryFn: async () => {
      const res = await api.get('/users/me/groups');
      return res.groups as Group[];
    }
  });

  // 3. Find next match (Not Started, closest date in the future)
  const nextMatch = fixturesRes
    ?.filter(f => f.status === 'NS')
    ?.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  // 4. Live Countdown state
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    finished: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, finished: false });

  useEffect(() => {
    if (!nextMatch) return;

    const calculateTime = () => {
      const diff = new Date(nextMatch.date).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, finished: true });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        finished: false
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [nextMatch]);

  const handlePredictNextMatch = () => {
    if (nextMatch) {
      openPredictModal({
        id: nextMatch.id.toString(),
        teamA: nextMatch.homeTeam.name,
        teamB: nextMatch.awayTeam.name,
        flagA: nextMatch.homeTeam.flag,
        flagB: nextMatch.awayTeam.flag
      });
    }
  };

  const totalPredictions = fixturesRes?.filter(f => f.status === 'FT' || f.status === 'AET' || f.status === 'PEN').length || 0;

  return (
    <div className="scroll">
      {/* 1. Header Greeting & Avatar */}
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}
      >
        <div>
          <h2 style={{ fontFamily: 'var(--font-fun)', fontSize: '24px', letterSpacing: '0.5px' }}>
            ¡Hola, {user?.nickname}! 👋
          </h2>
          <p style={{ fontSize: '12px', fontWeight: '800', color: 'var(--yellow)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Listo para el desafío
          </p>
        </div>
        <img 
          src={getAvatarUrl(user?.avatarUrl)} 
          alt="Avatar" 
          className="avatar" 
          width={50} 
          height={50} 
          style={{ objectFit: 'cover' }}
        />
      </div>

      {/* Error alert banner */}
      {(isErrorFixtures || isErrorGroups) && (
        <div 
          className="card" 
          style={{ 
            background: 'rgba(255, 107, 107, 0.12)', 
            border: '2px dashed var(--red)', 
            textAlign: 'center', 
            padding: '16px', 
            marginBottom: '20px',
            color: '#FFD2D2',
            fontWeight: '700',
            fontSize: '13px'
          }}
        >
          ⚠️ No se pudo cargar toda la información del servidor.
        </div>
      )}

      {/* 2. Quick stats bar */}
      <div className="stats">
        <div className="stat">
          <div className="stat-v">{groupsRes?.length ?? 0}</div>
          <div className="stat-l">Grupos</div>
        </div>
        <div className="stat">
          <div className="stat-v" style={{ color: 'var(--green)' }}>{totalPredictions}</div>
          <div className="stat-l">Jugados</div>
        </div>
        <div className="stat">
          <div className="stat-v" style={{ color: 'var(--blue)' }}>
            {fixturesRes?.filter(f => f.status === 'NS').length ?? 0}
          </div>
          <div className="stat-l">Pendientes</div>
        </div>
      </div>

      {/* 3. Next Match Widget */}
      <div className="section">
        <span>Próximo Partido</span>
        <span 
          style={{ fontSize: '12px', color: 'var(--yellow)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          onClick={() => setActiveTab('predictions')}
        >
          Ver fixture <ArrowRight size={12} />
        </span>
      </div>

      {isLoadingFixtures ? (
        <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
          Cargando partidos...
        </div>
      ) : nextMatch ? (
        <div 
          className="card" 
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 195, 0, 0.35)',
            boxShadow: '0 8px 32px rgba(255, 195, 0, 0.08), 0 0 15px rgba(255, 195, 0, 0.1)'
          }}
        >
          {/* Match Info */}
          <div 
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '11px',
              fontWeight: '800',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '14px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              paddingBottom: '8px'
            }}
          >
            <span>{nextMatch.round}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={12} /> {new Date(nextMatch.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} hs
            </span>
          </div>

          {/* Core Visual Row */}
          <div 
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
              marginBottom: '18px'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '38%' }}>
              <TeamFlag flag={nextMatch.homeTeam.flag} className="flag" style={{ fontSize: '40px' }} />
              <span style={{ fontFamily: 'var(--font-fun)', fontSize: '13px', textAlign: 'center', marginTop: '4px' }}>
                {nextMatch.homeTeam.name}
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-fun)', fontSize: '16px', color: 'rgba(255,255,255,0.2)' }}>VS</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '38%' }}>
              <TeamFlag flag={nextMatch.awayTeam.flag} className="flag" style={{ fontSize: '40px' }} />
              <span style={{ fontFamily: 'var(--font-fun)', fontSize: '13px', textAlign: 'center', marginTop: '4px' }}>
                {nextMatch.awayTeam.name}
              </span>
            </div>
          </div>

          {/* Sede/Estadio */}
          {nextMatch.venue && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.45)',
                fontWeight: '500',
                marginBottom: '14px'
              }}
            >
              <MapPin size={12} style={{ color: 'var(--yellow)' }} />
              <span>{nextMatch.venue.city ? `${nextMatch.venue.name} (${nextMatch.venue.city})` : nextMatch.venue.name}</span>
            </div>
          )}

          {/* Live Countdown Grid */}
          <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '14px', marginBottom: '16px' }}>
            {timeLeft.finished ? (
              <div style={{ textAlign: 'center', fontFamily: 'var(--font-fun)', color: 'var(--green)', fontSize: '16px' }}>
                ⚽ ¡PARTIDO EN JUEGO!
              </div>
            ) : (
              <div className="countdown">
                <div className="cd-item">
                  <div className="cd-val">{timeLeft.days}</div>
                  <div className="cd-lbl">Días</div>
                </div>
                <div className="cd-val">:</div>
                <div className="cd-item">
                  <div className="cd-val">{timeLeft.hours.toString().padStart(2, '0')}</div>
                  <div className="cd-lbl">Horas</div>
                </div>
                <div className="cd-val">:</div>
                <div className="cd-item">
                  <div className="cd-val">{timeLeft.minutes.toString().padStart(2, '0')}</div>
                  <div className="cd-lbl">Min</div>
                </div>
                <div className="cd-val">:</div>
                <div className="cd-item">
                  <div className="cd-val">{timeLeft.seconds.toString().padStart(2, '0')}</div>
                  <div className="cd-lbl">Seg</div>
                </div>
              </div>
            )}
          </div>

          {!timeLeft.finished && (
            <button className="btn btn-yellow" onClick={handlePredictNextMatch} style={{ display: 'flex', gap: '8px' }}>
              <Gamepad2 size={18} />
              <span>Pronosticar Ahora</span>
            </button>
          )}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
          No hay próximos partidos agendados.
        </div>
      )}

      {/* 4. Groups Section */}
      <div className="section">
        <span>Mis Grupos</span>
        <span 
          style={{ fontSize: '12px', color: 'var(--yellow)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          onClick={() => setActiveTab('groups')}
        >
          Explorar todos <ArrowRight size={12} />
        </span>
      </div>

      {isLoadingGroups ? (
        <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
          Cargando grupos...
        </div>
      ) : groupsRes && groupsRes.length > 0 ? (
        <div 
          style={{
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            paddingBottom: '12px',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {groupsRes.map((group) => {
            return (
              <div 
                key={group.id} 
                className="card"
                onClick={() => setActiveTab('groups')}
                style={{
                  flexShrink: 0,
                  width: '140px',
                  marginBottom: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.06)',
                  padding: '14px 10px',
                  cursor: 'pointer'
                }}
              >
                {group.image_url ? (
                  <img 
                    src={group.image_url} 
                    alt={group.name} 
                    style={{ width: '44px', height: '44px', borderRadius: '12px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }}
                  />
                ) : (
                  <div className="grp-img" style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: 'var(--yellow)', fontSize: '16px' }}>
                    {group.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                
                <div style={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span style={{ fontFamily: 'var(--font-fun)', fontSize: '12px' }}>{group.name}</span>
                </div>
                
                <span 
                  style={{
                    fontSize: '9px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    background: 'rgba(255,255,255,0.08)',
                    padding: '2px 8px',
                    borderRadius: '10px'
                  }}
                >
                  👥 {group.members_count} integrantes
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div 
          className="card" 
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '2px dashed var(--border)',
            textAlign: 'center',
            padding: '24px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div style={{ fontSize: '32px' }}>🛡️</div>
          <div>
            <div style={{ fontFamily: 'var(--font-fun)', fontSize: '14px', color: 'var(--yellow)', marginBottom: '4px' }}>
              ¡Aún no estás en ningún grupo!
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Crea un grupo o únete a uno para empezar a competir con tus amigos y ver quién acierta más.
            </div>
          </div>
          <button 
            className="btn btn-ghost" 
            onClick={() => setActiveTab('groups')}
            style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '12px', borderStyle: 'solid' }}
          >
            Ir a Grupos
          </button>
        </div>
      )}
    </div>
  );
};
