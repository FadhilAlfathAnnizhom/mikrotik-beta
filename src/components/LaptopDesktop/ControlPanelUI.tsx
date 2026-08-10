import React, { useState } from 'react';

interface ControlPanelUIProps {
    laptopId: string;
}

export const ControlPanelUI: React.FC<ControlPanelUIProps> = () => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const categories = [
        {
            id: 'system',
            title: 'System and Security',
            desc: 'Review your computer status and back up your data',
            icon: '⚙️'
        },
        {
            id: 'network',
            title: 'Network and Internet',
            desc: 'Connect to the Internet, view network status and changes',
            icon: '🌐'
        },
        {
            id: 'hardware',
            title: 'Hardware and Sound',
            desc: 'View devices and printers, adjust sound',
            icon: '🔊'
        },
        {
            id: 'programs',
            title: 'Programs',
            desc: 'Uninstall a program or change default settings',
            icon: '📦'
        },
        {
            id: 'accounts',
            title: 'User Accounts',
            desc: 'Change user account settings and passwords',
            icon: '👤'
        },
        {
            id: 'appearance',
            title: 'Appearance and Personalization',
            desc: 'Change fonts, desktop background, and display settings',
            icon: '🖥️'
        },
        {
            id: 'clock',
            title: 'Clock and Region',
            desc: 'Change date, time, and number formats',
            icon: '🕒'
        },
        {
            id: 'accessibility',
            title: 'Ease of Access',
            desc: 'Optimize visual display and accessibility settings',
            icon: '♿'
        }
    ];

    return (
        <div style={{ display: 'flex', height: '100%', backgroundColor: '#f0f3f8', color: '#1e293b', fontFamily: 'Segoe UI, sans-serif' }}>
            {/* Sidebar */}
            <div style={{ width: '180px', backgroundColor: '#e2e8f0', borderRight: '1px solid #cbd5e1', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                    onClick={() => setSelectedCategory(null)}
                    style={{
                        textAlign: 'left',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: selectedCategory === null ? '#cbd5e1' : 'transparent',
                        fontWeight: selectedCategory === null ? 'bold' : 'normal',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: '#334155'
                    }}
                >
                    🏠 Control Panel Home
                </button>
            </div>

            {/* Workspace Area */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                {selectedCategory ? (
                    <div>
                        <button
                            onClick={() => setSelectedCategory(null)}
                            style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', cursor: 'pointer', fontSize: '12px', marginBottom: '16px' }}
                        >
                            ← Back to Control Panel
                        </button>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                            {categories.find(c => c.id === selectedCategory)?.title}
                        </h2>
                        <div style={{ padding: '20px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#64748b', fontSize: '13px' }}>
                            ℹ️ Configuration module will be implemented in the next update.
                        </div>
                    </div>
                ) : (
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#0f172a' }}>
                            Adjust your computer's settings
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                            {categories.map((cat) => (
                                <div
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    style={{
                                        display: 'flex',
                                        gap: '12px',
                                        padding: '12px',
                                        backgroundColor: '#ffffff',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        cursor: 'pointer',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                                        transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#0284c7')}
                                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
                                >
                                    <div style={{ fontSize: '24px' }}>{cat.icon}</div>
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '13px', color: '#0369a1', marginBottom: '2px' }}>
                                            {cat.title}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.3' }}>
                                            {cat.desc}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};