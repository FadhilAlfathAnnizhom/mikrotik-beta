import React, { useState } from 'react';

interface WindowManagerProps {
    title: string;
    icon: string;
    onClose: () => void;
    onMinimize: () => void;
    children: React.ReactNode;
}

export const WindowManager: React.FC<WindowManagerProps> = ({ title, icon, onClose, onMinimize, children }) => {
    const [isMaximized, setIsMaximized] = useState(false);

    return (
        <div style={{
            position: 'absolute',
            top: isMaximized ? '0' : '5%',
            left: isMaximized ? '0' : '10%',
            width: isMaximized ? '100%' : '80%',
            height: isMaximized ? 'calc(100% - 48px)' : '80%',
            backgroundColor: '#ffffff',
            borderRadius: isMaximized ? '0px' : '8px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 100,
            border: '1px solid #cbd5e1'
        }}>
            {/* Title Bar */}
            <div style={{
                height: '36px',
                backgroundColor: '#f1f5f9',
                borderBottom: '1px solid #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 12px',
                userSelect: 'none'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                    <span>{icon}</span>
                    <span>{title}</span>
                </div>
                <div style={{ display: 'flex', height: '100%' }}>
                    <button
                        onClick={onMinimize}
                        style={{ width: '40px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px', color: '#475569' }}
                    >
                        🗕
                    </button>
                    <button
                        onClick={() => setIsMaximized(!isMaximized)}
                        style={{ width: '40px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '12px', color: '#475569' }}
                    >
                        {isMaximized ? '🗗' : '🗖'}
                    </button>
                    <button
                        onClick={onClose}
                        style={{ width: '40px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px', color: '#ef4444' }}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Window Content */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
                {children}
            </div>
        </div>
    );
};