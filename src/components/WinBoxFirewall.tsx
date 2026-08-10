import React, { useState } from 'react';
import { useStore } from '../store/useStore';

export const WinBoxFirewall: React.FC = () => {
    const { firewallRules, addFirewallNatRule } = useStore() as any;

    const [activeTab, setActiveTab] = useState<'filter' | 'nat' | 'mangle'>('nat');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [modalTab, setModalTab] = useState<'general' | 'action'>('general');

    // Form State untuk NAT Rule Baru
    const [chain, setChain] = useState<'srcnat' | 'dstnat'>('srcnat');
    const [outInterface, setOutInterface] = useState<string>('ether1');
    const [action, setAction] = useState<string>('masquerade');

    const handleSaveNatRule = () => {
        const newRule = {
            id: `nat-${Date.now()}`,
            chain,
            outInterface,
            action,
            disabled: false,
            comment: 'masquerade'
        };

        if (addFirewallNatRule) {
            addFirewallNatRule(newRule);
        } else {
            useStore.setState((state: any) => ({
                firewallRules: {
                    ...state.firewallRules,
                    nat: [...(state.firewallRules?.nat || []), newRule]
                },
                isNatConfigured: true
            }));
        }

        setIsAddModalOpen(false);
    };

    const natRules = firewallRules?.nat || [];

    return (
        <div style={winboxWindowStyle}>
            {/* Top Navigation Tabs */}
            <div style={tabHeaderStyle}>
                <button
                    style={activeTab === 'filter' ? activeTabStyle : tabStyle}
                    onClick={() => setActiveTab('filter')}
                >
                    Filter Rules
                </button>
                <button
                    style={activeTab === 'nat' ? activeTabStyle : tabStyle}
                    onClick={() => setActiveTab('nat')}
                >
                    NAT
                </button>
                <button
                    style={activeTab === 'mangle' ? activeTabStyle : tabStyle}
                    onClick={() => setActiveTab('mangle')}
                >
                    Mangle
                </button>
                <button style={tabStyle}>Raw</button>
                <button style={tabStyle}>Service Ports</button>
            </div>

            {/* Content Area */}
            {activeTab === 'nat' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {/* Toolbar Action Buttons (Ikon WinBox Klasik) */}
                    <div style={toolbarStyle}>
                        <button style={toolBtnStyle} onClick={() => setIsAddModalOpen(true)} title="Add">+</button>
                        <button style={toolBtnStyle} title="Remove">-</button>
                        <button style={toolBtnStyle} title="Enable">✓</button>
                        <button style={toolBtnStyle} title="Disable">✕</button>
                        <button style={toolBtnStyle}>Reset Counters</button>
                    </div>

                    {/* NAT Table */}
                    <div style={tableContainerStyle}>
                        <table style={tableStyle}>
                            <thead>
                                <tr style={tableHeaderRowStyle}>
                                    <th style={thStyle}>#</th>
                                    <th style={thStyle}>Action</th>
                                    <th style={thStyle}>Chain</th>
                                    <th style={thStyle}>Out. Interface</th>
                                    <th style={thStyle}>Src. Address</th>
                                </tr>
                            </thead>
                            <tbody>
                                {natRules.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '12px', color: '#666' }}>
                                            Belum ada aturan NAT. Klik tombol <b>+</b> untuk membuat aturan Masquerade.
                                        </td>
                                    </tr>
                                ) : (
                                    natRules.map((rule: any, idx: number) => (
                                        <tr key={rule.id} style={tableBodyRowStyle}>
                                            <td style={tdStyle}>{idx}</td>
                                            <td style={{ ...tdStyle, color: '#002266', fontWeight: 'bold' }}>{rule.action}</td>
                                            <td style={tdStyle}>{rule.chain}</td>
                                            <td style={tdStyle}>{rule.outInterface || 'all'}</td>
                                            <td style={tdStyle}>{rule.srcAddress || ''}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Dialog NAT Rule <> */}
            {isAddModalOpen && (
                <div style={modalOverlayStyle}>
                    <div style={dialogStyle}>
                        <div style={winboxTitleBarStyle}>
                            <span>NAT Rule &lt;&gt;</span>
                            <button onClick={() => setIsAddModalOpen(false)} style={winboxCloseBtnStyle}>✕</button>
                        </div>

                        {/* Sub-tabs Dialog */}
                        <div style={{ display: 'flex', borderBottom: '1px solid #808080', backgroundColor: '#d4d0c8', paddingLeft: '4px' }}>
                            <button
                                style={modalTab === 'general' ? activeModalTabStyle : modalTabStyle}
                                onClick={() => setModalTab('general')}
                            >
                                General
                            </button>
                            <button style={modalTabStyle}>Advanced</button>
                            <button style={modalTabStyle}>Extra</button>
                            <button
                                style={modalTab === 'action' ? activeModalTabStyle : modalTabStyle}
                                onClick={() => setModalTab('action')}
                            >
                                Action
                            </button>
                        </div>

                        <div style={{ display: 'flex', padding: '10px', gap: '12px', background: '#f0f0f0' }}>
                            {/* Tab Content */}
                            <div style={{ flex: 1 }}>
                                {modalTab === 'general' && (
                                    <div style={formGridStyle}>
                                        <label style={labelStyle}>Chain:</label>
                                        <select
                                            value={chain}
                                            onChange={(e: any) => setChain(e.target.value)}
                                            style={selectStyle}
                                        >
                                            <option value="srcnat">srcnat</option>
                                            <option value="dstnat">dstnat</option>
                                        </select>

                                        <label style={labelStyle}>Src. Address:</label>
                                        <input type="text" placeholder="" style={inputStyle} disabled />

                                        <label style={labelStyle}>Out. Interface:</label>
                                        <select
                                            value={outInterface}
                                            onChange={(e: any) => setOutInterface(e.target.value)}
                                            style={selectStyle}
                                        >
                                            <option value="ether1">ether1</option>
                                            <option value="ether2">ether2</option>
                                            <option value="wlan1">wlan1</option>
                                        </select>
                                    </div>
                                )}

                                {modalTab === 'action' && (
                                    <div style={formGridStyle}>
                                        <label style={labelStyle}>Action:</label>
                                        <select
                                            value={action}
                                            onChange={(e: any) => setAction(e.target.value)}
                                            style={{ ...selectStyle, backgroundColor: '#002266', color: '#ffffff', fontWeight: 'bold' }}
                                        >
                                            <option value="masquerade">masquerade</option>
                                            <option value="accept">accept</option>
                                            <option value="drop">drop</option>
                                            <option value="redirect">redirect</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Sidebar Command Buttons */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '70px' }}>
                                <button style={winboxCmdBtnStyle} onClick={handleSaveNatRule}>OK</button>
                                <button style={winboxCmdBtnStyle} onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                                <button style={winboxCmdBtnStyle} onClick={handleSaveNatRule}>Apply</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Styles Winbox Theme (Auto-Fit 100% untuk Maximize)
const winboxWindowStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    fontFamily: 'Tahoma, Segoe UI, sans-serif',
    fontSize: '11px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden'
};

const winboxTitleBarStyle: React.CSSProperties = {
    backgroundColor: '#0a246a',
    color: '#ffffff',
    padding: '3px 6px',
    fontWeight: 'bold',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
};

const winboxCloseBtnStyle: React.CSSProperties = {
    background: '#d4d0c8',
    border: '1px solid #ffffff',
    borderBottomColor: '#808080',
    borderRightColor: '#808080',
    fontSize: '9px',
    width: '16px',
    height: '14px',
    cursor: 'pointer',
    fontWeight: 'bold'
};

const tabHeaderStyle: React.CSSProperties = {
    display: 'flex',
    backgroundColor: '#f0f0f0',
    borderBottom: '1px solid #808080',
    paddingTop: '3px',
    paddingLeft: '4px'
};

const tabStyle: React.CSSProperties = {
    padding: '3px 8px',
    fontSize: '11px',
    border: '1px solid #808080',
    borderBottom: 'none',
    backgroundColor: '#e0e0e0',
    cursor: 'pointer',
    marginRight: '2px'
};

const activeTabStyle: React.CSSProperties = {
    ...tabStyle,
    backgroundColor: '#ffffff',
    fontWeight: 'bold',
    borderBottom: '1px solid #ffffff'
};

const toolbarStyle: React.CSSProperties = {
    padding: '3px 4px',
    backgroundColor: '#f0f0f0',
    borderBottom: '1px solid #808080',
    display: 'flex',
    gap: '3px'
};

const toolBtnStyle: React.CSSProperties = {
    padding: '2px 8px',
    fontSize: '11px',
    backgroundColor: '#f0f0f0',
    border: '1px solid #ffffff',
    borderBottomColor: '#808080',
    borderRightColor: '#808080',
    cursor: 'pointer',
    fontWeight: 'bold'
};

const tableContainerStyle: React.CSSProperties = {
    flex: 1,
    backgroundColor: '#ffffff',
    overflowY: 'auto',
    border: '1px solid #7f9db9'
};

const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '11px'
};

const tableHeaderRowStyle: React.CSSProperties = {
    backgroundColor: '#e0e0e0',
    borderBottom: '1px solid #a0a0a0'
};

const thStyle: React.CSSProperties = {
    padding: '3px 6px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 'normal',
    borderRight: '1px solid #a0a0a0'
};

const tableBodyRowStyle: React.CSSProperties = {
    borderBottom: '1px solid #f0f0f0'
};

const tdStyle: React.CSSProperties = {
    padding: '3px 6px',
    fontSize: '11px',
    borderRight: '1px dotted #ccc'
};

const modalOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
};

const dialogStyle: React.CSSProperties = {
    width: '380px',
    backgroundColor: '#f0f0f0',
    border: '2px solid #ffffff',
    borderBottomColor: '#666666',
    borderRightColor: '#666666',
    boxShadow: '2px 2px 5px rgba(0,0,0,0.5)'
};

const modalTabStyle: React.CSSProperties = {
    padding: '4px 8px',
    fontSize: '11px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer'
};

const activeModalTabStyle: React.CSSProperties = {
    ...modalTabStyle,
    backgroundColor: '#ffffff',
    fontWeight: 'bold'
};

const formGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '90px 1fr',
    gap: '6px',
    alignItems: 'center'
};

const labelStyle: React.CSSProperties = {
    fontSize: '11px'
};

const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '2px',
    fontSize: '11px',
    border: '1px solid #7f9db9'
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '2px',
    fontSize: '11px',
    border: '1px solid #7f9db9',
    backgroundColor: '#ffffff'
};

const winboxCmdBtnStyle: React.CSSProperties = {
    padding: '3px',
    fontSize: '11px',
    backgroundColor: '#f0f0f0',
    border: '1px solid #ffffff',
    borderBottomColor: '#808080',
    borderRightColor: '#808080',
    cursor: 'pointer'
};