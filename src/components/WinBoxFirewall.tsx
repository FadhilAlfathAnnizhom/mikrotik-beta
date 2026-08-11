import React, { useState } from 'react';
import { useStore } from '../store/useStore';

interface WinBoxFirewallProps {
    onClose?: () => void;
}

export const WinBoxFirewall: React.FC<WinBoxFirewallProps> = ({ onClose }) => {
    const { firewallRules, addFirewallNatRule, removeFirewallNatRule } = useStore() as any;

    const [activeTab, setActiveTab] = useState<'filter' | 'nat' | 'mangle'>('nat');
    const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Tab State dalam Modal
    const [modalTab, setModalTab] = useState<'general' | 'advanced' | 'extra' | 'action' | 'statistics'>('general');

    // Form State NAT Rule
    const [chain, setChain] = useState<'srcnat' | 'dstnat'>('srcnat');
    const [srcAddress, setSrcAddress] = useState<string>('');
    const [dstAddress, setDstAddress] = useState<string>('');
    const [inInterface, setInInterface] = useState<string>('');
    const [outInterface, setOutInterface] = useState<string>('ether1');
    const [action, setAction] = useState<string>('masquerade');
    const [toAddresses, setToAddresses] = useState<string>('200.210.220.2');
    const [toPorts, setToPorts] = useState<string>('');
    const [comment, setComment] = useState<string>('');
    const [isRuleDisabled, setIsRuleDisabled] = useState<boolean>(false);

    const handleSaveNatRule = () => {
        const newRule = {
            id: `nat-${Date.now()}`,
            chain,
            srcAddress,
            dstAddress,
            inInterface,
            outInterface,
            action,
            toAddresses: (action === 'src-nat' || action === 'dst-nat') ? toAddresses : undefined,
            toPorts: (action === 'redirect' || action === 'dst-nat') ? toPorts : undefined,
            disabled: isRuleDisabled,
            comment: comment || action
        };

        if (addFirewallNatRule) {
            addFirewallNatRule(newRule);
        } else {
            useStore.setState((state: any) => ({
                firewallRules: {
                    ...state.firewallRules,
                    nat: [...(state.firewallRules?.nat || []), newRule]
                }
            }));
        }

        if (action === 'masquerade' || action === 'src-nat') {
            useStore.setState({
                isNatConfigured: true,
                isInternetConnected: true
            });
        }

        setIsAddModalOpen(false);
    };

    const handleRemoveNatRule = () => {
        if (!selectedRuleId) return;

        const currentNat = firewallRules?.nat || [];
        const remainingNat = currentNat.filter((r: any) => r.id !== selectedRuleId);
        const hasNatRules = remainingNat.length > 0;

        if (removeFirewallNatRule) {
            removeFirewallNatRule(selectedRuleId);
        } else {
            useStore.setState((state: any) => ({
                firewallRules: {
                    ...state.firewallRules,
                    nat: remainingNat
                }
            }));
        }

        useStore.setState({
            isNatConfigured: hasNatRules,
            isInternetConnected: hasNatRules
        });

        setSelectedRuleId(null);
    };

    const natRules = firewallRules?.nat || [];

    return (
        <div style={windowContainerStyle}>
            {/* Title Bar - Gradient Blue sesuai screenshot */}
            <div style={titleBarStyle}>
                <span>IP -&gt; Firewall</span>
                <button onClick={onClose} style={closeBtnStyle}>✕</button>
            </div>

            {/* Main Tabs Navigation */}
            <div style={tabHeaderContainerStyle}>
                <button
                    style={activeTab === 'filter' ? activeTabStyle : inactiveTabStyle}
                    onClick={() => setActiveTab('filter')}
                >
                    Filter Rules
                </button>
                <button
                    style={activeTab === 'nat' ? activeTabStyle : inactiveTabStyle}
                    onClick={() => setActiveTab('nat')}
                >
                    NAT
                </button>
                <button
                    style={activeTab === 'mangle' ? activeTabStyle : inactiveTabStyle}
                    onClick={() => setActiveTab('mangle')}
                >
                    Mangle
                </button>
                <button style={inactiveTabStyle}>Raw</button>
                <button style={inactiveTabStyle}>Service Ports</button>
            </div>

            {/* Content Area */}
            {activeTab === 'nat' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '4px' }}>
                    {/* Toolbar sesuai gaya screenshot 2 */}
                    <div style={toolbarStyle}>
                        <button style={toolBtnStyle} onClick={() => setIsAddModalOpen(true)} title="Add Rule">
                            +
                        </button>
                        <button
                            style={{
                                ...toolBtnStyle,
                                opacity: selectedRuleId ? 1 : 0.4,
                                cursor: selectedRuleId ? 'pointer' : 'not-allowed'
                            }}
                            onClick={handleRemoveNatRule}
                            disabled={!selectedRuleId}
                            title="Remove Selected Rule"
                        >
                            -
                        </button>
                        <button style={toolBtnWithTextStyle}>
                            <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓</span> Enable
                        </button>
                        <button style={toolBtnWithTextStyle}>
                            <span style={{ color: '#dc2626', fontWeight: 'bold' }}>✕</span> Disable
                        </button>
                    </div>

                    {/* Tabel Rules */}
                    <div style={tableWrapperStyle}>
                        <table style={tableStyle}>
                            <thead>
                                <tr style={tableHeaderRowStyle}>
                                    <th style={thStyle}>#</th>
                                    <th style={thStyle}>Action</th>
                                    <th style={thStyle}>Chain</th>
                                    <th style={thStyle}>Src. Address</th>
                                    <th style={thStyle}>Dst. Address</th>
                                    <th style={thStyle}>Out. Interface</th>
                                    <th style={thStyle}>To Addresses</th>
                                </tr>
                            </thead>
                            <tbody>
                                {natRules.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                                            0 items
                                        </td>
                                    </tr>
                                ) : (
                                    natRules.map((rule: any, idx: number) => {
                                        const isSelected = selectedRuleId === rule.id;
                                        return (
                                            <tr
                                                key={rule.id}
                                                onClick={() => setSelectedRuleId(rule.id)}
                                                style={{
                                                    backgroundColor: isSelected ? '#2563eb' : 'transparent',
                                                    color: isSelected ? '#ffffff' : '#1e293b',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid #f1f5f9'
                                                }}
                                            >
                                                <td style={tdStyle}>{idx}</td>
                                                <td style={{ ...tdStyle, fontWeight: 'bold' }}>{rule.action}</td>
                                                <td style={tdStyle}>{rule.chain}</td>
                                                <td style={tdStyle}>{rule.srcAddress || ''}</td>
                                                <td style={tdStyle}>{rule.dstAddress || ''}</td>
                                                <td style={tdStyle}>{rule.outInterface || 'all'}</td>
                                                <td style={tdStyle}>{rule.toAddresses || ''}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Dialog Klasi - NAT Rule */}
            {isAddModalOpen && (
                <div style={modalOverlayStyle}>
                    <div style={modalDialogStyle}>
                        {/* Modal Title Bar */}
                        <div style={titleBarStyle}>
                            <span>NAT Rule</span>
                            <button onClick={() => setIsAddModalOpen(false)} style={closeBtnStyle}>✕</button>
                        </div>

                        {/* Modal Subtabs */}
                        <div style={tabHeaderContainerStyle}>
                            {(['general', 'advanced', 'extra', 'action', 'statistics'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    style={modalTab === tab ? activeTabStyle : inactiveTabStyle}
                                    onClick={() => setModalTab(tab)}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Modal Content Body */}
                        <div style={{ display: 'flex', padding: '10px', gap: '10px', backgroundColor: '#f8fafc' }}>
                            {/* Form Input Area */}
                            <div style={formPanelStyle}>
                                {modalTab === 'general' && (
                                    <div style={formGridStyle}>
                                        <label style={labelStyle}>Chain:</label>
                                        <select
                                            value={chain}
                                            onChange={(e: any) => setChain(e.target.value)}
                                            style={selectInputStyle}
                                        >
                                            <option value="srcnat">srcnat</option>
                                            <option value="dstnat">dstnat</option>
                                        </select>

                                        <label style={labelStyle}>Src. Address:</label>
                                        <input
                                            type="text"
                                            value={srcAddress}
                                            onChange={(e) => setSrcAddress(e.target.value)}
                                            style={textInputStyle}
                                        />

                                        <label style={labelStyle}>Dst. Address:</label>
                                        <input
                                            type="text"
                                            value={dstAddress}
                                            onChange={(e) => setDstAddress(e.target.value)}
                                            style={textInputStyle}
                                        />

                                        <label style={labelStyle}>In. Interface:</label>
                                        <select
                                            value={inInterface}
                                            onChange={(e: any) => setInInterface(e.target.value)}
                                            style={selectInputStyle}
                                        >
                                            <option value="">(all)</option>
                                            <option value="ether1">ether1</option>
                                            <option value="ether2">ether2</option>
                                            <option value="wlan1">wlan1</option>
                                        </select>

                                        <label style={{ ...labelStyle, color: '#2563eb', fontWeight: 'bold' }}>Out. Interface:</label>
                                        <select
                                            value={outInterface}
                                            onChange={(e: any) => setOutInterface(e.target.value)}
                                            style={selectInputStyle}
                                        >
                                            <option value="">(all)</option>
                                            <option value="ether1">ether1</option>
                                            <option value="ether2">ether2</option>
                                            <option value="wlan1">wlan1</option>
                                        </select>
                                    </div>
                                )}

                                {modalTab === 'action' && (
                                    <div style={formGridStyle}>
                                        <label style={{ ...labelStyle, color: '#2563eb', fontWeight: 'bold' }}>Action:</label>
                                        <select
                                            value={action}
                                            onChange={(e: any) => setAction(e.target.value)}
                                            style={selectInputStyle}
                                        >
                                            <option value="masquerade">masquerade</option>
                                            <option value="src-nat">src-nat</option>
                                            <option value="dst-nat">dst-nat</option>
                                            <option value="redirect">redirect</option>
                                            <option value="accept">accept</option>
                                            <option value="drop">drop</option>
                                        </select>

                                        {(action === 'src-nat' || action === 'dst-nat') && (
                                            <>
                                                <label style={{ ...labelStyle, color: '#2563eb', fontWeight: 'bold' }}>To Addresses:</label>
                                                <input
                                                    type="text"
                                                    value={toAddresses}
                                                    onChange={(e) => setToAddresses(e.target.value)}
                                                    placeholder="200.210.220.2"
                                                    style={textInputStyle}
                                                />
                                            </>
                                        )}

                                        {(action === 'redirect' || action === 'dst-nat') && (
                                            <>
                                                <label style={labelStyle}>To Ports:</label>
                                                <input
                                                    type="text"
                                                    value={toPorts}
                                                    onChange={(e) => setToPorts(e.target.value)}
                                                    style={textInputStyle}
                                                />
                                            </>
                                        )}
                                    </div>
                                )}

                                {modalTab === 'advanced' && (
                                    <div style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', paddingTop: '20px' }}>
                                        Advanced options...
                                    </div>
                                )}
                                {modalTab === 'extra' && (
                                    <div style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', paddingTop: '20px' }}>
                                        Extra options...
                                    </div>
                                )}
                                {modalTab === 'statistics' && (
                                    <div style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', paddingTop: '20px' }}>
                                        Statistics counters...
                                    </div>
                                )}
                            </div>

                            {/* Sidebar Action Buttons (Sebelah Kanan Modal) */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '90px' }}>
                                <button style={actionButtonStyle} onClick={handleSaveNatRule}>OK</button>
                                <button style={actionButtonStyle} onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                                <button style={actionButtonStyle} onClick={handleSaveNatRule}>Apply</button>
                                <button style={actionButtonStyle} onClick={() => setIsRuleDisabled(!isRuleDisabled)}>
                                    {isRuleDisabled ? 'Enable' : 'Disable'}
                                </button>
                                <button
                                    style={actionButtonStyle}
                                    onClick={() => {
                                        const c = prompt('Comment:', comment);
                                        if (c !== null) setComment(c);
                                    }}
                                >
                                    Comment
                                </button>
                                <button style={actionButtonStyle}>Copy</button>
                                <button style={actionButtonStyle}>Remove</button>
                                <button style={actionButtonStyle}>Reset Counters</button>
                                <button style={actionButtonStyle}>Reset All Counters</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Styling Object yang Mengikuti Screenshot 2
const windowContainerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8fafc',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '11px',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #203a60',
    boxSizing: 'border-box',
    overflow: 'hidden',
    userSelect: 'none'
};

const titleBarStyle: React.CSSProperties = {
    background: 'linear-gradient(90deg, #1b3864 0%, #3b6098 100%)',
    color: '#ffffff',
    padding: '3px 6px',
    fontWeight: '600',
    fontSize: '11px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
};

const closeBtnStyle: React.CSSProperties = {
    backgroundColor: '#e2e8f0',
    border: '1px solid #64748b',
    borderRadius: '2px',
    fontSize: '9px',
    width: '15px',
    height: '15px',
    lineHeight: '13px',
    textAlign: 'center',
    cursor: 'pointer',
    fontWeight: 'bold',
    color: '#0f172a',
    padding: 0
};

const tabHeaderContainerStyle: React.CSSProperties = {
    display: 'flex',
    backgroundColor: '#e2e8f0',
    borderBottom: '1px solid #cbd5e1',
    paddingTop: '3px',
    paddingLeft: '4px',
    gap: '2px'
};

const inactiveTabStyle: React.CSSProperties = {
    padding: '3px 10px',
    fontSize: '11px',
    border: '1px solid #cbd5e1',
    borderBottom: 'none',
    borderRadius: '3px 3px 0 0',
    backgroundColor: '#cbd5e1',
    color: '#475569',
    cursor: 'pointer'
};

const activeTabStyle: React.CSSProperties = {
    ...inactiveTabStyle,
    backgroundColor: '#ffffff',
    color: '#1e3a8a',
    fontWeight: 'bold',
    borderBottom: '1px solid #ffffff',
    position: 'relative',
    top: '1px'
};

const toolbarStyle: React.CSSProperties = {
    padding: '3px 4px',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '3px',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
};

const toolBtnStyle: React.CSSProperties = {
    padding: '1px 8px',
    fontSize: '12px',
    fontWeight: 'bold',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '2px',
    cursor: 'pointer',
    color: '#334155',
    boxShadow: '0 1px 1px rgba(0,0,0,0.05)'
};

const toolBtnWithTextStyle: React.CSSProperties = {
    padding: '1px 8px',
    fontSize: '11px',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '2px',
    cursor: 'pointer',
    color: '#334155',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    boxShadow: '0 1px 1px rgba(0,0,0,0.05)'
};

const tableWrapperStyle: React.CSSProperties = {
    flex: 1,
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '2px',
    overflowY: 'auto'
};

const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '11px'
};

const tableHeaderRowStyle: React.CSSProperties = {
    backgroundColor: '#f1f5f9',
    borderBottom: '1px solid #cbd5e1',
    color: '#475569'
};

const thStyle: React.CSSProperties = {
    padding: '4px 6px',
    textAlign: 'left',
    fontWeight: '600',
    fontSize: '11px',
    borderRight: '1px solid #e2e8f0'
};

const tdStyle: React.CSSProperties = {
    padding: '3px 6px',
    fontSize: '11px',
    borderRight: '1px solid #f1f5f9'
};

const modalOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
};

const modalDialogStyle: React.CSSProperties = {
    width: '460px',
    backgroundColor: '#ffffff',
    border: '1px solid #1e3a8a',
    borderRadius: '4px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    overflow: 'hidden'
};

const formPanelStyle: React.CSSProperties = {
    flex: 1,
    border: '1px solid #cbd5e1',
    borderRadius: '2px',
    backgroundColor: '#ffffff',
    padding: '10px',
    minHeight: '200px'
};

const formGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '95px 1fr',
    gap: '6px',
    alignItems: 'center'
};

const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    textAlign: 'right',
    color: '#334155'
};

const selectInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '2px 4px',
    fontSize: '11px',
    border: '1px solid #cbd5e1',
    borderRadius: '2px',
    backgroundColor: '#ffffff',
    outline: 'none',
    height: '22px'
};

const textInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '2px 4px',
    fontSize: '11px',
    border: '1px solid #cbd5e1',
    borderRadius: '2px',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
    outline: 'none',
    height: '22px'
};

const actionButtonStyle: React.CSSProperties = {
    padding: '3px 6px',
    fontSize: '11px',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '2px',
    cursor: 'pointer',
    textAlign: 'center',
    color: '#1e293b',
    boxShadow: '0 1px 1px rgba(0,0,0,0.05)'
};