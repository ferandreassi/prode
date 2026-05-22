import React from 'react';
import { X, Sparkles, Layers, CheckCircle2, Target, XCircle, Info } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

export const RulesModal: React.FC = () => {
  const { rulesModalOpen, closeRulesModal } = useUIStore();

  if (!rulesModalOpen) return null;

  const rulesList = [
    {
      title: 'Marcador Exacto',
      points: '+7',
      pointsLabel: 'puntos',
      description: 'Le atinaste al resultado exacto del partido. ¡Eres un gurú!',
      example: 'Pronóstico: 2-1 | Resultado: 2-1',
      icon: <Sparkles size={20} />,
      borderColor: 'var(--green)',
      glowColor: 'rgba(0, 245, 212, 0.15)',
      badgeBg: 'rgba(0, 245, 212, 0.15)',
      badgeColor: 'var(--green)',
    },
    {
      title: 'Diferencia de Goles',
      points: '+4',
      pointsLabel: 'puntos',
      description: 'Acertaste el ganador (o empate) y la misma diferencia de goles.',
      example: 'Pronóstico: 3-1 (+2) | Resultado: 2-0 (+2)',
      icon: <Layers size={20} />,
      borderColor: 'var(--blue)',
      glowColor: 'rgba(58, 134, 200, 0.15)',
      badgeBg: 'rgba(58, 134, 200, 0.15)',
      badgeColor: 'var(--blue)',
    },
    {
      title: 'Resultado de Partido',
      points: '+3',
      pointsLabel: 'puntos',
      description: 'Acertaste el ganador o el empate, pero con otra diferencia/goles.',
      example: 'Pronóstico: 1-0 | Resultado: 3-1',
      icon: <CheckCircle2 size={20} />,
      borderColor: 'var(--yellow)',
      glowColor: 'rgba(255, 195, 0, 0.15)',
      badgeBg: 'rgba(255, 195, 0, 0.15)',
      badgeColor: 'var(--yellow)',
    },
    {
      title: 'Acierto Parcial',
      points: '+1',
      pointsLabel: 'punto',
      description: 'No acertaste ganador, pero le atinaste a los goles de un equipo.',
      example: 'Pronóstico: 2-1 | Resultado: 0-1 (gol visitante ok)',
      icon: <Target size={20} />,
      borderColor: 'var(--purple)',
      glowColor: 'rgba(157, 78, 221, 0.15)',
      badgeBg: 'rgba(157, 78, 221, 0.15)',
      badgeColor: 'var(--purple)',
    },
    {
      title: 'Sin Acierto (Miss)',
      points: '0',
      pointsLabel: 'puntos',
      description: 'No lograste coincidir en ningún aspecto del marcador.',
      example: 'Pronóstico: 0-2 | Resultado: 1-0',
      icon: <XCircle size={20} />,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      glowColor: 'transparent',
      badgeBg: 'rgba(255, 255, 255, 0.08)',
      badgeColor: 'var(--text-muted)',
    },
  ];

  return (
    <div className="modal active" onClick={closeRulesModal}>
      <div 
        className="modal-body" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxHeight: '85%', 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: '28px 28px 0 0',
          borderTop: '3px solid var(--yellow)',
          boxShadow: '0 -10px 40px rgba(255, 195, 0, 0.15)',
        }}
      >
        {/* Modal Top Header */}
        <div className="modal-top" style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              background: 'rgba(255, 195, 0, 0.12)',
              border: '1px solid rgba(255, 195, 0, 0.3)',
              borderRadius: '10px',
              padding: '6px',
              color: 'var(--yellow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Info size={18} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-fun)', fontSize: '18px', margin: 0, textShadow: '0 0 10px rgba(255, 195, 0, 0.3)' }}>
                Sistema de Puntuación
              </h3>
              <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ¿Cómo se calculan tus puntos?
              </span>
            </div>
          </div>
          <button className="close-btn" onClick={closeRulesModal}>
            <X size={18} />
          </button>
        </div>

        {/* Illustrated Cards Scroll Area */}
        <div 
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            paddingRight: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginBottom: '16px',
            scrollbarWidth: 'none',
          }}
        >
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '4px' }}>
            Los puntos se calculan automáticamente cuando termina un partido. Se otorga **únicamente el puntaje de la regla más alta** que hayas cumplido.
          </p>

          {rulesList.map((rule, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderLeft: `5px solid ${rule.borderColor}`,
                borderRadius: '16px',
                padding: '14px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                position: 'relative',
                boxShadow: `0 4px 20px rgba(0,0,0,0.15), inset 0 0 15px ${rule.glowColor}`,
                transition: 'transform 0.2s ease',
              }}
            >
              {/* Illustrated Left Icon Box */}
              <div
                style={{
                  background: rule.badgeBg,
                  color: rule.badgeColor,
                  borderRadius: '12px',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: `0 0 10px ${rule.glowColor}`
                }}
              >
                {rule.icon}
              </div>

              {/* Card Contents */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-fun)', fontSize: '14px', fontWeight: '800', letterSpacing: '0.3px' }}>
                    {rule.title}
                  </span>
                  
                  {/* Point Badge */}
                  <span 
                    style={{
                      background: rule.badgeBg,
                      color: rule.badgeColor,
                      padding: '2px 8px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: '950',
                      border: `1px solid rgba(255, 255, 255, 0.05)`,
                      letterSpacing: '0.5px'
                    }}
                  >
                    {rule.points} {rule.pointsLabel.toUpperCase()}
                  </span>
                </div>

                <p style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.3' }}>
                  {rule.description}
                </p>

                {/* Illustrated Example Box */}
                <div 
                  style={{ 
                    marginTop: '4px',
                    padding: '4px 8px',
                    background: 'rgba(0, 0, 0, 0.15)',
                    borderRadius: '8px',
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    color: 'var(--text-muted)',
                    borderLeft: `2px solid rgba(255, 255, 255, 0.05)`,
                    display: 'inline-block'
                  }}
                >
                  💡 {rule.example}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
