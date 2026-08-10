import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';

interface TaskbarProps {
    laptopId: string;
}

export const Taskbar: React.FC<TaskbarProps> = ({ laptopId }) => {
    const { laptopDesktopStates, toggleStartMenu, restoreLaptopWindow, edges } = useStore();
    const ds = laptopDesktopStates[laptopId];

    const [time, setTime] = useState('');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    // Cek koneksi nyata jaringan dari Edges Topology
    const isConnected = edges.some(
        (e) => e.source === laptopId || e.target === laptopId
    );

    const isControlPanelOpen = ds?.activeWindow === 'control-panel' || ds?.minimizedWindows.includes('control-panel');

    return (
        <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '48px',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(12px)',
            borderTop: '1px solid rgba(203, 213, 225, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 12px',
            zIndex: 150,
            userSelect: 'none'
        }}>
            {/* Start Button & Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                    onClick={() => toggleStartMenu(laptopId)}
                    style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: ds?.startMenuOpen ? '#e2e8f0' : 'transparent',
                        fontSize: '16px',
                        cursor: 'pointer'
                    }}
                >
                    🪟
                </button>

                {/* Open App Icon in Taskbar */}
                {isControlPanelOpen && (
                    <button
                        onClick={() => restoreLaptopWindow(laptopId, 'control-panel')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: ds?.activeWindow === 'control-panel' ? '#cbd5e1' : '#f1f5f9',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                    >
                        <span>🎛️</span>
                        <span style={{ fontWeight: '500', color: '#1e293b' }}>Control Panel</span>
                    </button>
                )}
            </div>

            {/* System Tray (Network, Battery, Clock) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#334155' }}>
                <span title={isConnected ? 'Connected to Network' : 'Disconnected'}>
                    {isConnected ? '🌐 Connected' : '❌ Disconnected'}
                </span>
                <span title="Battery Status">🔋 100%</span>
                <span style={{ fontWeight: '600' }}>{time}</span>
            </div>
        </div>
    );
};