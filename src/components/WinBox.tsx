import { useState, useEffect } from 'react';
import { useStore, type RouterData } from '../store/useStore';

export const WinBox = () => {
  const { isWinBoxOpen, closeWinBox, discoveredNeighbors, routerData, validateTopology, login, isLoggedIn } = useStore();

  const [connectTo, setConnectTo] = useState('');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [selectedMac, setSelectedMac] = useState<string | null>(null);

  const [connectStatus, setConnectStatus] = useState<string>('');
  const [isConnectReady, setIsConnectReady] = useState<boolean>(false);

  // Memicu sinkronisasi IP Internet Asli saat WinBox dibuka
  useEffect(() => {
    if (isWinBoxOpen) {
      validateTopology();
    }
  }, [isWinBoxOpen]);

  // Real-time Connect To Validation
  useEffect(() => {
    if (connectTo === '') {
      setConnectStatus('');
      setIsConnectReady(false);
      return;
    }

    if (connectTo === routerData.macAddress || connectTo === routerData.ipAddress) {
      if (discoveredNeighbors.length > 0) {
        setConnectStatus('Ready');
        setIsConnectReady(true);
      } else {
        setConnectStatus('Router not found');
        setIsConnectReady(false);
      }
    } else {
      setConnectStatus('Router not found');
      setIsConnectReady(false);
    }
  }, [connectTo, discoveredNeighbors, routerData]);

  if (!isWinBoxOpen) return null;

  // Render Halaman Dalam RouterOS Jika Berhasil Login
  if (isLoggedIn) {
    return (
      <div style={modalOverlayStyle}>
        <div style={winboxWindowStyle}>
          <div style={headerStyle}>
            <span>admin@{routerData.macAddress} (MikroTik) - WinBox</span>
            <button onClick={closeWinBox} style={closeBtnStyle}>X</button>
          </div>
          <div style={{ padding: '60px', textAlign: 'center', flexGrow: 1, background: '#808080' }}>
            <h2 style={{ color: 'white', textShadow: '1px 1px 2px black' }}>Welcome to MikroTik RouterOS</h2>
            <h3 style={{ color: 'white', textShadow: '1px 1px 2px black' }}>Desktop Simulation</h3>
            <p style={{ color: '#E0E0E0' }}>Phase 2: Configuration Coming Soon...</p>
          </div>
        </div>
      </div>
    );
  }

  // Interaksi Discovery
  const handleSingleClick = (mac: string) => {
    setSelectedMac(mac);
  };

  const handleDoubleClick = (mac: string) => {
    setSelectedMac(mac);
    setConnectTo(mac);
  };

  const handleConnect = () => {
    const success = login(connectTo, username, password);
    if (!success) {
      setConnectStatus('invalid username or password');
      setIsConnectReady(false);
    }
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={winboxWindowStyle}>
        <div style={headerStyle}>
          <span>WinBox (64bit) v3.21 (updated-list)</span>
          <button onClick={closeWinBox} style={closeBtnStyle}>X</button>
        </div>

        <div style={formSectionStyle}>
          <table style={{ fontSize: '12px' }}>
            <tbody>
              <tr>
                <td style={labelStyle}>Connect To:</td>
                <td><input type="text" value={connectTo} onChange={e => setConnectTo(e.target.value)} style={inputStyle} /></td>
                <td rowSpan={3} style={{ paddingLeft: '30px', verticalAlign: 'top' }}>
                  <button onClick={handleConnect} disabled={!isConnectReady} style={isConnectReady ? btnReadyStyle : btnDisabledStyle}>Connect</button><br />
                  <div style={connectStatusStyle(isConnectReady, connectStatus)}>{connectStatus}</div>
                </td>
              </tr>
              <tr>
                <td style={labelStyle}>Login:</td>
                <td><input type="text" value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} /></td>
              </tr>
              <tr>
                <td style={labelStyle}>Password:</td>
                <td><input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} /></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={dividerStyle}></div>

        <div style={discoverySectionStyle}>
          <div style={{ display: 'flex' }}>
            <div style={inactiveTabStyle}>Managed</div>
            <div style={activeTabStyle}>Neighbors</div>
          </div>

          <div style={{ background: '#F0F0F0', borderTop: 'none', padding: '5px' }}>
            <button onClick={validateTopology} style={refreshBtnStyle}>
              <span style={{ fontSize: '14px', marginRight: '4px' }}>⟳</span> Refresh
            </button>
          </div>

          <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead style={theadStyle}>
                <tr>
                  <th style={thStyle}>MAC Address</th>
                  <th style={thStyle}>IP Address</th>
                  <th style={thStyle}>Identity</th>
                  <th style={thStyle}>Version</th>
                  <th style={thStyle}>Board</th>
                  <th style={thStyle}>Uptime</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {discoveredNeighbors.map((router: RouterData) => {
                  const isSelected = selectedMac === router.macAddress;
                  return (
                    <tr
                      key={router.macAddress}
                      onClick={() => handleSingleClick(router.macAddress)}
                      onDoubleClick={() => handleDoubleClick(router.macAddress)}
                      style={isSelected ? selectedRowStyle : rowStyle}
                    >
                      <td style={tdStyle}>{router.macAddress}</td>
                      <td style={tdStyle}>{router.ipAddress}</td>
                      <td style={tdStyle}>{router.identity}</td>
                      <td style={tdStyle}>{router.version}</td>
                      <td style={tdStyle}>{router.board}</td>
                      <td style={tdStyle}>{router.uptime}</td>
                      <td style={{ ...tdStyle, color: 'green', fontWeight: 'bold' }}>{router.status}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={statusBarStyle}>
          Neighbors Found : {discoveredNeighbors.length}
        </div>
      </div>
    </div>
  );
};

// Styling Windows Classic
const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const winboxWindowStyle: React.CSSProperties = { width: '680px', height: '420px', background: '#F0F0F0', border: '2px solid #A0A0A0', borderTopColor: '#FFF', borderLeftColor: '#FFF', boxShadow: '2px 2px 5px rgba(0,0,0,0.3)', fontFamily: 'Tahoma, "Segoe UI", sans-serif', display: 'flex', flexDirection: 'column' };
const headerStyle: React.CSSProperties = { background: 'linear-gradient(90deg, #0A246A 0%, #A6CAF0 100%)', color: 'white', padding: '4px 6px', fontSize: '12px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', userSelect: 'none' };
const closeBtnStyle: React.CSSProperties = { background: '#C0C0C0', border: '1px solid #FFF', borderBottomColor: '#666', borderRightColor: '#666', fontSize: '10px', cursor: 'pointer', padding: '0 5px', fontWeight: 'bold' };
const formSectionStyle: React.CSSProperties = { padding: '15px 10px', background: '#F0F0F0' };
const labelStyle: React.CSSProperties = { textAlign: 'right', paddingRight: '10px', color: '#000' };
const inputStyle: React.CSSProperties = { width: '220px', border: '1px solid #A0A0A0', borderTopColor: '#666', borderLeftColor: '#666', padding: '3px 5px', fontSize: '12px' };
const btnReadyStyle: React.CSSProperties = { width: '90px', padding: '4px', background: '#F0F0F0', border: '2px solid #FFF', borderBottomColor: '#A0A0A0', borderRightColor: '#A0A0A0', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', outline: '1px solid black' };
const btnDisabledStyle: React.CSSProperties = { ...btnReadyStyle, color: '#A0A0A0', cursor: 'default', outline: 'none' };
const connectStatusStyle = (isReady: boolean, status: string): React.CSSProperties => ({ fontSize: '11px', marginTop: '4px', color: status.includes('invalid') || !isReady ? 'red' : 'green', fontStyle: 'italic', textAlign: 'center' });
const dividerStyle: React.CSSProperties = { height: '2px', background: '#A0A0A0', borderBottom: '1px solid #FFF', margin: '5px 2px' };
const discoverySectionStyle: React.CSSProperties = { padding: '5px 10px 10px 10px', background: '#F0F0F0', flexGrow: 1, display: 'flex', flexDirection: 'column' };
const activeTabStyle: React.CSSProperties = { padding: '3px 12px', border: '1px solid #A0A0A0', borderBottom: 'none', background: '#F0F0F0', fontSize: '12px', cursor: 'default', marginTop: '2px', zIndex: 2, position: 'relative' };
const inactiveTabStyle: React.CSSProperties = { padding: '3px 12px', border: '1px solid #A0A0A0', background: '#E0E0E0', fontSize: '12px', cursor: 'pointer', marginRight: '2px', marginTop: '4px', borderBottom: '1px solid #A0A0A0' };
const refreshBtnStyle: React.CSSProperties = { padding: '2px 8px', background: '#F0F0F0', border: '1px solid #FFF', borderBottomColor: '#A0A0A0', borderRightColor: '#A0A0A0', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center' };
const tableContainerStyle: React.CSSProperties = { flexGrow: 1, overflowY: 'scroll', border: '1px solid #A0A0A0', borderTopColor: '#666', borderLeftColor: '#666', background: 'white', marginTop: '5px' };
const tableStyle: React.CSSProperties = { width: '100%', fontSize: '11px', borderCollapse: 'collapse' };
const theadStyle: React.CSSProperties = { background: '#E0E0E0', position: 'sticky', top: 0, zIndex: 1 };
const thStyle: React.CSSProperties = { borderRight: '1px solid #A0A0A0', borderBottom: '1px solid #A0A0A0', padding: '4px', textAlign: 'left', fontWeight: 'normal' };
const tdStyle: React.CSSProperties = { padding: '3px 5px', borderRight: '1px dotted #ccc', userSelect: 'none' };
const rowStyle: React.CSSProperties = { borderBottom: '1px solid #FFF', cursor: 'default' };
const selectedRowStyle: React.CSSProperties = { ...rowStyle, background: '#0054E3', color: 'white' };
const statusBarStyle: React.CSSProperties = { borderTop: '1px solid #A0A0A0', padding: '3px 10px', fontSize: '11px', color: '#333', background: '#F0F0F0', borderBottom: '1px solid #FFF' };