import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, getAvatarUrl } from '@/services/api';
import { useUIStore } from '@/store/uiStore';
import { 
  Users, 
  Layers, 
  FileText, 
  TrendingUp, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft, 
  Activity, 
  Calendar, 
  Award,
  Clock
} from 'lucide-react';
import { TeamFlag } from '@/components/TeamFlag';

type AdminSubTab = 'overview' | 'users' | 'groups' | 'fixtures';

export const AdminDashboard: React.FC = () => {
  const { setActiveTab } = useUIStore();
  const [subTab, setSubTab] = useState<AdminSubTab>('overview');

  // Users Tab local state
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userSortBy, setUserSortBy] = useState('createdAt');

  // Groups Tab local state
  const [groupSearch, setGroupSearch] = useState('');
  const [groupPage, setGroupPage] = useState(1);

  // ====================================
  // API QUERIES (React Query)
  // ====================================

  // 1. Overview analytics
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: async () => {
      return await api.get('/admin/analytics/overview');
    },
    enabled: subTab === 'overview'
  });

  // 2. Growth time series (14 days)
  const { data: growthRes, isLoading: loadingGrowth } = useQuery({
    queryKey: ['admin-growth'],
    queryFn: async () => {
      return await api.get('/admin/analytics/growth');
    },
    enabled: subTab === 'overview'
  });

  // 3. Paginated/Searchable users list
  const { data: usersRes, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users', userSearch, userPage, userSortBy],
    queryFn: async () => {
      return await api.get('/admin/analytics/users', {
        params: {
          search: userSearch,
          page: userPage.toString(),
          sortBy: userSortBy,
          limit: '15'
        }
      });
    },
    enabled: subTab === 'users'
  });

  // 4. Paginated/Searchable groups list
  const { data: groupsRes, isLoading: loadingGroups } = useQuery({
    queryKey: ['admin-groups', groupSearch, groupPage],
    queryFn: async () => {
      return await api.get('/admin/analytics/groups', {
        params: {
          search: groupSearch,
          page: groupPage.toString(),
          limit: '15'
        }
      });
    },
    enabled: subTab === 'groups'
  });

  // 5. Fixtures prediction insights
  const { data: fixturesRes, isLoading: loadingFixtures } = useQuery({
    queryKey: ['admin-fixtures-insights'],
    queryFn: async () => {
      return await api.get('/admin/analytics/fixtures');
    },
    enabled: subTab === 'fixtures'
  });

  // ====================================
  // SVG GRAPH DYNAMIC PATH GENERATOR
  // ====================================
  const renderSVGChart = (data: Array<{ date: string; users: number; predictions: number }> | undefined, type: 'users' | 'predictions') => {
    if (!data || data.length === 0) return null;

    const values = data.map(d => type === 'users' ? d.users : d.predictions);
    const maxVal = Math.max(...values, 5); // Avoid division by zero, at least height of 5
    
    const width = 360;
    const height = 110;
    const padding = 15;
    
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Convert data to SVG coordinate points
    const points = data.map((d, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const val = type === 'users' ? d.users : d.predictions;
      const y = padding + chartHeight - (val / maxVal) * chartHeight;
      return { x, y, value: val, date: d.date };
    });

    // Generate SVG path string
    let pathD = '';
    points.forEach((p, idx) => {
      if (idx === 0) {
        pathD = `M ${p.x} ${p.y}`;
      } else {
        // Curve to make it look smooth and futuristic
        const prev = points[idx - 1];
        const cpX1 = prev.x + (p.x - prev.x) / 2;
        const cpY1 = prev.y;
        const cpX2 = prev.x + (p.x - prev.x) / 2;
        const cpY2 = p.y;
        pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p.x} ${p.y}`;
      }
    });

    // Generate area path string (filled down to bottom)
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    const strokeColor = type === 'users' ? 'var(--cyan)' : 'var(--purple)';
    const glowColor = type === 'users' ? 'rgba(0, 240, 255, 0.4)' : 'rgba(157, 78, 221, 0.4)';
    const fillGradId = `chart-grad-${type}`;

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={fillGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255, 255, 255, 0.05)" />
        <line x1={padding} y1={padding + chartHeight / 2} x2={width - padding} y2={padding + chartHeight / 2} stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3,3" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255, 255, 255, 0.08)" />

        {/* Filled Area */}
        <path d={areaD} fill={`url(#${fillGradId})`} />

        {/* Main Line */}
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="3" filter={`drop-shadow(0 0 4px ${glowColor})`} />

        {/* Interaction Circles */}
        {points.map((p, idx) => {
          // Render dots only for dates with values or a few to avoid crowding
          if (p.value === 0 && idx % 2 !== 0) return null;
          return (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r="3" fill="#fff" stroke={strokeColor} strokeWidth="1.5" />
              {/* Display value tooltip above peak values */}
              {p.value > 0 && (idx === 0 || idx === points.length - 1 || p.value === maxVal) && (
                <text 
                  x={p.x} 
                  y={p.y - 6} 
                  fill="var(--text-muted)" 
                  fontSize="7px" 
                  fontWeight="800" 
                  textAnchor="middle"
                  style={{ fontFamily: 'var(--font-fun)' }}
                >
                  {p.value}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="screen active">
      {/* Mini top-bar to go back */}
      <div 
        style={{ 
          padding: '10px 18px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          background: 'rgba(255, 255, 255, 0.03)',
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}
      >
        <button 
          onClick={() => setActiveTab('profile')} 
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--cyan)', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            fontSize: '11px',
            fontWeight: '800',
            fontFamily: 'var(--font-fun)',
            letterSpacing: '1px',
            textTransform: 'uppercase'
          }}
        >
          <ArrowLeft size={14} style={{ marginRight: '4px' }} /> Volver al Perfil
        </button>
      </div>

      {/* Sub-tab navigation */}
      <div className="tabs" style={{ margin: '0 10px 14px' }}>
        <div 
          className={`tab ${subTab === 'overview' ? 'active' : ''}`}
          onClick={() => setSubTab('overview')}
        >
          Resumen
        </div>
        <div 
          className={`tab ${subTab === 'users' ? 'active' : ''}`}
          onClick={() => setSubTab('users')}
        >
          Usuarios
        </div>
        <div 
          className={`tab ${subTab === 'groups' ? 'active' : ''}`}
          onClick={() => setSubTab('groups')}
        >
          Ligas
        </div>
        <div 
          className={`tab ${subTab === 'fixtures' ? 'active' : ''}`}
          onClick={() => setSubTab('fixtures')}
        >
          Partidos
        </div>
      </div>

      {/* Scrollable Dashboard Area */}
      <div className="scroll" style={{ paddingTop: 0 }}>
        
        {/* ====================================
            1. TAB: OVERVIEW
            ==================================== */}
        {subTab === 'overview' && (
          <div>
            {loadingOverview ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                Cargando analíticas globales...
              </div>
            ) : (
              <>
                {/* HUD Analytics Metrics Grid */}
                <div 
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', 
                    gap: '12px',
                    marginBottom: '16px' 
                  }}
                >
                  <div className="card" style={{ margin: 0, padding: '14px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        Usuarios
                      </span>
                      <Users size={14} style={{ color: 'var(--cyan)' }} />
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-fun)', fontSize: '26px', color: 'var(--cyan)', textShadow: '0 0 10px rgba(0, 240, 255, 0.3)', marginTop: '4px' }}>
                      {overview?.totalUsers}
                    </h3>
                    <span style={{ fontSize: '8px', color: 'var(--green)', fontWeight: '800', textTransform: 'uppercase' }}>
                      🟢 {overview?.activeUsers} Activos
                    </span>
                  </div>

                  <div className="card" style={{ margin: 0, padding: '14px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        Ligas
                      </span>
                      <Layers size={14} style={{ color: 'var(--purple)' }} />
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-fun)', fontSize: '26px', color: 'var(--purple)', textShadow: '0 0 10px rgba(157, 78, 221, 0.3)', marginTop: '4px' }}>
                      {overview?.totalGroups}
                    </h3>
                    <span style={{ fontSize: '8px', color: 'var(--yellow)', fontWeight: '800', textTransform: 'uppercase' }}>
                      ⭐ {overview?.avgMembersPerGroup} miembro prom.
                    </span>
                  </div>

                  <div className="card" style={{ margin: 0, padding: '14px 12px', gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        Predicciones Totales
                      </span>
                      <FileText size={14} style={{ color: 'var(--yellow)' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                      <h3 style={{ fontFamily: 'var(--font-fun)', fontSize: '26px', color: 'var(--yellow)', textShadow: '0 0 10px rgba(255, 195, 0, 0.3)' }}>
                        {overview?.totalPredictions}
                      </h3>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>
                        Compleción: {overview?.predictionEngagementRate}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* SVG Growth Charts */}
                <div className="card" style={{ padding: '14px' }}>
                  <h3 style={{ fontFamily: 'var(--font-fun)', fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '14px' }}>
                    <TrendingUp size={14} style={{ color: 'var(--cyan)' }} /> Registros Diarios (14d)
                  </h3>
                  {loadingGrowth ? (
                    <div style={{ height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '10px' }}>
                      Construyendo gráfico...
                    </div>
                  ) : (
                    renderSVGChart(growthRes?.growth, 'users')
                  )}
                </div>

                <div className="card" style={{ padding: '14px' }}>
                  <h3 style={{ fontFamily: 'var(--font-fun)', fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '14px' }}>
                    <Activity size={14} style={{ color: 'var(--purple)' }} /> Pronósticos Enviados (14d)
                  </h3>
                  {loadingGrowth ? (
                    <div style={{ height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '10px' }}>
                      Construyendo gráfico...
                    </div>
                  ) : (
                    renderSVGChart(growthRes?.growth, 'predictions')
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ====================================
            2. TAB: USERS LIST
            ==================================== */}
        {subTab === 'users' && (
          <div>
            {/* Filter / Search Bar */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Buscar nickname..."
                  className="input"
                  style={{ paddingLeft: '36px', height: '42px', fontSize: '14px' }}
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserPage(1);
                  }}
                />
              </div>
              
              <select
                className="input"
                style={{ 
                  width: '120px', 
                  height: '42px', 
                  fontSize: '11px', 
                  fontWeight: '800', 
                  textTransform: 'uppercase', 
                  padding: '0 8px',
                  background: 'rgba(18, 10, 44, 0.75)'
                }}
                value={userSortBy}
                onChange={(e) => {
                  setUserSortBy(e.target.value);
                  setUserPage(1);
                }}
              >
                <option value="createdAt">Registro</option>
                <option value="predictionsCount">Pronósticos</option>
                <option value="totalPoints">Puntos</option>
                <option value="groupsCount">Ligas</option>
              </select>
            </div>

            {loadingUsers ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                Cargando directorio de usuarios...
              </div>
            ) : (
              <>
                {/* Users List HUD */}
                {usersRes?.users.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '12px' }}>
                    Ningún usuario coincide con la búsqueda.
                  </div>
                ) : (
                  usersRes?.users.map((item: any) => (
                    <div 
                      key={item.id}
                      className="card"
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '12px 14px', 
                        marginBottom: '8px', 
                        background: 'rgba(18, 10, 44, 0.35)' 
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img 
                          src={getAvatarUrl(item.avatarUrl)} 
                          alt={item.nickname}
                          className="avatar"
                          width={32}
                          height={32}
                          style={{ objectFit: 'cover', borderRadius: '50%' }}
                        />
                        <div>
                          <h4 style={{ fontSize: '14px', fontWeight: '700' }}>{item.nickname}</h4>
                          <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                            <Calendar size={10} /> {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>
                            🔮 {item.predictionsCount} pred.
                          </div>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '700', marginTop: '1px' }}>
                            🏆 {item.groupsCount} ligas
                          </div>
                        </div>
                        <div 
                          style={{ 
                            fontFamily: 'var(--font-fun)', 
                            fontSize: '14px', 
                            fontWeight: '800', 
                            color: 'var(--yellow)',
                            background: 'rgba(255, 195, 0, 0.1)',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            border: '1px stroke rgba(255, 195, 0, 0.2)'
                          }}
                        >
                          {item.totalPoints} pts
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Pagination */}
                {usersRes?.pagination && usersRes.pagination.totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '0 4px' }}>
                    <button 
                      className="btn" 
                      style={{ width: 'auto', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}
                      disabled={userPage <= 1}
                      onClick={() => setUserPage(prev => Math.max(1, prev - 1))}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Pág {userPage} de {usersRes.pagination.totalPages}
                    </span>
                    <button 
                      className="btn" 
                      style={{ width: 'auto', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}
                      disabled={userPage >= usersRes.pagination.totalPages}
                      onClick={() => setUserPage(prev => Math.min(usersRes.pagination.totalPages, prev + 1))}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ====================================
            3. TAB: LEAGUES LIST
            ==================================== */}
        {subTab === 'groups' && (
          <div>
            {/* Search Bar */}
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                className="input"
                style={{ paddingLeft: '36px', height: '42px', fontSize: '14px' }}
                value={groupSearch}
                onChange={(e) => {
                  setGroupSearch(e.target.value);
                  setGroupPage(1);
                }}
              />
            </div>

            {loadingGroups ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                Cargando directorio de ligas...
              </div>
            ) : (
              <>
                {/* Groups List */}
                {groupsRes?.groups.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '12px' }}>
                    Ninguna liga de amigos coincide con los filtros.
                  </div>
                ) : (
                  groupsRes?.groups.map((group: any) => (
                    <div 
                      key={group.id}
                      className="card"
                      style={{ 
                        padding: '12px 14px', 
                        marginBottom: '8px', 
                        background: 'rgba(18, 10, 44, 0.35)' 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {group.imageUrl ? (
                            <img 
                              src={getAvatarUrl(group.imageUrl)} 
                              alt={group.name} 
                              className="avatar" 
                              width={36} 
                              height={36} 
                              style={{ objectFit: 'cover', borderRadius: '12px' }}
                            />
                          ) : (
                            <div 
                              style={{ 
                                width: '36px', 
                                height: '36px', 
                                borderRadius: '12px', 
                                background: 'linear-gradient(135deg, var(--cyan) 0%, var(--purple) 100%)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontWeight: '800',
                                fontSize: '14px'
                              }}
                            >
                              {group.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h4 style={{ fontSize: '14px', fontWeight: '800' }}>{group.name}</h4>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                              <span style={{ fontSize: '8px', color: 'var(--yellow)', fontWeight: '800', textTransform: 'uppercase' }}>
                                Code: {group.code}
                              </span>
                              <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: '700' }}>
                                Admin: @{group.adminNickname}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'var(--font-fun)', fontSize: '14px', fontWeight: '800', color: 'var(--cyan)' }}>
                            {group.membersCount} miemb.
                          </div>
                          <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                            🔮 {group.predictionsCount} pred.
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Pagination */}
                {groupsRes?.pagination && groupsRes.pagination.totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '0 4px' }}>
                    <button 
                      className="btn" 
                      style={{ width: 'auto', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}
                      disabled={groupPage <= 1}
                      onClick={() => setGroupPage(prev => Math.max(1, prev - 1))}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Pág {groupPage} de {groupsRes.pagination.totalPages}
                    </span>
                    <button 
                      className="btn" 
                      style={{ width: 'auto', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}
                      disabled={groupPage >= groupsRes.pagination.totalPages}
                      onClick={() => setGroupPage(prev => Math.min(groupsRes.pagination.totalPages, prev + 1))}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ====================================
            4. TAB: FIXTURES INSIGHTS
            ==================================== */}
        {subTab === 'fixtures' && (
          <div>
            {loadingFixtures ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                Cargando mapa de calor de predicciones...
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '12px', padding: '0 4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--yellow)', fontWeight: '800', textTransform: 'uppercase' }}>
                    Partidos más populares
                  </span>
                  <p style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '1px' }}>
                    Ordenados por volumen total de pronósticos cargados
                  </p>
                </div>

                {fixturesRes?.fixtures.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '12px' }}>
                    No hay partidos sincronizados en KV.
                  </div>
                ) : (
                  fixturesRes?.fixtures.map((fixture: any) => (
                    <div 
                      key={fixture.id} 
                      className="card"
                      style={{ 
                        padding: '14px', 
                        marginBottom: '10px', 
                        background: 'rgba(18, 10, 44, 0.45)' 
                      }}
                    >
                      {/* Match Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '8px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--purple)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <Award size={10} /> {fixture.round}
                        </span>
                        
                        <span style={{ fontSize: '8px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--cyan)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <Clock size={10} /> {fixture.analytics.totalPredictions} pronósticos
                        </span>
                      </div>

                      {/* Teams & Score representation */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                          <TeamFlag flag={fixture.teams.home.flag} style={{ fontSize: '18px' }} />
                          <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>{fixture.teams.home.name}</span>
                        </div>

                        {fixture.status === 'FT' ? (
                          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '800', fontFamily: 'var(--font-fun)' }}>
                            {fixture.score.home} - {fixture.score.away}
                          </div>
                        ) : (
                          <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>VS</span>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
                          <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>{fixture.teams.away.name}</span>
                          <TeamFlag flag={fixture.teams.away.flag} style={{ fontSize: '18px' }} />
                        </div>
                      </div>

                      {/* Consensus Heatmap bar */}
                      {fixture.analytics.totalPredictions > 0 ? (
                        <div style={{ marginTop: '12px' }}>
                          {/* Segmented Bar Chart */}
                          <div 
                            style={{ 
                              height: '10px', 
                              borderRadius: '5px', 
                              overflow: 'hidden', 
                              display: 'flex', 
                              background: 'rgba(255,255,255,0.04)' 
                            }}
                          >
                            <div 
                              style={{ 
                                width: `${fixture.analytics.distribution.homeWinsPct}%`, 
                                background: 'linear-gradient(90deg, #00f0ff 0%, #00bbf9 100%)',
                                boxShadow: '0 0 6px rgba(0, 240, 255, 0.4)'
                              }} 
                            />
                            <div 
                              style={{ 
                                width: `${fixture.analytics.distribution.drawsPct}%`, 
                                background: 'rgba(255, 255, 255, 0.25)' 
                              }} 
                            />
                            <div 
                              style={{ 
                                width: `${fixture.analytics.distribution.awayWinsPct}%`, 
                                background: 'linear-gradient(90deg, #9d4edd 0%, #ff007f 100%)',
                                boxShadow: '0 0 6px rgba(157, 78, 221, 0.4)'
                              }} 
                            />
                          </div>

                          {/* Legend values */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '6px', padding: '0 2px' }}>
                            <span style={{ color: 'var(--cyan)' }}>L: {fixture.analytics.distribution.homeWinsPct}%</span>
                            <span>E: {fixture.analytics.distribution.drawsPct}%</span>
                            <span style={{ color: 'var(--purple)' }}>V: {fixture.analytics.distribution.awayWinsPct}%</span>
                          </div>

                          {/* Average predicted goals */}
                          <div style={{ textAlign: 'center', fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '6px' }}>
                            Goles prom. predichos: <strong style={{ color: '#fff' }}>{fixture.analytics.avgHomeGoals}</strong> vs <strong style={{ color: '#fff' }}>{fixture.analytics.avgAwayGoals}</strong>
                          </div>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '12px' }}>
                          Sin predicciones cargadas aún.
                        </div>
                      )}
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
