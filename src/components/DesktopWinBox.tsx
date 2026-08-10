import { useState, useEffect } from 'react';
import { WinBoxFirewall } from './WinBoxFirewall';
import { useStore, type DesktopWindow, type NetworkInterface, type IPAddress, type DHCPClient } from '../store/useStore';

export const DesktopWinBox = () => {
    const { routerData, logout, openDesktopWindow, desktopWindows, closeDesktopWindow, focusDesktopWindow, tickTraffic, hasInternet } = useStore();
    const [expandedMenu, setExpandedMenu] = useState<string | null>('IP');

    // State Responsif Layar Mobile
    const [screenWidth, setScreenWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);
    const isMobile = screenWidth < 768;
    const [showMobileSidebar, setShowMobileSidebar] = useState<boolean>(!isMobile);

    useEffect(() => {
        const handleResize = () => {
            setScreenWidth(window.innerWidth);
            if (window.innerWidth >= 768) {
                setShowMobileSidebar(true);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Timer Real-time Traffic Simulator
    useEffect(() => {
        const interval = setInterval(() => {
            tickTraffic();
        }, 1000);
        return () => clearInterval(interval);
    }, [tickTraffic]);

    const ipSubMenus = [
        'Addresses', 'ARP', 'DHCP Client', 'DHCP Server', 'DNS', 'Firewall', 'Hotspot', 'Neighbors', 'Pool', 'Routes', 'Services', 'Web Proxy'
    ];

    const handleMenuClick = (menu: string) => {
        if (menu === 'IP') {
            setExpandedMenu(expandedMenu === 'IP' ? null : 'IP');
        } else {
            openDesktopWindow(menu);
            if (isMobile) {
                setShowMobileSidebar(false); // Tutup sidebar otomatis di HP setelah memilih menu
            }
        }
    };

    return (
        <div style={desktopContainerStyle}>
            {/* Title Bar */}
            <div style={titleBarStyle}>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {routerData.username}@{routerData.macAddress} ({routerData.identity}) - WinBox (64bit)
                </span>
            </div>

            {/* Main Menu Bar & Mobile Toggle */}
            <div style={menuBarStyle}>
                {isMobile && (
                    <button
                        onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                        style={mobileToggleBtnStyle}
                    >
                        ☰ Menu
                    </button>
                )}
                <span style={menuItemStyle}>Session</span>
                <span style={menuItemStyle}>Settings</span>
                <span style={menuItemStyle}>Dashboard</span>
            </div>

            {/* Toolbar */}
            <div style={toolbarStyle}>
                <button style={toolbarBtnStyle}>Undo</button>
                <button style={toolbarBtnStyle}>Redo</button>
                <button style={toolbarBtnStyle}>Safe Mode</button>
                {!isMobile && (
                    <span style={{ margin: '0 10px', fontSize: '11px' }}>
                        Session: <input type="text" readOnly value={routerData.macAddress} style={{ fontSize: '11px', padding: '1px 4px', width: '110px' }} />
                    </span>
                )}
                <div style={{ flexGrow: 1 }}></div>
                <button onClick={logout} style={{ ...toolbarBtnStyle, color: 'red', fontWeight: 'bold' }}>Disconnect</button>
            </div>

            {/* Body: Sidebar + Workspace */}
            <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden', position: 'relative' }}>

                {/* Sidebar Responsif */}
                {showMobileSidebar && (
                    <div style={{
                        ...sidebarStyle,
                        position: isMobile ? 'absolute' : 'relative',
                        zIndex: isMobile ? 100 : 1,
                        height: isMobile ? '100%' : 'auto',
                        width: isMobile ? '180px' : '140px',
                        boxShadow: isMobile ? '3px 0px 10px rgba(0,0,0,0.3)' : 'none'
                    }}>
                        <div onClick={() => handleMenuClick('Interfaces')} style={sidebarItemStyle}>Interfaces</div>
                        <div onClick={() => handleMenuClick('Bridge')} style={sidebarItemStyle}>Bridge</div>
                        <div onClick={() => handleMenuClick('PPP')} style={sidebarItemStyle}>PPP</div>
                        <div onClick={() => handleMenuClick('Switch')} style={sidebarItemStyle}>Switch</div>

                        {/* IP Menu dengan Submenu */}
                        <div onClick={() => handleMenuClick('IP')} style={{ ...sidebarItemStyle, background: expandedMenu === 'IP' ? '#D4D0C8' : 'transparent', fontWeight: 'bold' }}>
                            IP {expandedMenu === 'IP' ? '▾' : '▸'}
                        </div>
                        {expandedMenu === 'IP' && (
                            <div style={{ background: '#E8E8E8', paddingLeft: '15px' }}>
                                {ipSubMenus.map(sub => (
                                    <div key={sub} onClick={() => openDesktopWindow(`IP -> ${sub}`)} style={sidebarSubItemStyle}>
                                        {sub}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div onClick={() => handleMenuClick('Routing')} style={sidebarItemStyle}>Routing</div>
                        <div onClick={() => handleMenuClick('System')} style={sidebarItemStyle}>System</div>
                        <div onClick={() => handleMenuClick('Queues')} style={sidebarItemStyle}>Queues</div>
                        <div onClick={() => handleMenuClick('Files')} style={sidebarItemStyle}>Files</div>
                        <div onClick={() => handleMenuClick('Log')} style={sidebarItemStyle}>Log</div>
                        <div onClick={() => handleMenuClick('Tools')} style={sidebarItemStyle}>Tools</div>
                        <div onClick={() => handleMenuClick('New Terminal')} style={sidebarItemStyle}>New Terminal</div>
                        <div onClick={() => handleMenuClick('Exit')} style={sidebarItemStyle}>Exit</div>
                    </div>
                )}

                {/* Workspace Windows */}
                <div style={workspaceStyle} onClick={() => { if (isMobile && showMobileSidebar) setShowMobileSidebar(false); }}>
                    {desktopWindows.map(win => (
                        <WindowComponent
                            key={win.id}
                            win={win}
                            isMobile={isMobile}
                            onClose={() => closeDesktopWindow(win.id)}
                            onFocus={() => focusDesktopWindow(win.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Status Bar */}
            <div style={statusBarStyle}>
                <span style={{ marginRight: '10px', color: hasInternet ? 'green' : 'orange', fontWeight: 'bold' }}>
                    ● {hasInternet ? 'Online' : 'No Net'}
                </span>
                <span style={{ marginRight: '10px', whiteSpace: 'nowrap' }}>Id: {routerData.identity}</span>
                {!isMobile && <span style={{ marginRight: '10px' }}>RouterOS: {routerData.version}</span>}
                <span style={{ marginRight: '10px' }}>User: {routerData.username}</span>
            </div>
        </div>
    );
};

// Window Component RouterOS (Responsif Mobile + Pointer Events Drag)
const WindowComponent = ({ win, isMobile, onClose, onFocus }: { win: DesktopWindow, isMobile: boolean, onClose: () => void, onFocus: () => void }) => {
    const defaultX = isMobile ? 10 : win.x;
    const defaultY = isMobile ? 10 : win.y;

    const [pos, setPos] = useState({ x: defaultX, y: defaultY });
    const [isDragging, setIsDragging] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (isMobile) {
            setPos({ x: 8, y: 8 });
        }
    }, [isMobile]);

    const startDrag = (e: React.PointerEvent) => {
        onFocus();
        setIsDragging(true);
        setOffset({ x: e.clientX - pos.x, y: e.clientY - pos.y });
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };

    const onDrag = (e: React.PointerEvent) => {
        if (isDragging) {
            setPos({ x: e.clientX - offset.x, y: e.clientY - offset.y });
        }
    };

    const stopDrag = (e: React.PointerEvent) => {
        if (isDragging) {
            setIsDragging(false);
            try {
                (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
            } catch (_) { }
        }
    };

    return (
        <div
            style={{
                position: 'absolute',
                left: isMobile ? '3vw' : pos.x,
                top: isMobile ? '10px' : pos.y,
                zIndex: win.z,
                width: isMobile ? '94vw' : (win.title.includes('Address') || win.title.includes('DHCP') ? '540px' : '620px'),
                maxHeight: isMobile ? 'calc(100vh - 120px)' : '80vh',
                height: isMobile ? '380px' : '320px',
                background: '#F0F0F0',
                border: '1px solid #A0A0A0',
                boxShadow: '2px 2px 5px rgba(0,0,0,0.4)',
                display: 'flex',
                flexDirection: 'column',
                resize: isMobile ? 'none' : 'both',
                overflow: 'hidden'
            }}
        >
            {/* Header / Title Bar Window */}
            <div
                onPointerDown={startDrag}
                onPointerMove={onDrag}
                onPointerUp={stopDrag}
                onPointerCancel={stopDrag}
                style={{
                    background: 'linear-gradient(90deg, #0A246A 0%, #A6CAF0 100%)',
                    color: 'white',
                    padding: '4px 6px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'grab',
                    userSelect: 'none',
                    touchAction: 'none'
                }}
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{win.title}</span>
                <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={onClose}
                    style={{ background: '#C0C0C0', border: '1px solid #FFF', borderBottomColor: '#666', borderRightColor: '#666', fontSize: '10px', cursor: 'pointer', padding: '1px 5px' }}
                >
                    X
                </button>
            </div>

            <div style={{ flexGrow: 1, padding: '5px', overflowY: 'auto', fontSize: '12px' }} onMouseDown={onFocus} onPointerDown={onFocus}>
                {win.title === 'Interfaces' && <InterfaceWindowContent />}
                {win.title === 'IP -> Addresses' && <IPAddressWindowContent />}
                {win.title === 'IP -> DHCP Client' && <DHCPClientWindowContent />}
                {win.title === 'IP -> DHCP Server' && <DHCPServerWindowContent />}
                {(win.title === 'IP -> Firewall' || win.title === 'Firewall') && <WinBoxFirewall />}

                {!['Interfaces', 'IP -> Addresses', 'IP -> DHCP Client', 'IP -> DHCP Server', 'IP -> Firewall', 'Firewall'].includes(win.title) && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                        <h3>{win.title}</h3>
                        <p>Placeholder window for {win.title}. Simulation logic ready for future phase.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// 1. TAMPILAN INTERFACE LIST
const InterfaceWindowContent = () => {
    const { interfaces, renameInterface, toggleInterface } = useStore();
    const [selectedIf, setSelectedIf] = useState<NetworkInterface | null>(null);
    const [showProp, setShowProp] = useState(false);
    const [editName, setEditName] = useState('');

    const handleDoubleClick = (iface: NetworkInterface) => {
        setSelectedIf(iface);
        setEditName(iface.name);
        setShowProp(true);
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={winToolbarStyle}>
                <button style={winBtnStyle} onClick={() => selectedIf && toggleInterface(selectedIf.id, false)}>✓ Enable</button>
                <button style={winBtnStyle} onClick={() => selectedIf && toggleInterface(selectedIf.id, true)}>✕ Disable</button>
            </div>

            <div style={{ flexGrow: 1, overflowX: 'auto', overflowY: 'auto', background: 'white', border: '1px solid #7F9DB9' }}>
                <table style={{ ...winTableStyle, minWidth: '480px' }}>
                    <thead>
                        <tr>
                            <th style={thStyle}>Flags</th>
                            <th style={thStyle}>Name</th>
                            <th style={thStyle}>Type</th>
                            <th style={thStyle}>Actual MTU</th>
                            <th style={thStyle}>L2 MTU</th>
                            <th style={thStyle}>MAC Address</th>
                            <th style={thStyle}>Tx (bps)</th>
                            <th style={thStyle}>Rx (bps)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {interfaces.map(i => {
                            let flag = '';
                            if (i.disabled) flag += 'X ';
                            if (i.isLinkUp && !i.disabled) flag += 'R ';

                            return (
                                <tr
                                    key={i.id}
                                    onClick={() => setSelectedIf(i)}
                                    onDoubleClick={() => handleDoubleClick(i)}
                                    style={selectedIf?.id === i.id ? selectedRowStyle : rowStyle}
                                >
                                    <td style={{ ...tdStyle, fontWeight: 'bold', color: i.disabled ? 'red' : 'green' }}>{flag}</td>
                                    <td style={tdStyle}>{i.name}</td>
                                    <td style={tdStyle}>{i.type}</td>
                                    <td style={tdStyle}>{i.actualMtu}</td>
                                    <td style={tdStyle}>{i.l2Mtu}</td>
                                    <td style={tdStyle}>{i.macAddress}</td>
                                    <td style={tdStyle}>{i.tx.toLocaleString()}</td>
                                    <td style={tdStyle}>{i.rx.toLocaleString()}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal Interface Properties */}
            {showProp && selectedIf && (
                <div style={modalStyle}>
                    <div style={dialogStyle}>
                        <div style={dialogHeaderStyle}>Interface &lt;{selectedIf.name}&gt;</div>
                        <div style={{ padding: '10px', fontSize: '11px' }}>
                            <table style={{ width: '100%' }}>
                                <tbody>
                                    <tr><td>Name:</td><td><input type="text" value={editName} onChange={e => setEditName(e.target.value)} style={inputStyle} /></td></tr>
                                    <tr><td>Type:</td><td><input type="text" readOnly value={selectedIf.type} style={inputStyle} /></td></tr>
                                    <tr><td>MAC Address:</td><td><input type="text" readOnly value={selectedIf.macAddress} style={inputStyle} /></td></tr>
                                    <tr><td>MTU:</td><td><input type="text" readOnly value={selectedIf.actualMtu} style={inputStyle} /></td></tr>
                                    <tr><td>ARP:</td><td><input type="text" readOnly value={selectedIf.arp} style={inputStyle} /></td></tr>
                                </tbody>
                            </table>
                            <div style={{ marginTop: '15px', textAlign: 'right' }}>
                                <button onClick={() => { renameInterface(selectedIf.id, editName); setShowProp(false); }} style={winBtnStyle}>OK</button>
                                <button onClick={() => setShowProp(false)} style={winBtnStyle}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// 2. TAMPILAN IP ADDRESS LIST & ADD DIALOG
const IPAddressWindowContent = () => {
    const { ipAddresses, interfaces, addIPAddress, toggleIPAddress, removeIPAddress } = useStore();
    const [selectedIp, setSelectedIp] = useState<IPAddress | null>(null);
    const [showAddDialog, setShowAddDialog] = useState(false);

    const [newAddr, setNewAddr] = useState('192.168.100.1/24');
    const [selectedIface, setSelectedIface] = useState('');
    const [comment, setComment] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleOpenAddDialog = () => {
        const active = interfaces.find(i => !i.disabled);
        if (active) {
            setSelectedIface(active.name);
        }
        setErrorMsg('');
        setShowAddDialog(true);
    };

    const handleSave = () => {
        setErrorMsg('');
        const res = addIPAddress({ address: newAddr, interfaceName: selectedIface, comment });
        if (res.success) {
            setShowAddDialog(false);
            setComment('');
        } else {
            setErrorMsg(res.message || 'Error saving address');
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={winToolbarStyle}>
                <button style={winBtnStyle} onClick={handleOpenAddDialog}>+ Add</button>
                <button style={winBtnStyle} onClick={() => selectedIp && removeIPAddress(selectedIp.id)}>- Remove</button>
                <button style={winBtnStyle} onClick={() => selectedIp && toggleIPAddress(selectedIp.id)}>✓ / ✕ Toggle</button>
            </div>

            <div style={{ flexGrow: 1, overflowX: 'auto', overflowY: 'auto', background: 'white', border: '1px solid #7F9DB9' }}>
                <table style={{ ...winTableStyle, minWidth: '400px' }}>
                    <thead>
                        <tr>
                            <th style={thStyle}>Flags</th>
                            <th style={thStyle}>Address</th>
                            <th style={thStyle}>Network</th>
                            <th style={thStyle}>Interface</th>
                            <th style={thStyle}>Comment</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ipAddresses.map(ip => {
                            let flag = '';
                            if (ip.disabled) flag += 'X ';
                            if (ip.isDynamic) flag += 'D ';

                            return (
                                <tr
                                    key={ip.id}
                                    onClick={() => setSelectedIp(ip)}
                                    style={selectedIp?.id === ip.id ? selectedRowStyle : rowStyle}
                                >
                                    <td style={{ ...tdStyle, fontWeight: 'bold' }}>{flag}</td>
                                    <td style={tdStyle}>{ip.address}</td>
                                    <td style={tdStyle}>{ip.network}</td>
                                    <td style={tdStyle}>{ip.interfaceName}</td>
                                    <td style={tdStyle}>{ip.comment}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal Add Address */}
            {showAddDialog && (
                <div style={modalStyle}>
                    <div style={dialogStyle}>
                        <div style={dialogHeaderStyle}>New Address</div>
                        <div style={{ padding: '10px', fontSize: '11px' }}>
                            {errorMsg && <div style={{ color: 'red', marginBottom: '8px', fontWeight: 'bold' }}>{errorMsg}</div>}
                            <table>
                                <tbody>
                                    <tr>
                                        <td>Address:</td>
                                        <td><input type="text" value={newAddr} onChange={e => setNewAddr(e.target.value)} style={inputStyle} /></td>
                                    </tr>
                                    <tr>
                                        <td>Interface:</td>
                                        <td>
                                            <select value={selectedIface} onChange={e => setSelectedIface(e.target.value)} style={inputStyle}>
                                                {interfaces.filter(i => !i.disabled).map(i => (
                                                    <option key={i.id} value={i.name}>{i.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Comment:</td>
                                        <td><input type="text" value={comment} onChange={e => setComment(e.target.value)} style={inputStyle} /></td>
                                    </tr>
                                </tbody>
                            </table>
                            <div style={{ marginTop: '15px', textAlign: 'right' }}>
                                <button onClick={handleSave} style={winBtnStyle}>OK</button>
                                <button onClick={() => setShowAddDialog(false)} style={winBtnStyle}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// 3. TAMPILAN DHCP CLIENT LIST & ADD DIALOG
const DHCPClientWindowContent = () => {
    const { dhcpClients, interfaces, addDHCPClient, removeDHCPClient, toggleDHCPClient } = useStore();
    const [selectedDhcp, setSelectedDhcp] = useState<DHCPClient | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [selectedIface, setSelectedIface] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleOpenAdd = () => {
        const active = interfaces.find(i => !i.disabled);
        if (active) {
            setSelectedIface(active.name);
        }
        setErrorMsg('');
        setShowAdd(true);
    };

    const handleSave = () => {
        setErrorMsg('');
        const res = addDHCPClient({
            interfaceName: selectedIface,
            usePeerDNS: true,
            addDefaultRoute: true,
            defaultRouteDistance: 1,
            comment: 'WAN DHCP'
        });
        if (res.success) {
            setShowAdd(false);
        } else {
            setErrorMsg(res.message || 'Error creating DHCP Client');
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={winToolbarStyle}>
                <button style={winBtnStyle} onClick={handleOpenAdd}>+ Add</button>
                <button style={winBtnStyle} onClick={() => selectedDhcp && removeDHCPClient(selectedDhcp.id)}>- Remove</button>
                <button style={winBtnStyle} onClick={() => selectedDhcp && toggleDHCPClient(selectedDhcp.id)}>✓ / ✕ Toggle</button>
            </div>

            <div style={{ flexGrow: 1, overflowX: 'auto', overflowY: 'auto', background: 'white', border: '1px solid #7F9DB9' }}>
                <table style={{ ...winTableStyle, minWidth: '420px' }}>
                    <thead>
                        <tr>
                            <th style={thStyle}>Interface</th>
                            <th style={thStyle}>Status</th>
                            <th style={thStyle}>Address</th>
                            <th style={thStyle}>Gateway</th>
                            <th style={thStyle}>DNS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dhcpClients.map(d => (
                            <tr
                                key={d.id}
                                onClick={() => setSelectedDhcp(d)}
                                style={selectedDhcp?.id === d.id ? selectedRowStyle : rowStyle}
                            >
                                <td style={tdStyle}>{d.interfaceName}</td>
                                <td style={{ ...tdStyle, fontWeight: 'bold', color: d.status === 'Bound' ? 'green' : 'orange' }}>{d.status}</td>
                                <td style={tdStyle}>{d.address || '-'}</td>
                                <td style={tdStyle}>{d.gateway || '-'}</td>
                                <td style={tdStyle}>{d.dns || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Add DHCP Client */}
            {showAdd && (
                <div style={modalStyle}>
                    <div style={dialogStyle}>
                        <div style={dialogHeaderStyle}>DHCP Client</div>
                        <div style={{ padding: '10px', fontSize: '11px' }}>
                            {errorMsg && <div style={{ color: 'red', marginBottom: '8px', fontWeight: 'bold' }}>{errorMsg}</div>}
                            <table>
                                <tbody>
                                    <tr>
                                        <td>Interface:</td>
                                        <td>
                                            <select value={selectedIface} onChange={e => setSelectedIface(e.target.value)} style={inputStyle}>
                                                {interfaces.filter(i => !i.disabled).map(i => (
                                                    <option key={i.id} value={i.name}>{i.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Use Peer DNS:</td>
                                        <td><input type="checkbox" defaultChecked /></td>
                                    </tr>
                                    <tr>
                                        <td>Add Default Route:</td>
                                        <td><input type="checkbox" defaultChecked /></td>
                                    </tr>
                                </tbody>
                            </table>
                            <div style={{ marginTop: '15px', textAlign: 'right' }}>
                                <button onClick={handleSave} style={winBtnStyle}>OK</button>
                                <button onClick={() => setShowAdd(false)} style={winBtnStyle}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// 4. TAMPILAN DHCP SERVER LIST & STEP-BY-STEP WIZARD (DHCP SETUP)
const DHCPServerWindowContent = () => {
    const store = useStore() as any;
    const dhcpServers = store.dhcpServers || [];
    const interfaces = store.interfaces || [];
    const ipAddresses = store.ipAddresses || [];
    const toggleDhcpServer = store.toggleDhcpServer;
    const removeDhcpServer = store.removeDhcpServer;
    const addDhcpServer = store.addDhcpServer || store.addDHCPServer;

    const [selectedServer, setSelectedServer] = useState<any | null>(null);
    const [showWizard, setShowWizard] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);

    // Form Wizard States
    const [selectedIface, setSelectedIface] = useState('');
    const [addressSpace, setAddressSpace] = useState('192.168.100.0/24');
    const [gateway, setGateway] = useState('192.168.100.1');
    const [addressesToGive, setAddressesToGive] = useState('192.168.100.2-192.168.100.254');
    const [dnsServers, setDnsServers] = useState('8.8.8.8');
    const [leaseTime, setLeaseTime] = useState('00:10:00');

    // Helper cek apakah interface memiliki IP di IP -> Addresses
    const getIfaceIpConfig = (ifaceName: string) => {
        return ipAddresses.find((ip: any) => !ip.disabled && ip.interfaceName === ifaceName);
    };

    const updateDefaultsFromIface = (ifaceName: string) => {
        const ipObj = getIfaceIpConfig(ifaceName);
        if (ipObj && ipObj.address) {
            const [ip] = ipObj.address.split('/');
            const parts = ip.split('.');
            if (parts.length === 4) {
                const netPrefix = `${parts[0]}.${parts[1]}.${parts[2]}`;
                setAddressSpace(`${netPrefix}.0/24`);
                setGateway(ip);
                setAddressesToGive(`${netPrefix}.2-${netPrefix}.254`);
            }
        } else {
            setAddressSpace('192.168.100.0/24');
            setGateway('192.168.100.1');
            setAddressesToGive('192.168.100.2-192.168.100.254');
        }
        setDnsServers('8.8.8.8');
        setLeaseTime('00:10:00');
    };

    const handleOpenWizard = () => {
        setWizardStep(1);
        const configuredIp = ipAddresses.find((ip: any) => !ip.disabled);
        const defaultIface = configuredIp ? configuredIp.interfaceName : (interfaces[0]?.name || 'ether1');

        setSelectedIface(defaultIface);
        updateDefaultsFromIface(defaultIface);
        setShowWizard(true);
    };

    const handleIfaceChange = (ifaceName: string) => {
        setSelectedIface(ifaceName);
        updateDefaultsFromIface(ifaceName);
    };

    const handleNext = () => {
        if (wizardStep === 1) {
            if (!getIfaceIpConfig(selectedIface)) {
                return;
            }
        }

        if (wizardStep < 6) {
            setWizardStep(wizardStep + 1);
        } else {
            if (addDhcpServer) {
                addDhcpServer({
                    name: `dhcp${dhcpServers.length + 1}`,
                    interfaceName: selectedIface,
                    interface: selectedIface,
                    addressSpace,
                    gateway,
                    addressesToGiveOut: addressesToGive,
                    addressPool: `dhcp_pool${dhcpServers.length + 1}`,
                    dnsServers,
                    leaseTime,
                    disabled: false
                });
            }
            setShowWizard(false);
        }
    };

    const handleBack = () => {
        if (wizardStep > 1) {
            setWizardStep(wizardStep - 1);
        }
    };

    const currentHasIp = !!getIfaceIpConfig(selectedIface);

    const wizardSubtitles = [
        "Select interface to run DHCP server on",
        "Select network for DHCP addresses",
        "Select gateway for given network",
        "Select pool of ip addresses given out by DHCP server",
        "Select DNS servers",
        "Select lease time"
    ];

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={winToolbarStyle}>
                <button style={winBtnStyle} onClick={handleOpenWizard}>DHCP Setup</button>
                <button style={winBtnStyle} onClick={handleOpenWizard}>+ Add</button>
                <button style={winBtnStyle} onClick={() => selectedServer && removeDhcpServer && removeDhcpServer(selectedServer.id)}>- Remove</button>
                <button style={winBtnStyle} onClick={() => selectedServer && toggleDhcpServer && toggleDhcpServer(selectedServer.id)}>✓ / ✕ Toggle</button>
            </div>

            <div style={{ flexGrow: 1, overflowX: 'auto', overflowY: 'auto', background: 'white', border: '1px solid #7F9DB9' }}>
                <table style={{ ...winTableStyle, minWidth: '400px' }}>
                    <thead>
                        <tr>
                            <th style={thStyle}>Flags</th>
                            <th style={thStyle}>Name</th>
                            <th style={thStyle}>Interface</th>
                            <th style={thStyle}>Lease Time</th>
                            <th style={thStyle}>Address Pool</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dhcpServers.map((srv: any) => {
                            let flag = '';
                            if (srv.disabled) flag += 'X ';

                            return (
                                <tr
                                    key={srv.id}
                                    onClick={() => setSelectedServer(srv)}
                                    style={selectedServer?.id === srv.id ? selectedRowStyle : rowStyle}
                                >
                                    <td style={{ ...tdStyle, fontWeight: 'bold', color: srv.disabled ? 'red' : 'green' }}>{flag}</td>
                                    <td style={tdStyle}>{srv.name}</td>
                                    <td style={tdStyle}>{srv.interfaceName || srv.interface}</td>
                                    <td style={tdStyle}>{srv.leaseTime || '00:10:00'}</td>
                                    <td style={tdStyle}>{srv.addressPool || srv.addressesToGiveOut || 'dhcp_pool1'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* MODAL WIZARD: DHCP SETUP (AUTO-FIT MOBILE) */}
            {showWizard && (
                <div style={modalStyle}>
                    <div style={{ ...dialogStyle, width: '380px', maxWidth: '92vw' }}>
                        {/* Header Dialog */}
                        <div style={dialogHeaderStyle}>
                            <span>DHCP Setup</span>
                            <button onClick={() => setShowWizard(false)} style={{ background: '#C0C0C0', border: '1px solid #FFF', borderBottomColor: '#666', borderRightColor: '#666', fontSize: '9px', cursor: 'pointer', float: 'right' }}>X</button>
                        </div>

                        {/* Subtitle Gray Bar */}
                        <div style={{ background: '#808080', color: 'white', padding: '3px 6px', fontSize: '11px' }}>
                            {wizardSubtitles[wizardStep - 1]}
                        </div>

                        {/* Content Area Per Step */}
                        <div style={{ padding: '15px 10px', fontSize: '11px', background: '#F0F0F0', minHeight: '120px' }}>

                            {/* STEP 1: Pilih Interface */}
                            {wizardStep === 1 && (
                                <div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '15px' }}>
                                        <span style={{ fontWeight: 'bold' }}>DHCP Server Interface:</span>
                                        <select value={selectedIface} onChange={e => handleIfaceChange(e.target.value)} style={{ ...inputStyle, width: '130px' }}>
                                            {interfaces.map((i: any) => (
                                                <option key={i.id || i.name} value={i.name}>{i.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {!currentHasIp && (
                                        <div style={{ border: '1px solid red', background: '#FFF0F0', color: 'red', padding: '8px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                                            The selected interface does not have an IP address.<br /><br />
                                            Please configure an IP address first in IP -&gt; Addresses.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* STEP 2: Address Space */}
                            {wizardStep === 2 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '8px', paddingTop: '15px' }}>
                                    <span style={{ fontWeight: 'bold' }}>DHCP Address Space:</span>
                                    <input type="text" value={addressSpace} onChange={e => setAddressSpace(e.target.value)} style={{ ...inputStyle, width: '160px' }} />
                                </div>
                            )}

                            {/* STEP 3: Gateway */}
                            {wizardStep === 3 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '8px', paddingTop: '15px' }}>
                                    <span style={{ fontWeight: 'bold' }}>Gateway for DHCP Network:</span>
                                    <input type="text" value={gateway} onChange={e => setGateway(e.target.value)} style={{ ...inputStyle, width: '140px' }} />
                                </div>
                            )}

                            {/* STEP 4: Addresses to Give Out */}
                            {wizardStep === 4 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '8px', paddingTop: '15px' }}>
                                    <span style={{ fontWeight: 'bold' }}>Addresses to Give Out:</span>
                                    <input type="text" value={addressesToGive} onChange={e => setAddressesToGive(e.target.value)} style={{ ...inputStyle, width: '170px' }} />
                                </div>
                            )}

                            {/* STEP 5: DNS Servers */}
                            {wizardStep === 5 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '8px', paddingTop: '15px' }}>
                                    <span style={{ fontWeight: 'bold', color: '#0000FF' }}>DNS Servers:</span>
                                    <input type="text" value={dnsServers} onChange={e => setDnsServers(e.target.value)} style={{ ...inputStyle, width: '140px' }} />
                                </div>
                            )}

                            {/* STEP 6: Lease Time */}
                            {wizardStep === 6 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '8px', paddingTop: '15px' }}>
                                    <span style={{ fontWeight: 'bold' }}>Lease Time:</span>
                                    <input type="text" value={leaseTime} onChange={e => setLeaseTime(e.target.value)} style={{ ...inputStyle, width: '120px' }} />
                                </div>
                            )}
                        </div>

                        {/* Bottom Buttons Wizard */}
                        <div style={{ padding: '8px', background: '#E0E0E0', borderTop: '1px solid #A0A0A0', textAlign: 'right' }}>
                            <button
                                onClick={handleBack}
                                disabled={wizardStep === 1}
                                style={{ ...winBtnStyle, marginRight: '4px', opacity: wizardStep === 1 ? 0.5 : 1 }}
                            >
                                Back
                            </button>

                            <button
                                onClick={handleNext}
                                disabled={wizardStep === 1 && !currentHasIp}
                                style={{
                                    ...winBtnStyle,
                                    marginRight: '4px',
                                    fontWeight: 'bold',
                                    opacity: (wizardStep === 1 && !currentHasIp) ? 0.5 : 1
                                }}
                            >
                                Next
                            </button>

                            <button onClick={() => setShowWizard(false)} style={winBtnStyle}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Styling WinBox UI Classic & Mobile Responsive
const desktopContainerStyle: React.CSSProperties = { width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Tahoma, "Segoe UI", sans-serif', backgroundColor: '#F0F0F0', overflow: 'hidden' };
const titleBarStyle: React.CSSProperties = { background: '#D4D0C8', padding: '2px 5px', fontSize: '11px', borderBottom: '1px solid #808080' };
const menuBarStyle: React.CSSProperties = { background: '#F0F0F0', padding: '2px 5px', borderBottom: '1px solid #E0E0E0', display: 'flex', alignItems: 'center' };
const mobileToggleBtnStyle: React.CSSProperties = { marginRight: '10px', padding: '1px 6px', fontSize: '11px', fontWeight: 'bold', background: '#0A246A', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' };
const menuItemStyle: React.CSSProperties = { fontSize: '11px', marginRight: '15px', cursor: 'pointer' };
const toolbarStyle: React.CSSProperties = { background: '#F0F0F0', padding: '3px 6px', borderBottom: '2px solid #A0A0A0', display: 'flex', alignItems: 'center', flexWrap: 'wrap' };
const toolbarBtnStyle: React.CSSProperties = { margin: '0 2px', padding: '2px 6px', fontSize: '11px', background: '#F0F0F0', border: '1px solid #FFF', borderBottomColor: '#A0A0A0', borderRightColor: '#A0A0A0', cursor: 'pointer' };
const sidebarStyle: React.CSSProperties = { background: '#F0F0F0', borderRight: '2px solid #A0A0A0', overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingTop: '2px' };
const sidebarItemStyle: React.CSSProperties = { padding: '5px 8px', fontSize: '11px', cursor: 'pointer', borderBottom: '1px solid transparent' };
const sidebarSubItemStyle: React.CSSProperties = { padding: '4px 8px', fontSize: '11px', cursor: 'pointer', color: '#333' };
const workspaceStyle: React.CSSProperties = { flexGrow: 1, background: '#808080', position: 'relative', overflow: 'hidden' };
const statusBarStyle: React.CSSProperties = { height: '22px', background: '#F0F0F0', borderTop: '1px solid #A0A0A0', display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '11px', color: '#333', overflow: 'hidden' };

const winToolbarStyle: React.CSSProperties = { display: 'flex', gap: '4px', paddingBottom: '4px', flexWrap: 'wrap' };
const winBtnStyle: React.CSSProperties = { padding: '2px 8px', fontSize: '11px', background: '#F0F0F0', border: '1px solid #FFF', borderBottomColor: '#808080', borderRightColor: '#808080', cursor: 'pointer' };
const winTableStyle: React.CSSProperties = { width: '100%', fontSize: '11px', borderCollapse: 'collapse' };
const thStyle: React.CSSProperties = { background: '#E0E0E0', borderRight: '1px solid #A0A0A0', borderBottom: '1px solid #A0A0A0', padding: '3px', textAlign: 'left', fontWeight: 'normal' };
const tdStyle: React.CSSProperties = { padding: '3px 4px', borderRight: '1px dotted #ccc', userSelect: 'none', whiteSpace: 'nowrap' };
const rowStyle: React.CSSProperties = { borderBottom: '1px solid #FFF', cursor: 'default' };
const selectedRowStyle: React.CSSProperties = { ...rowStyle, background: '#0054E3', color: 'white' };

const modalStyle: React.CSSProperties = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 };
const dialogStyle: React.CSSProperties = { background: '#F0F0F0', border: '2px solid #FFF', borderBottomColor: '#666', borderRightColor: '#666', boxShadow: '2px 2px 5px rgba(0,0,0,0.5)', maxWidth: '92vw' };
const dialogHeaderStyle: React.CSSProperties = { background: '#0A246A', color: 'white', padding: '3px 6px', fontSize: '11px', fontWeight: 'bold' };
const inputStyle: React.CSSProperties = { width: '130px', fontSize: '11px', padding: '2px 3px' };