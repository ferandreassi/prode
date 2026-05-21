import React, { useEffect, useState } from 'react';
import { X, Plus, Minus, ShieldCheck } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { TeamFlag } from '@/components/TeamFlag';

export const PredictModal: React.FC = () => {
  const queryClient = useQueryClient();
  const {
    predictMatchId,
    predictMatchTeamA,
    predictMatchTeamB,
    predictMatchFlagA,
    predictMatchFlagB,
    closePredictModal,
    showToast,
  } = useUIStore();

  const [homeGoals, setHomeGoals] = useState<number>(0);
  const [awayGoals, setAwayGoals] = useState<number>(0);

  // Fetch existing prediction for this fixture
  const { data, isLoading } = useQuery({
    queryKey: ['prediction', predictMatchId],
    queryFn: async () => {
      if (!predictMatchId) return null;
      const res = await api.get(`/predictions/fixture/${predictMatchId}`);
      return res.prediction;
    },
    enabled: !!predictMatchId,
  });

  // Sync state once fetched prediction is loaded
  useEffect(() => {
    if (data) {
      setHomeGoals(data.homeGoals ?? 0);
      setAwayGoals(data.awayGoals ?? 0);
    } else {
      setHomeGoals(0);
      setAwayGoals(0);
    }
  }, [data, predictMatchId]);

  // Mutation to save the prediction
  const mutation = useMutation({
    mutationFn: async (payload: { fixtureId: number; homeGoals: number; awayGoals: number }) => {
      return await api.post('/predictions', payload);
    },
    onSuccess: () => {
      showToast('¡Pronóstico guardado!', 'success');
      // Invalidate queries to refresh match list
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
      queryClient.invalidateQueries({ queryKey: ['fixtures'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      closePredictModal();
    },
    onError: (err: any) => {
      showToast(err.message || 'Error al guardar pronóstico', 'error');
    },
  });

  if (!predictMatchId) return null;

  const handleSave = () => {
    mutation.mutate({
      fixtureId: parseInt(predictMatchId),
      homeGoals,
      awayGoals,
    });
  };

  return (
    <div className="modal active" onClick={closePredictModal}>
      <div 
        className="modal-body" 
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: '32px' }}
      >
        <div className="modal-top">
          <h3>Ingresar Pronóstico</h3>
          <button className="close-btn" onClick={closePredictModal}>
            <X size={18} />
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '30px', fontFamily: 'var(--font-body)' }}>
            Cargando predicción...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Live Visual Board */}
            <div 
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '24px 12px',
                borderRadius: '20px',
                border: '2px solid rgba(255,255,255,0.1)',
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)'
              }}
            >
              {/* Team A */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '35%', gap: '8px' }}>
                <TeamFlag flag={predictMatchFlagA} className="flag" style={{ fontSize: '42px' }} />
                <span style={{ fontFamily: 'var(--font-fun)', fontSize: '13px', textAlign: 'center', height: '36px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {predictMatchTeamA}
                </span>
                <div className="spinner">
                  <button 
                    className="spin-btn" 
                    onClick={() => setHomeGoals(prev => Math.max(0, prev - 1))}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="spin-val" style={{ color: 'var(--yellow)' }}>{homeGoals}</span>
                  <button 
                    className="spin-btn" 
                    onClick={() => setHomeGoals(prev => prev + 1)}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* VS Decorator */}
              <div style={{ fontFamily: 'var(--font-fun)', fontSize: '20px', color: 'rgba(255,255,255,0.3)', marginTop: '-40px' }}>
                VS
              </div>

              {/* Team B */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '35%', gap: '8px' }}>
                <TeamFlag flag={predictMatchFlagB} className="flag" style={{ fontSize: '42px' }} />
                <span style={{ fontFamily: 'var(--font-fun)', fontSize: '13px', textAlign: 'center', height: '36px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {predictMatchTeamB}
                </span>
                <div className="spinner">
                  <button 
                    className="spin-btn" 
                    onClick={() => setAwayGoals(prev => Math.max(0, prev - 1))}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="spin-val" style={{ color: 'var(--yellow)' }}>{awayGoals}</span>
                  <button 
                    className="spin-btn" 
                    onClick={() => setAwayGoals(prev => prev + 1)}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>

            <button 
              className="btn btn-green" 
              onClick={handleSave} 
              disabled={mutation.isPending}
              style={{ marginTop: '8px', display: 'flex', gap: '8px' }}
            >
              <ShieldCheck size={18} />
              {mutation.isPending ? 'Guardando...' : 'Confirmar Pronóstico'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
