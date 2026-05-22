import React, { useState } from 'react';
import { store, useStore } from '../store';

export const CreateGroupModal: React.FC = () => {
  const { createGroupModalOpen } = useStore();
  const [groupName, setGroupName] = useState('');

  if (!createGroupModalOpen) {
    return null;
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      store.setCreateGroupModal(false);
    }
  };

  const handleSubmit = () => {
    if (!groupName.trim()) {
      alert('Ingresa un nombre para tu grupo');
      return;
    }
    const code = store.createGroup(groupName.trim());
    setGroupName('');
    alert(`¡Grupo creado con éxito! Código de invitación: ${code}`);
    store.showToast('¡Grupo creado exitosamente!');
  };

  return (
    <div 
      className="modal active" 
      onClick={handleOverlayClick}
      style={{ display: 'flex' }}
    >
      <div className="modal-body">
        <div className="modal-top">
          <h3>Crear Nuevo Grupo</h3>
          <button className="close-btn" onClick={() => store.setCreateGroupModal(false)}>
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
            Nombre del Grupo
          </label>
          <input 
            type="text" 
            className="input" 
            placeholder="Ej: Los cracks de la oficina"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>
        
        <button className="btn btn-green" onClick={handleSubmit}>
          CREAR GRUPO
        </button>
      </div>
    </div>
  );
};
