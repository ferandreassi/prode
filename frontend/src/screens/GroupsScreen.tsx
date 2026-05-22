import React from 'react';
import { store, useStore } from '../store';

export const GroupsScreen: React.FC = () => {
  const { groups } = useStore();

  return (
    <div className="screen active" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="scroll">
        <h2 style={{ fontFamily: 'var(--font-fun)', fontSize: '22px', marginBottom: '12px' }}>
          Mis Grupos
        </h2>
        
        {/* Group Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
            className="btn btn-green" 
            onClick={() => store.setCreateGroupModal(true)}
            style={{ flex: 1, padding: '12px 14px', fontSize: '13px' }}
          >
            <i className="fa-solid fa-plus"></i> CREAR GRUPO
          </button>
          <button 
            className="btn btn-blue" 
            onClick={() => store.setJoinGroupModal(true)}
            style={{ flex: 1, padding: '12px 14px', fontSize: '13px' }}
          >
            <i className="fa-solid fa-right-to-bracket"></i> UNIRSE
          </button>
        </div>
        
        {/* Full Groups List */}
        <div>
          {groups.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px', fontSize: '14px' }}>
              No tienes ningún grupo todavía. ¡Crea uno o únete con un código de invitación!
            </div>
          ) : (
            groups.map((group, index) => {
              const initials = group.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
              const colors = ['var(--blue)', 'var(--pink)', 'var(--yellow)', 'var(--orange)'];
              return (
                <div 
                  key={group.code}
                  className="card" 
                  onClick={() => store.openGroupDetail(group)} 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="grp-img" style={{ background: colors[index % colors.length] }}>
                      {initials}
                    </div>
                    <div>
                      <h4 style={{ fontFamily: 'var(--font-fun)', fontSize: '15px' }}>{group.name}</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {group.membersCount} miembros • Límite {group.maxMembers}
                      </p>
                    </div>
                  </div>
                  <span className="badge badge-open">#{group.rank}</span>
                </div>
              );
            })
          )}
        </div>
        
      </div>
    </div>
  );
};
