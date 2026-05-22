import React from 'react';
import { store, useStore } from '../store';

export const PredictModal: React.FC = () => {
  const { predictModal } = useStore();

  if (!predictModal.isOpen) {
    return null;
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      store.closePredictModal();
    }
  };

  return (
    <div 
      className={`modal active`} 
      onClick={handleOverlayClick}
      style={{ display: 'flex' }} // Asegurar visibilidad por flex
    >
      <div className="modal-body">
        <div className="modal-top">
          <h3>Hacer Predicción</h3>
          <button className="close-btn" onClick={() => store.closePredictModal()}>
            &times;
          </button>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: '30px' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <span className="flag">{predictModal.homeFlag}</span>
            <h4 style={{ fontFamily: 'var(--font-fun)', fontSize: '15px', marginTop: '5px' }}>
              {predictModal.homeName}
            </h4>
            
            <div className="spinner" style={{ margin: '12px auto 0', width: 'fit-content' }}>
              <button 
                className="spin-btn" 
                onClick={() => store.changePredictGoals('home', -1)}
              >
                <i className="fa-solid fa-minus"></i>
              </button>
              <span className="spin-val">{predictModal.currentHome}</span>
              <button 
                className="spin-btn" 
                onClick={() => store.changePredictGoals('home', 1)}
              >
                <i className="fa-solid fa-plus"></i>
              </button>
            </div>
          </div>
          
          <div 
            style={{ 
              fontFamily: 'var(--font-fun)', 
              fontSize: '20px', 
              fontWeight: 700, 
              color: 'var(--text-muted)', 
              paddingTop: '40px' 
            }}
          >
            VS
          </div>
          
          <div style={{ textAlign: 'center', flex: 1 }}>
            <span className="flag">{predictModal.awayFlag}</span>
            <h4 style={{ fontFamily: 'var(--font-fun)', fontSize: '15px', marginTop: '5px' }}>
              {predictModal.awayName}
            </h4>
            
            <div className="spinner" style={{ margin: '12px auto 0', width: 'fit-content' }}>
              <button 
                className="spin-btn" 
                onClick={() => store.changePredictGoals('away', -1)}
              >
                <i className="fa-solid fa-minus"></i>
              </button>
              <span className="spin-val">{predictModal.currentAway}</span>
              <button 
                className="spin-btn" 
                onClick={() => store.changePredictGoals('away', 1)}
              >
                <i className="fa-solid fa-plus"></i>
              </button>
            </div>
          </div>
        </div>
        
        <button 
          className="btn btn-green" 
          onClick={() => {
            store.submitPrediction();
            store.showToast('¡Predicción confirmada!');
          }}
        >
          CONFIRMAR RESULTADO
        </button>
      </div>
    </div>
  );
};
