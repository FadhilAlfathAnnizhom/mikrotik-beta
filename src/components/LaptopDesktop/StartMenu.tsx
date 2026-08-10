import React from 'react';
import { useStore } from '../../store/useStore';

interface StartMenuProps {
    laptopId: string;
    onNotify: (msg: string) => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({ laptopId, onNotify }) => {
    const { openLaptopWindow, closeLaptopDesktop } = useStore();

    const apps = [
        { id: 'control-panel', name: 'Control Panel', icon: '🎛️', active: true },
        { id: 'file-explorer', name: 'File Explorer', icon: '📁', active: false },
        { id: 'settings', name: 'Settings', icon: '⚙️', active: false },
        { id: 'network', name: 'Network', icon: '🌐', active: false },
        { id: 'browser', name: 'Browser', icon: '🌐', active: false },
        { id: 'notepad', name: 'Notepad', icon: '📝', active: false },
        { id: 'calculator', name: 'Calculator', icon: '🧮', active: false },
    ];

    const handleAppClick = (app: typeof apps[0]) => {
        if (app.active && app.id === 'control-panel') {
            openLaptopWindow(laptopId, 'control-panel');
        } else {
            onNotify("This application is not available yet. This module will be implemented in a future update.");
        }
    };

    return (
        <div style={{
            position: 'absolute',
            bottom: '56px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '360px',
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(16px)',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2), 0 8px 10px -6px rgba(0,0,0,0.1)',
            border: '1px solid rgba(203, 213, 225, 0.6)',
            padding: '16px',
            zIndex: 200,
            fontFamily: 'Segoe UI, sans-serif'
        }}>
            {/* Search Input */}
            <input
                type="text"
                placeholder="Type here to search..."
                style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '20px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    outline: 'none',
                    marginBottom: '16px',
                    backgroundColor: '#ffffff'
                }}
            />

            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>
                Pinned Apps
            </div>

            {/* Apps Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {apps.map((app) => (
                    <div
                        key={app.id}
                        onClick={() => handleAppClick(app)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: '8px 4px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            textAlign: 'center'
                        }}
                    >
                        <div style={{ fontSize: '24px', marginBottom: '4px' }}>{app.icon}</div>
                        <div style={{ fontSize: '11px', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                            {app.name}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer / Profile & Exit Button */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#0284c7', color: '#ffffff', display: 'flex', alignItems: 'center', fontStyle: 'bold', justifyContent: 'center', fontSize: '12px' }}>
                        U
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>User Laptop</span>
                </div>
                <button
                    onClick={closeLaptopDesktop}
                    title="Exit Desktop"
                    style={{
                        padding: '6px 12px',
                        backgroundColor: '#ef4444',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    ⏻ Exit Desktop
                </button>
            </div>
        </div>
    );
};