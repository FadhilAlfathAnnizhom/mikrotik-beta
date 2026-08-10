import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';

// Helper untuk mengonversi CIDR (misal /24) ke Subnet Mask (255.255.255.0)
const getSubnetMaskFromCidr = (prefix: number): string => {
    const p = Math.min(Math.max(prefix, 0), 32);
    const mask = [];
    for (let i = 0; i < 4; i++) {
        const n = Math.min(Math.max(p - i * 8, 0), 8);
        mask.push(256 - Math.pow(2, 8 - n));
    }
    return mask.join('.');
};

// Helper untuk mengecek apakah dua IP berada dalam subnet yang sama (/24)
const isSameSubnet = (ip1: string, ip2: string): boolean => {
    if (!ip1 || !ip2) return false;
    const p1 = ip1.trim().split('.');
    const p2 = ip2.trim().split('.');
    if (p1.length !== 4 || p2.length !== 4) return false;
    return p1[0] === p2[0] && p1[1] === p2[1] && p1[2] === p2[2];
};

export const LaptopDesktop: React.FC = () => {
    const storeState = useStore() as any;
    const {
        activeDesktopLaptopId,
        activeLaptopId,
        closeLaptopDesktop,
        nodes,
        edges,
    } = storeState;

    const laptopId = activeDesktopLaptopId || activeLaptopId;
    const laptopNode = nodes?.find((n: any) => n.id === laptopId);

    // Filter koneksi kabel & wireless laptop
    const laptopEdges = (edges || []).filter(
        (edge: any) => edge.source === laptopId || edge.target === laptopId
    );

    const getConnectedNode = (edge: any) => {
        const otherId = edge.source === laptopId ? edge.target : edge.source;
        return nodes?.find((n: any) => n.id === otherId);
    };

    const wifiEdge = laptopEdges.find((edge: any) => {
        const connectedNode = getConnectedNode(edge);
        const edgeType = (edge.data?.type || edge.type || '').toLowerCase();
        const nodeType = (connectedNode?.type || connectedNode?.data?.type || connectedNode?.data?.deviceType || '').toLowerCase();
        const nodeLabel = (connectedNode?.data?.label || '').toLowerCase();

        return (
            edgeType === 'wifi' ||
            nodeType.includes('wifi') ||
            nodeType.includes('accesspoint') ||
            nodeType.includes('ap') ||
            nodeLabel.includes('d-link') ||
            nodeLabel.includes('tp-link') ||
            nodeLabel.includes('access point') ||
            nodeLabel.includes('ap') ||
            nodeLabel.includes('wifi')
        );
    });

    const ethernetEdge = laptopEdges.find((edge: any) => edge.id !== wifiEdge?.id);

    const isPhysicalWifiConnected = Boolean(wifiEdge);
    const isPhysicalEthernetConnected = Boolean(ethernetEdge);

    const connectedWifiNode = wifiEdge ? getConnectedNode(wifiEdge) : null;
    const wifiSsid = connectedWifiNode?.data?.ssid || connectedWifiNode?.data?.label || 'D-Link_Wireless';

    const connectedEthernetNode = ethernetEdge ? getConnectedNode(ethernetEdge) : null;
    const ethernetNetworkName = connectedEthernetNode?.data?.label
        ? `Network (${connectedEthernetNode.data.label})`
        : 'Network';

    // Cari Router di Topology
    const routerNode = nodes?.find((n: any) => n.type === 'routerNode' || n.data?.deviceType === 'router');

    // Ambil data IP Addresses & DHCP Servers dari Router / Store
    const ipAddresses = storeState.ipAddresses || storeState.addresses || routerNode?.data?.ipAddresses || routerNode?.data?.addresses || [];
    const dhcpServers = storeState.dhcpServers || storeState.dhcpServerList || routerNode?.data?.dhcpServers || routerNode?.data?.dhcpServerList || [];
    const routerInterfaces = routerNode?.data?.interfaces || {};

    // Deteksi IP LAN / Subnet dari Router WinBox
    let lanConfig: { gateway: string; subnetMask: string; clientIp: string } | null = null;

    if (Array.isArray(ipAddresses) && ipAddresses.length > 0) {
        const lanAddrObj = ipAddresses.find((item: any) => {
            if (item.disabled) return false;
            const comment = (item.comment || '').toLowerCase();
            const iface = (item.interface || '').toLowerCase();
            return !comment.includes('dhcp-client') && iface !== 'ether1' && !iface.includes('internet');
        }) || ipAddresses.find((item: any) => !item.disabled && !(item.comment || '').toLowerCase().includes('dhcp-client'));

        if (lanAddrObj && lanAddrObj.address) {
            const rawAddr = lanAddrObj.address.trim();
            const [ipPart, cidrStr] = rawAddr.split('/');
            const parts = ipPart.split('.');
            if (parts.length === 4) {
                const cidr = parseInt(cidrStr || '24', 10);
                const gateway = ipPart;
                const clientIp = `${parts[0]}.${parts[1]}.${parts[2]}.2`;
                const subnetMask = getSubnetMaskFromCidr(cidr);
                lanConfig = { gateway, subnetMask, clientIp };
            }
        }
    }

    if (!lanConfig && routerInterfaces) {
        Object.values(routerInterfaces).forEach((iface: any) => {
            if (lanConfig) return;
            const rawAddr = iface?.ip || iface?.address;
            if (rawAddr && rawAddr.includes('/') && !rawAddr.includes('dhcp')) {
                const [ipPart, cidrStr] = rawAddr.split('/');
                const parts = ipPart.split('.');
                if (parts.length === 4) {
                    const cidr = parseInt(cidrStr || '24', 10);
                    const gateway = ipPart;
                    const clientIp = `${parts[0]}.${parts[1]}.${parts[2]}.2`;
                    const subnetMask = getSubnetMaskFromCidr(cidr);
                    lanConfig = { gateway, subnetMask, clientIp };
                }
            }
        });
    }

    // Cek DHCP Server
    let isDhcpServerActive = false;
    if (Array.isArray(dhcpServers) && dhcpServers.length > 0) {
        isDhcpServerActive = dhcpServers.some((s: any) => !s.disabled && s.invalid !== true);
    } else {
        isDhcpServerActive = Boolean(
            storeState.isDhcpConfigured ||
            storeState.dhcpSetup ||
            storeState.dhcpActive ||
            routerNode?.data?.dhcpActive ||
            storeState.dhcpServerCreated
        );
    }

    const hasValidDhcpConnection = Boolean(lanConfig && isDhcpServerActive);

    // --- CEK FIREWALL NAT (MASQUERADE) ---
    const firewallNatRules = storeState.firewallRules?.nat || storeState.natRules || routerNode?.data?.natRules || routerNode?.data?.firewallRules?.nat || [];

    const isNatMasqueradeActive = firewallNatRules.some(
        (rule: any) =>
            !rule.disabled &&
            rule.chain === 'srcnat' &&
            rule.action === 'masquerade'
    ) || Boolean(storeState.isNatConfigured || routerNode?.data?.isNatConfigured);

    // State UI Windows
    const [isStartOpen, setIsStartOpen] = useState(false);
    const [activeWindow, setActiveWindow] = useState<'control-panel' | 'network-sharing' | 'network-connections' | 'chrome' | null>(null);
    const [selectedAdapter, setSelectedAdapter] = useState<'wifi' | 'ethernet' | 'bluetooth'>('wifi');

    const [showAdapterProperties, setShowAdapterProperties] = useState(false);
    const [showIPv4Properties, setShowIPv4Properties] = useState(false);

    const [ipMode, setIpMode] = useState<'dhcp' | 'static'>(laptopNode?.data?.ipMode || 'dhcp');
    const [ipAddress, setIpAddress] = useState(laptopNode?.data?.assignedIp || '');
    const [subnetMask, setSubnetMask] = useState(laptopNode?.data?.subnetMask || '255.255.255.0');
    const [gateway, setGateway] = useState(laptopNode?.data?.gateway || '');
    const [dnsServer, setDnsServer] = useState(laptopNode?.data?.dnsServer || '8.8.8.8');

    // State Google Chrome Engine
    const [chromeSearchInput, setChromeSearchInput] = useState('');
    const [chromeActiveQuery, setChromeActiveQuery] = useState('');
    const [isSpeedTesting, setIsSpeedTesting] = useState(false);
    const [speedResults, setSpeedResults] = useState<{ download: number; upload: number; ping: number } | null>(null);

    useEffect(() => {
        if (laptopNode?.data) {
            setIpMode(laptopNode.data.ipMode || 'dhcp');
            setIpAddress(laptopNode.data.assignedIp || '');
            setSubnetMask(laptopNode.data.subnetMask || '255.255.255.0');
            setGateway(laptopNode.data.gateway || '');
        }
    }, [laptopNode]);

    if (!laptopId || !laptopNode) return null;

    // Validasi Static IP
    const isValidStaticConfig = Boolean(
        ipAddress &&
        gateway &&
        lanConfig &&
        gateway.trim() === lanConfig.gateway.trim() &&
        isSameSubnet(ipAddress, lanConfig.gateway)
    );

    const isPhysicalConnected = isPhysicalWifiConnected || isPhysicalEthernetConnected;
    const hasValidIpConfig = ipMode === 'dhcp' ? hasValidDhcpConnection : isValidStaticConfig;

    // Status Terhubung Lokal Saja (Bisa konek router tapi belum ada NAT)
    const isLocalOnlyConnected = isPhysicalConnected && hasValidIpConfig && !isNatMasqueradeActive;

    // Evaluasi Status Koneksi Internet Penuh (Physical + IP Config + Firewall NAT Masquerade)
    const isNetworkConnected = isPhysicalConnected && hasValidIpConfig && isNatMasqueradeActive;

    // Nilai IP display
    const currentDisplayIp = ipMode === 'dhcp'
        ? (hasValidDhcpConnection ? lanConfig!.clientIp : 'Not connected')
        : ipAddress;

    const currentDisplaySubnet = ipMode === 'dhcp'
        ? (hasValidDhcpConnection ? lanConfig!.subnetMask : '')
        : subnetMask;

    const currentDisplayGateway = ipMode === 'dhcp'
        ? (hasValidDhcpConnection ? lanConfig!.gateway : '')
        : gateway;

    const handleSaveIpConfig = () => {
        useStore.setState((state: any) => ({
            nodes: state.nodes.map((node: any) => {
                if (node.id === laptopId) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            assignedIp: ipMode === 'dhcp' ? lanConfig?.clientIp : ipAddress,
                            ip: ipMode === 'dhcp' ? lanConfig?.clientIp : ipAddress,
                            subnetMask: ipMode === 'dhcp' ? lanConfig?.subnetMask : subnetMask,
                            gateway: ipMode === 'dhcp' ? lanConfig?.gateway : gateway,
                            dnsServer,
                            ipMode,
                        },
                    };
                }
                return node;
            }),
        }));
        setShowIPv4Properties(false);
        setShowAdapterProperties(false);
        alert(`Konfigurasi IP adaptor ${selectedAdapter.toUpperCase()} berhasil diperbarui!`);
    };

    const handleChromeSearchSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!chromeSearchInput.trim()) return;
        setChromeActiveQuery(chromeSearchInput.trim());

        if (!chromeSearchInput.toLowerCase().includes('speedtest')) {
            setSpeedResults(null);
            setIsSpeedTesting(false);
        }
    };

    const startSpeedtest = () => {
        setIsSpeedTesting(true);
        setSpeedResults(null);
        setTimeout(() => {
            const dl = isPhysicalEthernetConnected ? Math.floor(Math.random() * 40) + 80 : Math.floor(Math.random() * 30) + 30;
            const ul = Math.floor(dl * 0.7);
            const ping = isPhysicalEthernetConnected ? Math.floor(Math.random() * 5) + 2 : Math.floor(Math.random() * 15) + 12;
            setSpeedResults({ download: dl, upload: ul, ping });
            setIsSpeedTesting(false);
        }, 2000);
    };

    return (
        <div style={overlayStyle}>
            <div style={laptopContainerStyle}>
                <div style={laptopHeaderStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px' }}>💻</span>
                        <span style={{ fontWeight: 600, fontSize: '12px' }}>
                            {laptopNode.data?.label || 'Laptop'} - Windows 11 Workstation
                        </span>
                    </div>
                    <button onClick={closeLaptopDesktop} style={closeHeaderBtnStyle}>✕ Tutup Desktop</button>
                </div>

                <div style={desktopWorkspaceStyle} onClick={() => setIsStartOpen(false)}>
                    {/* Desktop Icons Grid */}
                    <div style={desktopIconsGridStyle}>
                        <div
                            style={desktopIconStyle}
                            onClick={(e) => { e.stopPropagation(); setActiveWindow('control-panel'); }}
                            onDoubleClick={() => setActiveWindow('control-panel')}
                        >
                            <div style={{ fontSize: '32px' }}>🖥️</div>
                            <span style={iconLabelStyle}>Control Panel</span>
                        </div>

                        <div
                            style={desktopIconStyle}
                            onClick={(e) => { e.stopPropagation(); setActiveWindow('chrome'); }}
                            onDoubleClick={() => setActiveWindow('chrome')}
                        >
                            <div style={{ fontSize: '32px' }}>🌐</div>
                            <span style={iconLabelStyle}>Google Chrome</span>
                        </div>
                    </div>

                    {activeWindow && (
                        <div style={windowFrameStyle} onClick={(e) => e.stopPropagation()}>
                            {/* Window Title Bar */}
                            <div style={windowTitleBarStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '13px' }}>
                                        {activeWindow === 'chrome' ? '🌐' : '🎛️'}
                                    </span>
                                    <span style={{ fontSize: '12px', color: '#1e293b', fontFamily: 'Segoe UI, sans-serif' }}>
                                        {activeWindow === 'control-panel' && 'All Control Panel Items'}
                                        {activeWindow === 'network-sharing' && 'Network and Sharing Center'}
                                        {activeWindow === 'network-connections' && 'Network Connections'}
                                        {activeWindow === 'chrome' && (chromeActiveQuery ? `${chromeActiveQuery} - Google Search` : 'Google Chrome')}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <button style={winControlBtnStyle}>—</button>
                                    <button style={winControlBtnStyle}>☐</button>
                                    <button onClick={() => setActiveWindow(null)} style={{ ...winControlBtnStyle, color: '#000' }}>✕</button>
                                </div>
                            </div>

                            {/* Address Bar / Navigation */}
                            <div style={addressBarStyle}>
                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                    <button
                                        onClick={() => {
                                            if (activeWindow === 'chrome' && chromeActiveQuery) {
                                                setChromeActiveQuery('');
                                            } else if (activeWindow === 'network-connections') {
                                                setActiveWindow('network-sharing');
                                            } else if (activeWindow === 'network-sharing') {
                                                setActiveWindow('control-panel');
                                            }
                                        }}
                                        style={navArrowBtnStyle}
                                    >
                                        ←
                                    </button>
                                    <button style={{ ...navArrowBtnStyle, opacity: 0.5 }}>→</button>
                                    <button style={navArrowBtnStyle} onClick={() => { if (chromeActiveQuery) setChromeActiveQuery(chromeActiveQuery); }}>↺</button>
                                </div>

                                <div style={breadcrumbStyle}>
                                    {activeWindow === 'chrome' ? (
                                        <form onSubmit={handleChromeSearchSubmit} style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                                            <span style={{ color: '#64748b', marginRight: '6px' }}>🔒</span>
                                            <input
                                                type="text"
                                                value={chromeSearchInput}
                                                onChange={(e) => setChromeSearchInput(e.target.value)}
                                                placeholder="https://www.google.com atau ketik penelusuran..."
                                                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '11px' }}
                                            />
                                        </form>
                                    ) : (
                                        <>
                                            <span style={{ cursor: 'pointer' }} onClick={() => setActiveWindow('control-panel')}>Control Panel</span>
                                            <span> › </span>
                                            {activeWindow === 'control-panel' && <span>All Control Panel Items</span>}
                                            {activeWindow === 'network-sharing' && (
                                                <>
                                                    <span style={{ cursor: 'pointer' }} onClick={() => setActiveWindow('control-panel')}>All Control Panel Items</span>
                                                    <span> › </span>
                                                    <span>Network and Sharing Center</span>
                                                </>
                                            )}
                                            {activeWindow === 'network-connections' && (
                                                <>
                                                    <span>Network and Internet</span>
                                                    <span> › </span>
                                                    <span>Network Connections</span>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div style={searchBoxStyle}>
                                    <span style={{ color: '#64748b', fontSize: '11px' }}>🔍</span>
                                    <input
                                        type="text"
                                        placeholder={activeWindow === 'chrome' ? "Cari di Google" : "Search Control Panel"}
                                        value={activeWindow === 'chrome' ? chromeSearchInput : ''}
                                        onChange={(e) => activeWindow === 'chrome' && setChromeSearchInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && activeWindow === 'chrome' && handleChromeSearchSubmit()}
                                        style={searchInputStyle}
                                    />
                                </div>
                            </div>

                            {/* Window Body */}
                            <div style={windowBodyStyle}>
                                {activeWindow === 'control-panel' && (
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                                            <span style={{ fontSize: '13px', color: '#0066cc', fontWeight: 600 }}>Adjust your computer's settings</span>
                                            <span style={{ fontSize: '11px', color: '#475569' }}>View by: <strong style={{ color: '#0f172a' }}>Small icons ▾</strong></span>
                                        </div>

                                        <div style={cpGridStyle}>
                                            <div style={cpItemStyle} onClick={() => setActiveWindow('network-sharing')}>
                                                <span style={{ fontSize: '16px' }}>🌐</span>
                                                <span style={{ color: '#0066cc', textDecoration: 'underline' }}>Network and Sharing Center</span>
                                            </div>
                                            <div style={cpItemStyle}><span>🛡️</span> <span>Windows Defender Firewall</span></div>
                                            <div style={cpItemStyle}><span>🔊</span> <span>Sound</span></div>
                                            <div style={cpItemStyle}><span>⌨️</span> <span>Keyboard</span></div>
                                            <div style={cpItemStyle}><span>🖱️</span> <span>Mouse</span></div>
                                            <div style={cpItemStyle}><span>💻</span> <span>System</span></div>
                                            <div style={cpItemStyle}><span>🕒</span> <span>Date and Time</span></div>
                                            <div style={cpItemStyle}><span>🔋</span> <span>Power Options</span></div>
                                        </div>
                                    </div>
                                )}

                                {/* --- GOOGLE CHROME VIEW --- */}
                                {activeWindow === 'chrome' && (
                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                        {!isNetworkConnected ? (
                                            /* Tampilan No Internet / Dino Page */
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '20px', textAlign: 'center' }}>
                                                <div style={{ fontSize: '64px', marginBottom: '10px' }}>🦖</div>
                                                <h2 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '8px' }}>
                                                    {isLocalOnlyConnected ? 'Terhubung ke Router (Tidak Ada Akses Internet)' : 'Tidak ada koneksi internet'}
                                                </h2>
                                                <p style={{ fontSize: '12px', color: '#64748b', maxWidth: '440px', marginBottom: '16px' }}>
                                                    {isLocalOnlyConnected
                                                        ? 'Laptop sudah terhubung ke router, tetapi belum bisa akses internet karena NAT belum dikonfigurasi. Buat aturan NAT Masquerade di MikroTik (IP -> Firewall -> NAT) untuk mengubah IP LAN menjadi IP WAN.'
                                                        : (ipMode === 'static'
                                                            ? 'Pastikan Default Gateway diisi dengan IP Router dan berada dalam subnet yang sama.'
                                                            : 'Periksa kabel jaringan, Wi-Fi, atau pastikan DHCP Server pada router Mikrotik sudah dikonfigurasi.')}
                                                </p>
                                                <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold', backgroundColor: '#fef2f2', padding: '6px 12px', borderRadius: '4px', border: '1px solid #fca5a5' }}>
                                                    {isLocalOnlyConnected ? 'ERR_NAT_NOT_CONFIGURED' : 'ERR_INTERNET_DISCONNECTED'}
                                                </div>
                                            </div>
                                        ) : !chromeActiveQuery ? (
                                            /* Google Homepage */
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '20px' }}>
                                                <div style={{ fontSize: '56px', fontWeight: 'bold', marginBottom: '24px', fontFamily: 'Segoe UI, sans-serif' }}>
                                                    <span style={{ color: '#4285F4' }}>G</span>
                                                    <span style={{ color: '#EA4335' }}>o</span>
                                                    <span style={{ color: '#FBBC05' }}>o</span>
                                                    <span style={{ color: '#4285F4' }}>g</span>
                                                    <span style={{ color: '#34A853' }}>l</span>
                                                    <span style={{ color: '#EA4335' }}>e</span>
                                                </div>

                                                <form onSubmit={handleChromeSearchSubmit} style={{ width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                                    <div style={{ width: '100%', position: 'relative' }}>
                                                        <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
                                                        <input
                                                            type="text"
                                                            value={chromeSearchInput}
                                                            onChange={(e) => setChromeSearchInput(e.target.value)}
                                                            placeholder="Telusuri Google atau ketik URL..."
                                                            style={{
                                                                width: '100%',
                                                                padding: '12px 20px 12px 44px',
                                                                borderRadius: '24px',
                                                                border: '1px solid #cbd5e1',
                                                                outline: 'none',
                                                                fontSize: '13px',
                                                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                                                            }}
                                                        />
                                                    </div>

                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <button type="submit" style={googleSearchBtnStyle}>Penelusuran Google</button>
                                                        <button type="button" onClick={() => { setChromeSearchInput('speedtest'); setChromeActiveQuery('speedtest'); }} style={googleSearchBtnStyle}>
                                                            Uji Kecepatan Internet
                                                        </button>
                                                    </div>
                                                </form>

                                                <div style={{ marginTop: '30px', fontSize: '11.5px', color: '#16a34a', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span>🟢</span> Terhubung ke Internet ({ipMode === 'dhcp' ? 'DHCP' : 'Static'} IP: {currentDisplayIp})
                                                </div>
                                            </div>
                                        ) : (
                                            /* Google Search Results (SERP) */
                                            <div style={{ padding: '12px 20px', fontFamily: 'Segoe UI, sans-serif' }}>
                                                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                                                    <span
                                                        onClick={() => setChromeActiveQuery('')}
                                                        style={{ fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'sans-serif' }}
                                                    >
                                                        <span style={{ color: '#4285F4' }}>G</span>
                                                        <span style={{ color: '#EA4335' }}>o</span>
                                                        <span style={{ color: '#FBBC05' }}>o</span>
                                                        <span style={{ color: '#4285F4' }}>g</span>
                                                        <span style={{ color: '#34A853' }}>l</span>
                                                        <span style={{ color: '#EA4335' }}>e</span>
                                                    </span>

                                                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                                                        Sekitar 1.420.000 hasil (0,28 detik) untuk <strong>"{chromeActiveQuery}"</strong>
                                                    </div>
                                                </div>

                                                {/* Widget SPEEDTEST */}
                                                {chromeActiveQuery.toLowerCase().includes('speedtest') && (
                                                    <div style={serpWidgetCardStyle}>
                                                        <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#0f172a', marginBottom: '8px' }}>🚀 Uji Kecepatan Internet (Speedtest)</div>
                                                        <div style={{ fontSize: '11.5px', color: '#475569', marginBottom: '12px' }}>
                                                            Periksa kecepatan unduh dan unggah jaringan lokal Anda saat ini.
                                                        </div>

                                                        {speedResults ? (
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                                                                <div>
                                                                    <div style={{ fontSize: '10px', color: '#64748b' }}>DOWNLOAD</div>
                                                                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0284c7' }}>{speedResults.download} <span style={{ fontSize: '11px' }}>Mbps</span></div>
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontSize: '10px', color: '#64748b' }}>UPLOAD</div>
                                                                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#16a34a' }}>{speedResults.upload} <span style={{ fontSize: '11px' }}>Mbps</span></div>
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontSize: '10px', color: '#64748b' }}>PING</div>
                                                                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#d97706' }}>{speedResults.ping} <span style={{ fontSize: '11px' }}>ms</span></div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={startSpeedtest}
                                                                disabled={isSpeedTesting}
                                                                style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                                                            >
                                                                {isSpeedTesting ? 'JALANKAN UJI KECEPATAN...' : 'JALANKAN UJI KECEPATAN'}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Widget IP CHECKER */}
                                                {(chromeActiveQuery.toLowerCase().includes('ip') || chromeActiveQuery.toLowerCase().includes('my ip')) && (
                                                    <div style={serpWidgetCardStyle}>
                                                        <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a', marginBottom: '4px' }}>Alamat IP Publik & Lokal Anda</div>
                                                        <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#2563eb', margin: '4px 0' }}>{currentDisplayIp}</div>
                                                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                                                            Subnet: <strong>{currentDisplaySubnet || '255.255.255.0'}</strong> | Gateway: <strong>{currentDisplayGateway || '-'}</strong> | DNS: <strong>{dnsServer}</strong>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Generic Search Results */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                                                    <div style={serpItemStyle}>
                                                        <div style={{ fontSize: '11px', color: '#475569' }}>https://www.mikrotik.com › wiki › {chromeActiveQuery}</div>
                                                        <a href="#link" onClick={(e) => e.preventDefault()} style={serpTitleStyle}>
                                                            {chromeActiveQuery.toUpperCase()} - Dokumentasi & Panduan Jaringan MikroTik
                                                        </a>
                                                        <div style={{ fontSize: '12px', color: '#334155', marginTop: '2px' }}>
                                                            Pelajari konfigurasi dasar {chromeActiveQuery}, penataan RouterOS, pembuatan DHCP Server, DNS, dan pengatur jaringan komputer terlengkap.
                                                        </div>
                                                    </div>

                                                    <div style={serpItemStyle}>
                                                        <div style={{ fontSize: '11px', color: '#475569' }}>https://id.wikipedia.org › wiki › {chromeActiveQuery}</div>
                                                        <a href="#link" onClick={(e) => e.preventDefault()} style={serpTitleStyle}>
                                                            {chromeActiveQuery} - Wikipedia bahasa Indonesia, ensiklopedia bebas
                                                        </a>
                                                        <div style={{ fontSize: '12px', color: '#334155', marginTop: '2px' }}>
                                                            {chromeActiveQuery} adalah komponen utama dalam arsitektur komputer dan jaringan telekomunikasi modern untuk mentransmisikan paket data secara efisien.
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeWindow === 'network-sharing' && (
                                    <div style={{ display: 'flex', gap: '24px', height: '100%' }}>
                                        <div style={sidebarStyle}>
                                            <span style={sidebarLinkStyle} onClick={() => setActiveWindow('control-panel')}>Control Panel Home</span>
                                            <span style={{ ...sidebarLinkStyle, fontWeight: 'bold' }} onClick={() => setActiveWindow('network-connections')}>
                                                Change adapter settings
                                            </span>
                                            <span style={sidebarLinkStyle}>Change advanced sharing settings</span>
                                            <span style={sidebarLinkStyle}>Media streaming options</span>

                                            <div style={{ marginTop: '30px', fontSize: '11px', color: '#64748b' }}>See also</div>
                                            <span style={sidebarLinkStyle}>Internet Options</span>
                                            <span style={sidebarLinkStyle}>Windows Defender Firewall</span>
                                        </div>

                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ fontSize: '14px', color: '#003399', fontWeight: 600, marginBottom: '16px' }}>
                                                View your basic network information and set up connections
                                            </h3>

                                            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>View your active networks</div>

                                            <div style={activeNetworkBoxStyle}>
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                                    <span style={{ fontSize: '24px' }}>
                                                        {isNetworkConnected ? (isPhysicalWifiConnected ? '📶' : '𖤣') : '❌'}
                                                    </span>
                                                    <div>
                                                        <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#0f172a' }}>
                                                            {isNetworkConnected
                                                                ? (isPhysicalWifiConnected ? wifiSsid : ethernetNetworkName)
                                                                : (isLocalOnlyConnected ? 'Local Network (No Internet)' : 'Unidentified network')}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                                                            {isNetworkConnected ? 'Public network' : (isLocalOnlyConnected ? 'Connected to local gateway only' : 'Not connected to any network')}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '16px', fontSize: '11px', lineHeight: '1.6' }}>
                                                    <div><strong>Access type:</strong> {isNetworkConnected ? 'Internet' : 'No Internet access'}</div>
                                                    <div>
                                                        <strong>Connections:</strong>{' '}
                                                        {isPhysicalWifiConnected && (
                                                            <span
                                                                style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}
                                                                onClick={() => { setSelectedAdapter('wifi'); setShowAdapterProperties(true); }}
                                                            >
                                                                Wi-Fi ({wifiSsid})
                                                            </span>
                                                        )}
                                                        {isPhysicalEthernetConnected && !isPhysicalWifiConnected && (
                                                            <span
                                                                style={{ color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}
                                                                onClick={() => { setSelectedAdapter('ethernet'); setShowAdapterProperties(true); }}
                                                            >
                                                                Ethernet
                                                            </span>
                                                        )}
                                                        {!isPhysicalWifiConnected && !isPhysicalEthernetConnected && (
                                                            <span style={{ color: '#ef4444' }}>None</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ marginTop: '20px' }}>
                                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px' }}>Change your networking settings</div>

                                                <div style={settingOptionStyle}>
                                                    <span style={{ fontSize: '20px' }}>🌐</span>
                                                    <div>
                                                        <div style={{ color: '#0066cc', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>Set up a new connection or network</div>
                                                        <div style={{ fontSize: '11px', color: '#64748b' }}>Set up a broadband, dial-up, or VPN connection; or set up a router or access point.</div>
                                                    </div>
                                                </div>

                                                <div style={settingOptionStyle}>
                                                    <span style={{ fontSize: '20px' }}>🛠️</span>
                                                    <div>
                                                        <div style={{ color: '#0066cc', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>Troubleshoot problems</div>
                                                        <div style={{ fontSize: '11px', color: '#64748b' }}>Diagnose and repair network problems, or get troubleshooting information.</div>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                )}

                                {activeWindow === 'network-connections' && (
                                    <div>
                                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                            <div
                                                style={{
                                                    ...adapterCardStyle,
                                                    backgroundColor: selectedAdapter === 'bluetooth' ? '#e0f2fe' : '#ffffff',
                                                    borderColor: selectedAdapter === 'bluetooth' ? '#0284c7' : '#cbd5e1'
                                                }}
                                                onClick={() => setSelectedAdapter('bluetooth')}
                                                onDoubleClick={() => setShowAdapterProperties(true)}
                                            >
                                                <div style={{ fontSize: '28px', position: 'relative' }}>
                                                    💻<span style={{ position: 'absolute', right: -2, bottom: -2, fontSize: '12px' }}>❌</span>
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a' }}>Bluetooth Network Connection</div>
                                                    <div style={{ fontSize: '10px', color: '#ef4444' }}>Not connected</div>
                                                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Bluetooth Device (Personal Area ...</div>
                                                </div>
                                            </div>

                                            <div
                                                style={{
                                                    ...adapterCardStyle,
                                                    backgroundColor: selectedAdapter === 'ethernet' ? '#e0f2fe' : '#ffffff',
                                                    borderColor: selectedAdapter === 'ethernet' ? '#0284c7' : '#cbd5e1'
                                                }}
                                                onClick={() => setSelectedAdapter('ethernet')}
                                                onDoubleClick={() => setShowAdapterProperties(true)}
                                            >
                                                <div style={{ fontSize: '28px', position: 'relative' }}>
                                                    𖤣
                                                    {(!isPhysicalEthernetConnected || !isNetworkConnected) && (
                                                        <span style={{ position: 'absolute', right: -2, bottom: -2, fontSize: '12px' }}>❌</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a' }}>Ethernet</div>
                                                    <div style={{ fontSize: '10px', color: (isPhysicalEthernetConnected && isNetworkConnected) ? '#16a34a' : '#ef4444', fontWeight: 'bold' }}>
                                                        {(isPhysicalEthernetConnected && isNetworkConnected) ? 'Enabled' : 'Not connected'}
                                                    </div>
                                                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Realtek PCIe GBE Family Controller</div>
                                                </div>
                                            </div>

                                            <div
                                                style={{
                                                    ...adapterCardStyle,
                                                    backgroundColor: selectedAdapter === 'wifi' ? '#e0f2fe' : '#ffffff',
                                                    borderColor: selectedAdapter === 'wifi' ? '#0284c7' : '#cbd5e1'
                                                }}
                                                onClick={() => setSelectedAdapter('wifi')}
                                                onDoubleClick={() => setShowAdapterProperties(true)}
                                            >
                                                <div style={{ fontSize: '28px', position: 'relative' }}>
                                                    📶
                                                    {(!isPhysicalWifiConnected || !isNetworkConnected) && (
                                                        <span style={{ position: 'absolute', right: -2, bottom: -2, fontSize: '12px' }}>❌</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a' }}>Wi-Fi</div>
                                                    <div style={{ fontSize: '10px', color: (isPhysicalWifiConnected && isNetworkConnected) ? '#16a34a' : '#ef4444', fontWeight: (isPhysicalWifiConnected && isNetworkConnected) ? 'bold' : 'normal' }}>
                                                        {(isPhysicalWifiConnected && isNetworkConnected) ? wifiSsid : 'Not connected'}
                                                    </div>
                                                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>MediaTek Wi-Fi 6E MT7902 Wirele...</div>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    )}

                    {showAdapterProperties && (
                        <div style={modalOverlayStyle} onClick={(e) => e.stopPropagation()}>
                            <div style={winDialogStyle}>
                                <div style={winDialogTitleStyle}>
                                    <span>{selectedAdapter === 'wifi' ? 'Wi-Fi' : selectedAdapter === 'ethernet' ? 'Ethernet' : 'Bluetooth'} Properties</span>
                                    <button onClick={() => setShowAdapterProperties(false)} style={dialogCloseBtnStyle}>✕</button>
                                </div>

                                <div style={{ padding: '12px', fontSize: '11px', fontFamily: 'Segoe UI, sans-serif' }}>
                                    <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', marginBottom: '10px' }}>
                                        <span style={{ fontWeight: 'bold', borderBottom: '2px solid #0066cc', paddingBottom: '2px' }}>Networking</span>
                                    </div>

                                    <div style={{ marginBottom: '8px' }}>
                                        <label style={{ color: '#475569', display: 'block', marginBottom: '2px' }}>Connect using:</label>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <input
                                                type="text"
                                                readOnly
                                                value={selectedAdapter === 'wifi' ? 'MediaTek Wi-Fi 6E MT7902 Wireless LAN Card' : 'Realtek PCIe GBE Family Controller'}
                                                style={dialogInputStyle}
                                            />
                                            <button style={dialogBtnStyle}>Configure...</button>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '6px', color: '#334155' }}>This connection uses the following items:</div>

                                    <div style={protocolListBoxStyle}>
                                        <div style={protocolItemStyle}>☑ Client for Microsoft Networks</div>
                                        <div style={protocolItemStyle}>☑ File and Printer Sharing for Microsoft Networks</div>
                                        <div style={protocolItemStyle}>☑ QoS Packet Scheduler</div>
                                        <div
                                            style={{ ...protocolItemStyle, backgroundColor: '#0066cc', color: 'white' }}
                                            onClick={() => setShowIPv4Properties(true)}
                                        >
                                            ☑ Internet Protocol Version 4 (TCP/IPv4)
                                        </div>
                                        <div style={protocolItemStyle}>☐ Microsoft Network Adapter Multiplexor Protocol</div>
                                        <div style={protocolItemStyle}>☑ Microsoft LLDP Protocol Driver</div>
                                        <div style={protocolItemStyle}>☑ Internet Protocol Version 6 (TCP/IPv6)</div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                        <button style={dialogBtnStyle}>Install...</button>
                                        <button style={dialogBtnStyle}>Uninstall</button>
                                        <button style={{ ...dialogBtnStyle, fontWeight: 'bold', marginLeft: 'auto' }} onClick={() => setShowIPv4Properties(true)}>Properties</button>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                                        <button style={{ ...dialogBtnStyle, width: '70px' }} onClick={() => setShowAdapterProperties(false)}>OK</button>
                                        <button style={{ ...dialogBtnStyle, width: '70px' }} onClick={() => setShowAdapterProperties(false)}>Cancel</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {showIPv4Properties && (
                        <div style={modalOverlayStyle} onClick={(e) => e.stopPropagation()}>
                            <div style={{ ...winDialogStyle, width: '380px' }}>
                                <div style={winDialogTitleStyle}>
                                    <span>Internet Protocol Version 4 (TCP/IPv4) Properties</span>
                                    <button onClick={() => setShowIPv4Properties(false)} style={dialogCloseBtnStyle}>✕</button>
                                </div>

                                <div style={{ padding: '12px', fontSize: '11px', fontFamily: 'Segoe UI, sans-serif' }}>
                                    <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', marginBottom: '10px' }}>
                                        <span style={{ fontWeight: 'bold', borderBottom: '2px solid #0066cc', paddingBottom: '2px' }}>General</span>
                                        <span style={{ color: '#64748b' }}>Alternate Configuration</span>
                                    </div>

                                    <p style={{ color: '#475569', fontSize: '10.5px', lineHeight: '1.4', marginBottom: '12px' }}>
                                        You can get IP settings assigned automatically if your network supports this capability. Otherwise, you need to ask your network administrator for the appropriate IP settings.
                                    </p>

                                    <div style={{ marginBottom: '8px' }}>
                                        <label style={radioLabelStyle}>
                                            <input
                                                type="radio"
                                                name="ipMode"
                                                checked={ipMode === 'dhcp'}
                                                onChange={() => setIpMode('dhcp')}
                                            />
                                            Obtain an IP address automatically
                                        </label>

                                        <label style={radioLabelStyle}>
                                            <input
                                                type="radio"
                                                name="ipMode"
                                                checked={ipMode === 'static'}
                                                onChange={() => setIpMode('static')}
                                            />
                                            Use the following IP address:
                                        </label>
                                    </div>

                                    <div style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                                        <div style={formRowStyle}>
                                            <label style={labelStyle}>IP address:</label>
                                            <input
                                                type="text"
                                                disabled={ipMode === 'dhcp'}
                                                value={ipMode === 'dhcp' ? (lanConfig?.clientIp || '') : ipAddress}
                                                onChange={(e) => setIpAddress(e.target.value)}
                                                style={{ ...ipv4InputStyle, backgroundColor: ipMode === 'dhcp' ? '#f1f5f9' : '#ffffff' }}
                                            />
                                        </div>

                                        <div style={formRowStyle}>
                                            <label style={labelStyle}>Subnet mask:</label>
                                            <input
                                                type="text"
                                                disabled={ipMode === 'dhcp'}
                                                value={ipMode === 'dhcp' ? (lanConfig?.subnetMask || '') : subnetMask}
                                                onChange={(e) => setSubnetMask(e.target.value)}
                                                style={{ ...ipv4InputStyle, backgroundColor: ipMode === 'dhcp' ? '#f1f5f9' : '#ffffff' }}
                                            />
                                        </div>

                                        <div style={formRowStyle}>
                                            <label style={labelStyle}>Default gateway:</label>
                                            <input
                                                type="text"
                                                disabled={ipMode === 'dhcp'}
                                                value={ipMode === 'dhcp' ? (lanConfig?.gateway || '') : gateway}
                                                onChange={(e) => setGateway(e.target.value)}
                                                style={{ ...ipv4InputStyle, backgroundColor: ipMode === 'dhcp' ? '#f1f5f9' : '#ffffff' }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '8px' }}>
                                        <label style={radioLabelStyle}>
                                            <input type="radio" name="dnsMode" defaultChecked />
                                            Obtain DNS server address automatically
                                        </label>
                                        <label style={radioLabelStyle}>
                                            <input type="radio" name="dnsMode" />
                                            Use the following DNS server addresses:
                                        </label>
                                    </div>

                                    <div style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                                        <div style={formRowStyle}>
                                            <label style={labelStyle}>Preferred DNS server:</label>
                                            <input
                                                type="text"
                                                value={dnsServer}
                                                onChange={(e) => setDnsServer(e.target.value)}
                                                style={ipv4InputStyle}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '16px' }}>
                                        <button style={{ ...dialogBtnStyle, width: '65px', fontWeight: 'bold' }} onClick={handleSaveIpConfig}>OK</button>
                                        <button style={{ ...dialogBtnStyle, width: '65px' }} onClick={() => setShowIPv4Properties(false)}>Cancel</button>
                                    </div>

                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Start Menu Overlay */}
                {isStartOpen && (
                    <div style={startSearchMenuStyle} onClick={(e) => e.stopPropagation()}>
                        <div style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>
                            <input type="text" defaultValue="control Panel" style={startSearchInputStyle} autoFocus />
                        </div>

                        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Best match</div>

                            <div
                                style={startResultItemStyle}
                                onClick={() => { setActiveWindow('control-panel'); setIsStartOpen(false); }}
                            >
                                <span style={{ fontSize: '24px' }}>🎛️</span>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#0f172a' }}>Control Panel</div>
                                    <div style={{ fontSize: '10px', color: '#64748b' }}>System App</div>
                                </div>
                            </div>

                            <div
                                style={startResultItemStyle}
                                onClick={() => { setActiveWindow('chrome'); setIsStartOpen(false); }}
                            >
                                <span style={{ fontSize: '24px' }}>🌐</span>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#0f172a' }}>Google Chrome</div>
                                    <div style={{ fontSize: '10px', color: '#64748b' }}>Web Browser</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Taskbar */}
                <div style={taskbarStyle}>
                    <div style={taskbarWidgetStyle}>
                        <span>🔥 28°C</span>
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100px' }}>Hari panas yang...</span>
                    </div>

                    <div style={taskbarCenterStyle}>
                        <button
                            style={taskbarIconBtnStyle}
                            onClick={(e) => { e.stopPropagation(); setIsStartOpen(!isStartOpen); }}
                        >
                            🪟
                        </button>

                        <div
                            style={taskbarSearchBarOptionStyle}
                            onClick={(e) => { e.stopPropagation(); setIsStartOpen(true); }}
                        >
                            🔍 Search
                        </div>

                        <button style={taskbarIconBtnStyle} onClick={() => setActiveWindow('control-panel')} title="Control Panel">🎛️</button>
                        <button style={taskbarIconBtnStyle} onClick={() => setActiveWindow('chrome')} title="Google Chrome">🌐</button>
                        <button style={taskbarIconBtnStyle} onClick={() => setActiveWindow('network-sharing')} title="Network Sharing Center">🌐</button>
                        <button style={taskbarIconBtnStyle} onClick={() => setActiveWindow('network-connections')} title="Network Connections">𖤣</button>
                    </div>

                    <div style={systemTrayStyle}>
                        <span>^</span>
                        <span>{isNetworkConnected ? (isPhysicalWifiConnected ? '📶' : '𖤣') : '🌐❌'}</span>
                        <span>🔊</span>
                        <span>🔋</span>
                        <div style={{ textAlign: 'right', fontSize: '10.5px', lineHeight: '1.2' }}>
                            <div>19:09</div>
                            <div>10/08/2026</div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

// Styles
const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '12px'
};

const laptopContainerStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '1020px',
    height: '90vh',
    maxHeight: '680px',
    backgroundColor: '#000000',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
    border: '1px solid #334155',
    position: 'relative'
};

const laptopHeaderStyle: React.CSSProperties = {
    height: '32px',
    backgroundColor: '#18181b',
    color: '#f4f4f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
    borderBottom: '1px solid #27272a'
};

const closeHeaderBtnStyle: React.CSSProperties = {
    background: '#dc2626',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    padding: '3px 10px',
    fontSize: '11px',
    fontWeight: 'bold',
    cursor: 'pointer'
};

const desktopWorkspaceStyle: React.CSSProperties = {
    flex: 1,
    backgroundColor: '#2563eb',
    position: 'relative',
    padding: '16px',
    overflow: 'hidden'
};

const desktopIconsGridStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
};

const desktopIconStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '80px',
    padding: '6px',
    borderRadius: '4px',
    cursor: 'pointer',
    userSelect: 'none'
};

const iconLabelStyle: React.CSSProperties = {
    fontSize: '11px',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: '4px',
    textShadow: '0 1px 2px rgba(0,0,0,0.8)'
};

const windowFrameStyle: React.CSSProperties = {
    position: 'absolute',
    top: '20px',
    left: '20px',
    right: '20px',
    bottom: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 20px 30px rgba(0, 0, 0, 0.3)',
    border: '1px solid #cbd5e1',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
};

const windowTitleBarStyle: React.CSSProperties = {
    height: '32px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px'
};

const winControlBtnStyle: React.CSSProperties = {
    border: 'none',
    background: 'transparent',
    fontSize: '11px',
    width: '32px',
    height: '32px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
};

const addressBarStyle: React.CSSProperties = {
    height: '38px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    gap: '10px'
};

const navArrowBtnStyle: React.CSSProperties = {
    border: 'none',
    background: 'transparent',
    color: '#475569',
    cursor: 'pointer',
    fontSize: '13px'
};

const breadcrumbStyle: React.CSSProperties = {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: '4px',
    padding: '5px 12px',
    fontSize: '11px',
    color: '#334155',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center'
};

const searchBoxStyle: React.CSSProperties = {
    width: '200px',
    backgroundColor: '#f8fafc',
    borderRadius: '4px',
    padding: '4px 8px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: '1px solid #e2e8f0'
};

const searchInputStyle: React.CSSProperties = {
    border: 'none',
    background: 'transparent',
    fontSize: '11px',
    outline: 'none',
    width: '100%'
};

const windowBodyStyle: React.CSSProperties = {
    flex: 1,
    padding: '16px',
    overflowY: 'auto',
    backgroundColor: '#ffffff'
};

const cpGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
    gap: '12px',
    fontSize: '11.5px'
};

const cpItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px',
    cursor: 'pointer'
};

const sidebarStyle: React.CSSProperties = {
    width: '190px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    borderRight: '1px solid #f1f5f9',
    paddingRight: '12px'
};

const sidebarLinkStyle: React.CSSProperties = {
    fontSize: '11px',
    color: '#0066cc',
    cursor: 'pointer',
    textDecoration: 'none'
};

const activeNetworkBoxStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    padding: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
};

const settingOptionStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '16px'
};

const adapterCardStyle: React.CSSProperties = {
    width: '260px',
    border: '1px solid #cbd5e1',
    borderRadius: '4px',
    padding: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer'
};

const modalOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
};

const winDialogStyle: React.CSSProperties = {
    width: '360px',
    backgroundColor: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    overflow: 'hidden'
};

const winDialogTitleStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    padding: '8px 12px',
    fontSize: '11.5px',
    fontWeight: 'bold',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#1e293b'
};

const dialogCloseBtnStyle: React.CSSProperties = {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '11px',
    color: '#64748b'
};

const dialogInputStyle: React.CSSProperties = {
    flex: 1,
    padding: '3px 6px',
    fontSize: '11px',
    border: '1px solid #cbd5e1',
    borderRadius: '2px',
    backgroundColor: '#f1f5f9'
};

const protocolListBoxStyle: React.CSSProperties = {
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    height: '110px',
    overflowY: 'auto',
    borderRadius: '2px'
};

const protocolItemStyle: React.CSSProperties = {
    padding: '3px 6px',
    fontSize: '10.5px',
    cursor: 'pointer'
};

const dialogBtnStyle: React.CSSProperties = {
    padding: '3px 10px',
    fontSize: '11px',
    borderRadius: '3px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    cursor: 'pointer'
};

const radioLabelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '10.5px',
    marginBottom: '4px',
    cursor: 'pointer',
    color: '#0f172a'
};

const formRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
};

const labelStyle: React.CSSProperties = {
    fontSize: '10.5px',
    color: '#334155'
};

const ipv4InputStyle: React.CSSProperties = {
    width: '150px',
    padding: '2px 6px',
    fontSize: '10.5px',
    border: '1px solid #cbd5e1',
    borderRadius: '2px'
};

const taskbarStyle: React.CSSProperties = {
    height: '48px',
    backgroundColor: '#f3f3f3',
    borderTop: '1px solid #e5e5e5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
    fontFamily: 'Segoe UI, sans-serif'
};

const taskbarWidgetStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: '#334155',
    width: '180px'
};

const taskbarCenterStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
};

const taskbarIconBtnStyle: React.CSSProperties = {
    border: 'none',
    background: 'transparent',
    fontSize: '18px',
    width: '38px',
    height: '38px',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};

const taskbarSearchBarOptionStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e5e5',
    borderRadius: '18px',
    padding: '5px 16px',
    fontSize: '12px',
    color: '#64748b',
    cursor: 'pointer',
    width: '140px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
};

const systemTrayStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '11px',
    color: '#334155',
    width: '180px',
    justifyContent: 'flex-end'
};

const startSearchMenuStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '54px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '480px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    border: '1px solid #cbd5e1',
    zIndex: 500,
    overflow: 'hidden'
};

const startSearchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 16px',
    borderRadius: '20px',
    border: '1px solid #0066cc',
    fontSize: '12px',
    outline: 'none'
};

const startResultItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px',
    borderRadius: '6px',
    cursor: 'pointer',
    backgroundColor: '#f1f5f9'
};

const googleSearchBtnStyle: React.CSSProperties = {
    padding: '8px 16px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#334155',
    cursor: 'pointer'
};

const serpWidgetCardStyle: React.CSSProperties = {
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '14px',
    marginBottom: '16px',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
};

const serpItemStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
};

const serpTitleStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a0dab',
    textDecoration: 'none',
    cursor: 'pointer'
};