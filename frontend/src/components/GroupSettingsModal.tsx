import React, { useState, useEffect } from 'react';
import { store, useStore } from '../store';

export const GroupSettingsModal: React.FC = () => {
  const { groupSettingsModalOpen, activeGroup } = useStore();
  const [groupName, setGroupName] = useState('');

  // Sincronizar el nombre del grupo activo cuando abre
  useEffect(() => {
    if (activeGroup) {
      setGroupName(activeGroup.name);
    }
  }, [activeGroup, groupSettingsModalOpen]);

  if (!groupSettingsModalOpen || !activeGroup) {
    return null;
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      store.setGroupSettingsModal(false);
    }
  };

  const handleSave = () => {
    if (!groupName.trim()) return;
    store.updateGroupName(groupName.trim());
    alert('Nombre del grupo actualizado');
    store.showToast('Grupo actualizado');
  };

  const handleDelete = () => {
    if (confirm('¿Estás seguro de que deseas eliminar este grupo permanentemente?')) {
      store.deleteActiveGroup();
      alert('Grupo eliminado');
      store.showToast('Grupo eliminado');
    }
  };

  return (
    <div 
      className="modal active" 
      onClick={handleOverlayClick}
      style={{ display: 'flex' }}
    >
      <div className="modal-body">
        <div className="modal-top">
          <h3>Ajustes del Grupo</h3>
          <button className="close-btn" onClick={() => store.setGroupSettingsModal(false)}>
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
            Editar Nombre
          </label>
          <input 
            type="text" 
            className="input" 
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button className="btn btn-green" onClick={handleSave}>
            GUARDAR CAMBIOS
          </button>
          <button className="btn btn-pink" onClick={handleDelete}>
            ELIMINAR GRUPO
          </button>
        </div>
      </div>
    </div>
  );
};
