import React, { useState } from 'react';
import { store, useStore } from '../store';

export const JoinGroupModal: React.FC = () => {
  const { joinGroupModalOpen } = useStore();
  const [code, setCode] = useState('');

  if (!joinGroupModalOpen) {
    return null;
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      store.setJoinGroupModal(false);
    }
  };

  const handleSubmit = () => {
    if (code.trim().length !== 8) {
      alert('El código debe tener exactamente 8 caracteres (4 letras y 4 números)');
      return;
    }
    store.joinGroup(code.trim());
    setCode('');
    alert('¡Te has unido al grupo exitosamente!');
    store.showToast('¡Te has unido al grupo!');
  };

  return (
    <div 
      className="modal active" 
      onClick={handleOverlayClick}
      style={{ display: 'flex' }}
    >
      <div className="modal-body">
        <div className="modal-top">
          <h3>Unirse a un Grupo</h3>
          <button className="close-btn" onClick={() => store.setJoinGroupModal(false)}>
            &times;
          </button>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label 
            style={{ 
              fontSize: '11px', 
              fontWeight: 800, 
              color: 'var(--text-muted)', 
              display: 'block', 
              marginBottom: '8px', 
              textTransform: 'uppercase' 
            }}
          >
            Código de Invitación
          </label>
          <input 
            type="text" 
            className="input" 
            placeholder="ABCD1234" 
            maxLength={8} 
            style={{ 
              textTransform: 'uppercase', 
              textAlign: 'center', 
              fontSize: '20px', 
              letterSpacing: '4px' 
            }}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>
        
        <button className="btn btn-blue" onClick={handleSubmit}>
          UNIRSE AL GRUPO
        </button>
      </div>
    </div>
  );
};
