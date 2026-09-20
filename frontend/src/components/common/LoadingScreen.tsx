import React from 'react';
import owlMascotWaiting from '../../assets/owl-mascot-waiting.gif';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading session...',
}) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-app)',
        color: 'var(--text-muted)',
        fontSize: '1rem',
        fontWeight: 600,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <img
          src={owlMascotWaiting}
          alt="Loading..."
          style={{
            width: '160px',
            height: '160px',
            objectFit: 'cover',
            borderRadius: '20px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
          }}
        />
        {message && <span>{message}</span>}
      </div>
    </div>
  );
};
