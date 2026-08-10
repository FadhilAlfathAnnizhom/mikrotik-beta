import React, { useState } from 'react';
import { useStore } from '../store/useStore';

export const DLinkConfigurationDesktop = () => {
    const { activeDLinkConfigId, closeDLinkConfig } = useStore();
    const [activeTab, setActiveTab] = useState('Status');
    const [windowMinimized, setWindowMinimized] = useState(false);

    if (!activeDLinkConfigId) return null;

    const handleSaveConfig = () => {
        alert('Configuration module is not available yet.');
    };

    const menuList = [
        'Status',
        'Setup',
        'Wireless',
        'Network',
        'Maintenance',
        'Administration',
        'System',
        'Logs',
    ];

    return (
        <div style={containerStyle}>
            {/* TITLE BAR */}
            <div style={headerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#0284c7' }}>D-Link</span>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>Wireless N300 Router DIR-612</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={btnSaveStyle} onClick={handleSaveConfig}>Save Configuration</button>
                    <button style={btnExitStyle} onClick={closeDLinkConfig}>Exit Configuration</button>
                </div>
            </div>

            {/* MAIN WORKSPACE */}
            <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                {/* SIDEBAR MENU */}
                <div style={sidebarStyle}>
                    {menuList.map((menu) => (
                        <div
                            key={menu}
                            onClick={() => {
                                setActiveTab(menu);
                                setWindowMinimized(false);
                            }}
                            style={{
                                ...sidebarItemStyle,
                                backgroundColor: activeTab === menu ? '#0284c7' : 'transparent',
                                color: activeTab === menu ? '#ffffff' : '#334155',
                            }}
                        >
                            {menu}
                        </div>
                    ))}
                </div>

                {/* WORKSPACE WINDOW */}
                <div style={{ flexGrow: 1, padding: '20px', background: '#f8fafc', position: 'relative' }}>
                    {!windowMinimized && (
                        <div style={windowStyle}>
                            {/* WINDOW HEADER */}
                            <div style={windowHeaderStyle}>
                                <span>{activeTab} Configuration</span>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button style={winControlBtn} onClick={() => setWindowMinimized(true)}>-</button>
                                    <button style={winControlBtn} onClick={closeDLinkConfig}>✕</button>
                                </div>
                            </div>

                            {/* WINDOW CONTENT PLACEHOLDER */}
                            <div style={{ padding: '30px', fontSize: '13px', color: '#475569', textAlign: 'center' }}>
                                <p style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '10px' }}>
                                    {activeTab} Settings
                                </p>
                                <p>This configuration module will be implemented in the next update.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* STATUS BAR */}
            <div style={footerStyle}>
                <span>Firmware Version: v1.01DIR612</span>
                <span>Device Status: ONLINE</span>
            </div>
        </div>
    );
};

// STYLES
const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 99999,
    background: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    userSelect: 'none',
};

const headerStyle: React.CSSProperties = {
    height: '50px',
    background: '#0f172a',
    padding: '0 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '2px solid #0284c7',
};

const sidebarStyle: React.CSSProperties = {
    width: '200px',
    background: '#f1f5f9',
    borderRight: '1px solid #cbd5e1',
    padding: '10px 0',
    display: 'flex',
    flexDirection: 'column',
};

const sidebarItemStyle: React.CSSProperties = {
    padding: '12px 20px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    transition: 'background 0.2s',
};

const windowStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '600px',
    margin: '20px auto',
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    overflow: 'hidden',
};

const windowHeaderStyle: React.CSSProperties = {
    background: '#0284c7',
    color: '#ffffff',
    padding: '10px 15px',
    fontWeight: 'bold',
    fontSize: '13px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
};

const winControlBtn: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: '#ffffff',
    fontWeight: 'bold',
    cursor: 'pointer',
    padding: '0 4px',
};

const footerStyle: React.CSSProperties = {
    height: '30px',
    background: '#1e293b',
    color: '#94a3b8',
    fontSize: '11px',
    padding: '0 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
};

const btnSaveStyle: React.CSSProperties = {
    background: '#0284c7',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '11px',
};

const btnExitStyle: React.CSSProperties = {
    background: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '11px',
};