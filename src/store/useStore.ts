import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import type { Node, Edge, Connection, NodeChange, EdgeChange } from 'reactflow';
import { calculateDhcpDefaults } from '../utils/ipUtils';

// --- DHCP SERVER & LEASE ENGINE TYPES ---
export interface DhcpServer {
  id: string;
  name: string;
  interface: string;
  addressSpace: string;
  gateway: string;
  addressesToGiveOut: string;
  dnsServers: string;
  leaseTime: string;
  status: 'running' | 'disabled';
}

export interface LaptopDesktopState {
  isOpen: boolean;
  activeWindow: string | null;
  minimizedWindows: string[];
  startMenuOpen: boolean;
  windowPosition: { x: number; y: number; width: number; height: number; isMaximized: boolean };
}

export interface DhcpLease {
  id: string;
  address: string;
  macAddress: string;
  server: string;
  hostname: string;
  status: 'bound' | 'waiting';
  expiresIn: string;
}

export type RouterData = {
  macAddress: string;
  ipAddress: string;
  identity: string;
  version: string;
  board: string;
  uptime: string;
  status: string;
  username: string;
  password: string;
};

export type DesktopWindow = {
  id: string;
  title: string;
  x: number;
  y: number;
  z: number;
};

// --- INTERFACE ENGINE TYPES ---
export type NetworkInterface = {
  id: string;
  name: string;
  type: string;
  actualMtu: number;
  l2Mtu: number;
  macAddress: string;
  arp: string;
  rx: number;
  tx: number;
  disabled: boolean;
  comment: string;
  isLinkUp: boolean;
};

// --- IP ADDRESS ENGINE TYPES ---
export type IPAddress = {
  id: string;
  address: string;
  network: string;
  interfaceName: string;
  comment: string;
  isDynamic: boolean;
  disabled: boolean;
};

// --- DHCP CLIENT ENGINE TYPES ---
export type DHCPClient = {
  id: string;
  interfaceName: string;
  usePeerDNS: boolean;
  addDefaultRoute: boolean;
  defaultRouteDistance: number;
  status: 'Searching...' | 'Bound' | 'Stopped';
  address: string;
  gateway: string;
  dns: string;
  expiresAfter: string;
  comment: string;
  disabled: boolean;
};

export interface SimulatorState {
  nodes: Node[];
  edges: Edge[];
  topologyStatus: string;

  isTopologyValid: boolean;
  routerData: RouterData;
  discoveredNeighbors: RouterData[];

  isWinBoxOpen: boolean;
  isLoggedIn: boolean;
  currentScreen: 'topology' | 'desktop';
  desktopWindows: DesktopWindow[];
  activeWindowZIndex: number;

  interfaces: NetworkInterface[];
  ipAddresses: IPAddress[];
  dhcpClients: DHCPClient[];
  hasInternet: boolean;

  dhcpServers: DhcpServer[];
  dhcpLeases: DhcpLease[];

  // --- FIREWALL ENGINE TYPES ---
  firewallRules?: any;
  isNatConfigured?: boolean;
  isInternetConnected?: boolean; // <-- Tambahan untuk status koneksi internet laptop
  addFirewallNatRule?: (rule: any) => void;
  removeFirewallNatRule?: (id: string) => void;

  // --- ENGINE LAPTOP DESKTOP SIMULATOR ---
  activeDesktopLaptopId: string | null;
  activeLaptopId?: string | null; // Alias kompatibilitas
  laptopDesktopStates: Record<string, LaptopDesktopState>;
  mikrotikConfig?: any;
  dlinkConfig?: any;

  // Actions Topology & WinBox
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  validateTopology: () => void;
  runDiscoveryEngine: (isValid: boolean) => void;
  openWinBox: () => void;
  closeWinBox: () => void;
  login: (connectTo: string, user: string, pass: string) => boolean;
  logout: () => void;
  openDesktopWindow: (title: string) => void;
  closeDesktopWindow: (id: string) => void;
  focusDesktopWindow: (id: string) => void;

  updateInterface: (id: string, updates: Partial<NetworkInterface>) => void;
  renameInterface: (id: string, newName: string) => void;
  toggleInterface: (id: string, disabled: boolean) => void;
  addIPAddress: (ipData: { address: string; interfaceName: string; comment: string }) => { success: boolean; message?: string };
  toggleIPAddress: (id: string) => void;
  removeIPAddress: (id: string) => void;
  addDHCPClient: (dhcpData: { interfaceName: string; usePeerDNS: boolean; addDefaultRoute: boolean; defaultRouteDistance: number; comment: string }) => { success: boolean; message?: string };
  toggleDHCPClient: (id: string) => void;
  removeDHCPClient: (id: string) => void;
  tickTraffic: () => void;

  addDhcpServer: (serverData: Omit<DhcpServer, 'id'>) => { success: boolean; message?: string };
  toggleDhcpServer: (id: string) => void;
  removeDhcpServer: (id: string) => void;
  assignDhcpToClients: () => void;

  activeDLinkConfigId: string | null;
  contextMenuNode: { id: string; x: number; y: number } | null;
  openDLinkConfig: (id: string) => void;
  closeDLinkConfig: () => void;
  setContextMenuNode: (data: { id: string; x: number; y: number } | null) => void;
  duplicateNode: (id: string) => void;
  deleteNode: (id: string) => void;
  renameNode: (id: string, newLabel: string) => void;

  openLaptopDesktop: (id: string) => void;
  closeLaptopDesktop: () => void;
  toggleStartMenu: (id: string) => void;
  openLaptopWindow: (laptopId: string, windowId: string) => void;
  closeLaptopWindow: (laptopId: string, windowId: string) => void;
  minimizeLaptopWindow: (laptopId: string, windowId: string) => void;
  restoreLaptopWindow: (laptopId: string, windowId: string) => void;
  duplicateLaptopNode: (id: string) => void;
  renameNodeLabel: (id: string, newLabel: string) => void;

  // Actions Reset Topologi & Konfigurasi
  resetTopology: () => void;
  resetAll: () => void;
}

const generateMAC = () => "XX:XX:XX:XX:XX:XX".replace(/X/g, () => "0123456789ABCDEF".charAt(Math.floor(Math.random() * 16)));

export const calculateNetwork = (cidr: string): string => {
  try {
    const [ip, maskStr] = cidr.split('/');
    if (!ip || !maskStr) return ip || '';
    const mask = parseInt(maskStr, 10);
    if (isNaN(mask) || mask < 0 || mask > 32) return ip;

    const ipOctets = ip.split('.').map(Number);
    if (ipOctets.length !== 4 || ipOctets.some(o => isNaN(o) || o < 0 || o > 255)) return ip;

    const ipNum = ((ipOctets[0] << 24) >>> 0) + (ipOctets[1] << 16) + (ipOctets[2] << 8) + ipOctets[3];
    const maskNum = mask === 0 ? 0 : ((0xFFFFFFFF << (32 - mask)) >>> 0);
    const netNum = (ipNum & maskNum) >>> 0;

    return [
      (netNum >>> 24) & 255,
      (netNum >>> 16) & 255,
      (netNum >>> 8) & 255,
      netNum & 255
    ].join('.');
  } catch {
    return cidr;
  }
};

// Utility Fetch Data ISP Asli Pengguna dengan Penyesuaian Kelas IP & Otomatisasi IPv4
export const fetchRealISPConfig = async () => {
  try {
    // 1. Ambil Alamat IPv4 Asli
    const ipRes = await fetch('https://api4.ipify.org?format=json');
    if (!ipRes.ok) throw new Error('Failed to fetch IPv4');
    const ipData = await ipRes.json();
    const publicIp = ipData.ip; // Dijamin format IPv4 (e.g., 180.250.x.x atau 36.72.x.x)

    // 2. Ambil Nama ISP
    let ispName = 'Real ISP';
    try {
      const infoRes = await fetch('https://ipapi.co/json/');
      const infoData = await infoRes.json();
      if (infoData.org || infoData.asn) {
        ispName = infoData.org || infoData.asn;
      }
    } catch {
      // Fallback jika API ISP terhalang
    }

    // 3. Deteksi Kelas IP berdasarkan Oktet Pertama (Classful Network)
    const parts = publicIp.split('.').map(Number);
    const firstOctet = parts[0];

    let prefix = '/24';
    let gateway = `${parts[0]}.${parts[1]}.${parts[2]}.1`;

    if (firstOctet >= 1 && firstOctet <= 127) {
      // Kelas A
      prefix = '/8';
      gateway = `${parts[0]}.0.0.1`;
    } else if (firstOctet >= 128 && firstOctet <= 191) {
      // Kelas B
      prefix = '/16';
      gateway = `${parts[0]}.${parts[1]}.0.1`;
    } else if (firstOctet >= 192 && firstOctet <= 223) {
      // Kelas C
      prefix = '/24';
      gateway = `${parts[0]}.${parts[1]}.${parts[2]}.1`;
    }

    return {
      ip: `${publicIp}${prefix}`,
      gateway: gateway,
      dns: '8.8.8.8, 1.1.1.1',
      ispName: ispName
    };
  } catch (error) {
    // Fallback default jika offline
    return {
      ip: '192.168.18.50/24',
      gateway: '192.168.18.1',
      dns: '192.168.18.1, 8.8.8.8',
      ispName: 'Default ISP'
    };
  }
};

const initialMAC = generateMAC();

export const useStore = create<SimulatorState>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      topologyStatus: 'Topology Invalid',
      isTopologyValid: false,
      routerData: {
        macAddress: initialMAC,
        ipAddress: '192.168.1.10',
        identity: 'MikroTik',
        version: 'RouterOS 7.18',
        board: 'RB941-2nD',
        uptime: '00:00:12',
        status: 'Online',
        username: 'admin',
        password: '',
      },
      discoveredNeighbors: [],

      isWinBoxOpen: false,
      isLoggedIn: false,
      currentScreen: 'topology',
      desktopWindows: [],
      activeWindowZIndex: 10,

      interfaces: [
        { id: 'if-1', name: 'ether1', type: 'ether', actualMtu: 1500, l2Mtu: 1598, macAddress: initialMAC, arp: 'enabled', rx: 0, tx: 0, disabled: false, comment: 'WAN Port', isLinkUp: false },
        { id: 'if-2', name: 'ether2', type: 'ether', actualMtu: 1500, l2Mtu: 1598, macAddress: generateMAC(), arp: 'enabled', rx: 0, tx: 0, disabled: false, comment: 'LAN Port', isLinkUp: false },
        { id: 'if-3', name: 'ether3', type: 'ether', actualMtu: 1500, l2Mtu: 1598, macAddress: generateMAC(), arp: 'enabled', rx: 0, tx: 0, disabled: false, comment: '', isLinkUp: false },
        { id: 'if-4', name: 'ether4', type: 'ether', actualMtu: 1500, l2Mtu: 1598, macAddress: generateMAC(), arp: 'enabled', rx: 0, tx: 0, disabled: false, comment: '', isLinkUp: false },
      ],
      ipAddresses: [],
      dhcpClients: [],
      hasInternet: false,

      dhcpServers: [],
      dhcpLeases: [],

      // --- FIREWALL INITIAL STATE & ACTIONS ---
      firewallRules: { nat: [], filter: [], mangle: [] },
      isNatConfigured: false,
      isInternetConnected: false, // <-- Initial state default untuk koneksi internet laptop
      addFirewallNatRule: (rule) => {
        set((state) => ({
          firewallRules: {
            ...state.firewallRules,
            nat: [...(state.firewallRules?.nat || []), rule]
          },
          isNatConfigured: true,
          isInternetConnected: true
        }));
      },
      removeFirewallNatRule: (id) => {
        set((state) => {
          const remainingNat = (state.firewallRules?.nat || []).filter((r: any) => r.id !== id);
          const hasNatRules = remainingNat.length > 0;
          return {
            firewallRules: {
              ...state.firewallRules,
              nat: remainingNat
            },
            isNatConfigured: hasNatRules,
            isInternetConnected: hasNatRules
          };
        });
      },

      activeDLinkConfigId: null,
      contextMenuNode: null,

      activeDesktopLaptopId: null,
      activeLaptopId: null,
      laptopDesktopStates: {},

      onNodesChange: (changes) => {
        set({ nodes: applyNodeChanges(changes, get().nodes) });
        get().validateTopology();
      },
      onEdgesChange: (changes) => {
        set({ edges: applyEdgeChanges(changes, get().edges) });
        get().validateTopology();
      },
      onConnect: (connection) => {
        set({ edges: addEdge(connection, get().edges) });
        get().validateTopology();
      },

      validateTopology: () => {
        const { nodes, edges, interfaces } = get();
        const isp = nodes.find((n) => n.type === 'ispNode');
        const router = nodes.find((n) => n.type === 'routerNode');
        const laptop = nodes.find((n) => n.type === 'laptopNode');
        const switchNode = nodes.find((n) => n.type === 'switchNode');

        let isValid = false;
        let ether1Up = false;
        let ether2Up = false;

        if (router) {
          if (isp) {
            ether1Up = edges.some(e =>
              (e.source === isp.id && e.target === router.id && e.targetHandle === 'ether1') ||
              (e.target === isp.id && e.source === router.id && e.sourceHandle === 'ether1')
            );
          }

          if (laptop) {
            const directLan = edges.some(e =>
              (e.source === router.id && e.target === laptop.id && e.sourceHandle === 'ether2') ||
              (e.target === router.id && e.source === laptop.id && e.targetHandle === 'ether2')
            );

            let switchLan = false;
            if (switchNode) {
              const routerToSwitch = edges.some(e =>
                (e.source === router.id && e.target === switchNode.id && e.sourceHandle === 'ether2') ||
                (e.target === router.id && e.source === switchNode.id && e.targetHandle === 'ether2')
              );
              const switchToLaptop = edges.some(e =>
                (e.source === switchNode.id && e.target === laptop.id) ||
                (e.target === switchNode.id && e.source === laptop.id)
              );
              switchLan = routerToSwitch && switchToLaptop;
            }

            ether2Up = directLan || switchLan;
          }

          isValid = ether1Up && ether2Up;
        }

        const updatedInterfaces = interfaces.map(iface => {
          if (iface.id === 'if-1') return { ...iface, isLinkUp: ether1Up };
          if (iface.id === 'if-2') return { ...iface, isLinkUp: ether2Up };
          return { ...iface, isLinkUp: false };
        });

        set({
          interfaces: updatedInterfaces,
          isTopologyValid: isValid,
          topologyStatus: isValid ? 'Topology Complete' : 'Topology Invalid'
        });

        const updatedNodes = get().nodes.map((node) => {
          if (node.type === 'dlinkNode') {
            const isConnectedToNetwork = get().edges.some((e) => {
              const isSource = e.source === node.id;
              const otherId = isSource ? e.target : e.source;
              const otherNode = get().nodes.find((n) => n.id === otherId);
              return (
                otherNode &&
                (otherNode.type === 'routerNode' || otherNode.type === 'switchNode')
              );
            });

            return {
              ...node,
              data: {
                ...node.data,
                isOnline: isConnectedToNetwork,
              },
            };
          }
          return node;
        });

        set({ nodes: updatedNodes });

        get().runDiscoveryEngine(isValid);
        get().assignDhcpToClients();
      },

      runDiscoveryEngine: async (isValid) => {
        const { routerData } = get();
        if (isValid) {
          try {
            const realISP = await fetchRealISPConfig();
            const cleanIp = realISP.ip.split('/')[0]; // Mengambil IPv4 murni (tanpa subnet mask /24)

            const updatedRouterData = {
              ...routerData,
              ipAddress: cleanIp,
            };

            set({
              routerData: updatedRouterData,
              discoveredNeighbors: [updatedRouterData],
            });
          } catch (error) {
            set({ discoveredNeighbors: [routerData] });
          }
        } else {
          set({ discoveredNeighbors: [] });
        }
      },

      openWinBox: () => set({ isWinBoxOpen: true }),
      closeWinBox: () => set({ isWinBoxOpen: false }),

      login: (connectTo, user, pass) => {
        const { routerData, isTopologyValid } = get();
        if (isTopologyValid &&
          (connectTo === routerData.macAddress || connectTo === routerData.ipAddress) &&
          user === routerData.username &&
          pass === routerData.password) {

          set({
            isLoggedIn: true,
            currentScreen: 'desktop',
            isWinBoxOpen: false
          });
          return true;
        }
        return false;
      },
      logout: () => set({
        isLoggedIn: false,
        currentScreen: 'topology',
        desktopWindows: []
      }),

      openDesktopWindow: (title) => {
        const { desktopWindows, activeWindowZIndex } = get();
        if (desktopWindows.find(w => w.title === title)) return;

        const newZ = activeWindowZIndex + 1;
        const newWindow: DesktopWindow = {
          id: `win-${Date.now()}`,
          title,
          x: 40 + (desktopWindows.length * 20),
          y: 40 + (desktopWindows.length * 20),
          z: newZ
        };
        set({ desktopWindows: [...desktopWindows, newWindow], activeWindowZIndex: newZ });
      },
      closeDesktopWindow: (id) => {
        set({ desktopWindows: get().desktopWindows.filter(w => w.id !== id) });
      },
      focusDesktopWindow: (id) => {
        const { desktopWindows, activeWindowZIndex } = get();
        const newZ = activeWindowZIndex + 1;
        set({
          desktopWindows: desktopWindows.map(w => w.id === id ? { ...w, z: newZ } : w),
          activeWindowZIndex: newZ
        });
      },

      updateInterface: (id, updates) => {
        set({
          interfaces: get().interfaces.map(iface => iface.id === id ? { ...iface, ...updates } : iface)
        });
      },

      renameInterface: (id, newName) => {
        const target = get().interfaces.find(i => i.id === id);
        if (!target) return;
        const oldName = target.name;

        set({
          interfaces: get().interfaces.map(i => i.id === id ? { ...i, name: newName } : i),
          ipAddresses: get().ipAddresses.map(ip => ip.interfaceName === oldName ? { ...ip, interfaceName: newName } : ip),
          dhcpClients: get().dhcpClients.map(d => d.interfaceName === oldName ? { ...d, interfaceName: newName } : d),
          dhcpServers: get().dhcpServers.map(s => s.interface === oldName ? { ...s, interface: newName } : s)
        });
      },

      toggleInterface: (id, disabled) => {
        set({
          interfaces: get().interfaces.map(iface => iface.id === id ? { ...iface, disabled } : iface)
        });
        get().assignDhcpToClients();
      },

      addIPAddress: ({ address, interfaceName, comment }) => {
        const { ipAddresses, interfaces } = get();
        const targetIface = interfaces.find(i => i.name === interfaceName);

        if (!targetIface || targetIface.disabled) {
          return { success: false, message: 'Selected interface is disabled or invalid.' };
        }

        if (ipAddresses.some(ip => ip.address === address)) {
          return { success: false, message: 'Address already exists.' };
        }

        const network = calculateNetwork(address);
        const newIP: IPAddress = {
          id: `ip-${Date.now()}`,
          address,
          network,
          interfaceName,
          comment,
          isDynamic: false,
          disabled: false
        };

        set({ ipAddresses: [...ipAddresses, newIP] });
        get().assignDhcpToClients();
        return { success: true };
      },

      toggleIPAddress: (id) => {
        set({
          ipAddresses: get().ipAddresses.map(ip => ip.id === id ? { ...ip, disabled: !ip.disabled } : ip)
        });
        get().assignDhcpToClients();
      },

      removeIPAddress: (id) => {
        set({ ipAddresses: get().ipAddresses.filter(ip => ip.id !== id) });
        get().assignDhcpToClients();
      },

      addDHCPClient: ({ interfaceName, usePeerDNS, addDefaultRoute, defaultRouteDistance, comment }) => {
        const { dhcpClients, interfaces } = get();
        const targetIface = interfaces.find(i => i.name === interfaceName);

        if (!targetIface || targetIface.disabled) {
          return { success: false, message: 'Cannot create DHCP Client on disabled interface.' };
        }

        if (dhcpClients.some(d => d.interfaceName === interfaceName)) {
          return { success: false, message: 'DHCP Client already exists on this interface.' };
        }

        const clientId = `dhcp-${Date.now()}`;
        const newClient: DHCPClient = {
          id: clientId,
          interfaceName,
          usePeerDNS,
          addDefaultRoute,
          defaultRouteDistance,
          status: 'Searching...',
          address: '',
          gateway: '',
          dns: '',
          expiresAfter: '',
          comment,
          disabled: false
        };

        set({ dhcpClients: [...get().dhcpClients, newClient] });

        if (targetIface.isLinkUp && !targetIface.disabled) {
          (async () => {
            // Simulasi animasi searching selama 1.2 detik
            await new Promise((resolve) => setTimeout(resolve, 1200));

            // Ambil data ISP Asli Pengguna
            const realISP = await fetchRealISPConfig();

            const currentClients = get().dhcpClients;
            const targetClient = currentClients.find(d => d.id === clientId);
            if (!targetClient || targetClient.disabled) return;

            set({
              dhcpClients: get().dhcpClients.map(d => d.id === clientId ? {
                ...d,
                status: 'Bound',
                address: realISP.ip,
                gateway: realISP.gateway,
                dns: realISP.dns,
                expiresAfter: '09:59:58'
              } : d),
              hasInternet: true
            });

            // Tambahkan IP dinamis hasil DHCP Client ke daftar IP Address Router
            get().addIPAddress({
              address: realISP.ip,
              interfaceName,
              comment: `dhcp-client dynamic (${realISP.ispName})`
            });

            set({
              ipAddresses: get().ipAddresses.map(ip => ip.address === realISP.ip ? { ...ip, isDynamic: true } : ip)
            });
          })();
        }

        return { success: true };
      },

      toggleDHCPClient: (id) => {
        set({
          dhcpClients: get().dhcpClients.map(d => d.id === id ? { ...d, disabled: !d.disabled } : d)
        });
      },

      removeDHCPClient: (id) => {
        const client = get().dhcpClients.find(d => d.id === id);
        if (client && client.address) {
          set({
            ipAddresses: get().ipAddresses.filter(ip => !(ip.address === client.address && ip.isDynamic))
          });
        }
        set({ dhcpClients: get().dhcpClients.filter(d => d.id !== id) });
      },

      addDhcpServer: (serverData) => {
        const newServer: DhcpServer = {
          ...serverData,
          id: `dhcp-srv-${Date.now()}`,
        };

        set((state) => ({
          dhcpServers: [...state.dhcpServers, newServer],
        }));

        get().assignDhcpToClients();
        return { success: true };
      },

      toggleDhcpServer: (id) => {
        set((state) => ({
          dhcpServers: state.dhcpServers.map((s) =>
            s.id === id ? { ...s, status: s.status === 'running' ? 'disabled' : 'running' } : s
          ),
        }));
        get().assignDhcpToClients();
      },

      removeDhcpServer: (id) => {
        const serverToRemove = get().dhcpServers.find((s) => s.id === id);
        set((state) => ({
          dhcpServers: state.dhcpServers.filter((s) => s.id !== id),
          dhcpLeases: serverToRemove
            ? state.dhcpLeases.filter((l) => l.server !== serverToRemove.name)
            : state.dhcpLeases,
        }));
        get().assignDhcpToClients();
      },

      assignDhcpToClients: () => {
        const { dhcpServers, ipAddresses, nodes } = get();

        const activeServers = dhcpServers.filter((s) => s.status === 'running');
        if (activeServers.length === 0) {
          set({ dhcpLeases: [] });
          return;
        }

        const newLeases: DhcpLease[] = [];

        activeServers.forEach((server) => {
          const currentIpObj = ipAddresses.find(
            (ip) => ip.interfaceName === server.interface && !ip.disabled
          );

          if (!currentIpObj) return;

          const calc = calculateDhcpDefaults(currentIpObj.address);
          if (!calc) return;

          const clientNodes = nodes.filter(
            (n) => n.type === 'laptopNode' || n.type === 'pcNode'
          );

          clientNodes.forEach((client, index) => {
            const poolParts = calc.poolEnd.split('.');
            const octetLast = parseInt(poolParts[3], 10);
            const assignedIp = `${poolParts[0]}.${poolParts[1]}.${poolParts[2]}.${Math.max(2, octetLast - index)}`;

            newLeases.push({
              id: `lease-${client.id}`,
              address: assignedIp,
              macAddress: (client.data?.macAddress as string) || `4C:5E:0C:${10 + index}:A2:FF`,
              server: server.name,
              hostname: (client.data?.label as string) || `Laptop-${index + 1}`,
              status: 'bound',
              expiresIn: server.leaseTime,
            });

            client.data = {
              ...client.data,
              assignedIp,
              subnetMask: calc.subnetMask,
              gateway: calc.gateway,
              dnsServer: server.dnsServers,
            };
          });
        });

        set({ dhcpLeases: newLeases });
      },

      tickTraffic: () => {
        const { interfaces } = get();
        set({
          interfaces: interfaces.map(iface => {
            if (iface.isLinkUp && !iface.disabled) {
              return {
                ...iface,
                rx: Math.floor(Math.random() * 45000) + 1200,
                tx: Math.floor(Math.random() * 25000) + 800
              };
            } else {
              return { ...iface, rx: 0, tx: 0 };
            }
          })
        });
      },

      openDLinkConfig: (id) => set({ activeDLinkConfigId: id }),
      closeDLinkConfig: () => set({ activeDLinkConfigId: null }),
      setContextMenuNode: (data) => set({ contextMenuNode: data }),

      duplicateNode: (id) => {
        const { nodes } = get();
        const target = nodes.find((n) => n.id === id);
        if (!target) return;

        const newNode = {
          ...target,
          id: `${target.type}-${Date.now()}`,
          position: { x: target.position.x + 30, y: target.position.y + 30 },
          data: { ...target.data, label: `${target.data.label} (Copy)` },
        };
        set({ nodes: [...nodes, newNode] });
        get().validateTopology();
      },

      deleteNode: (id) => {
        const { nodes, edges, activeDesktopLaptopId } = get();
        set({
          nodes: nodes.filter((n) => n.id !== id),
          edges: edges.filter((e) => e.source !== id && e.target !== id),
          activeDesktopLaptopId: activeDesktopLaptopId === id ? null : activeDesktopLaptopId,
          activeLaptopId: activeDesktopLaptopId === id ? null : activeDesktopLaptopId,
        });
        get().validateTopology();
      },

      renameNode: (id, newLabel) => {
        const { nodes } = get();
        set({
          nodes: nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, label: newLabel } } : n)),
        });
      },

      openLaptopDesktop: (id: string) => {
        set((state) => {
          const currentStates = state.laptopDesktopStates || {};
          const existingState = currentStates[id] || {
            isOpen: true,
            activeWindow: null,
            minimizedWindows: [],
            startMenuOpen: false,
            windowPosition: { x: 80, y: 50, width: 750, height: 480, isMaximized: false }
          };

          return {
            activeDesktopLaptopId: id,
            activeLaptopId: id, // Sinkronisasi alias
            laptopDesktopStates: {
              ...currentStates,
              [id]: {
                ...existingState,
                isOpen: true,
                activeWindow: null, // Reset jendela yang terbuka agar langsung tampil desktop bersih
                startMenuOpen: false
              }
            }
          };
        });
      },

      closeLaptopDesktop: () => {
        set((state) => {
          const id = state.activeDesktopLaptopId || state.activeLaptopId;
          if (!id) return { activeDesktopLaptopId: null, activeLaptopId: null };

          return {
            activeDesktopLaptopId: null,
            activeLaptopId: null,
            laptopDesktopStates: {
              ...state.laptopDesktopStates,
              [id]: { ...state.laptopDesktopStates[id], isOpen: false, startMenuOpen: false }
            }
          };
        });
      },

      toggleStartMenu: (id: string) => {
        set((state) => {
          const ds = state.laptopDesktopStates[id];
          if (!ds) return state;
          return {
            laptopDesktopStates: {
              ...state.laptopDesktopStates,
              [id]: { ...ds, startMenuOpen: !ds.startMenuOpen }
            }
          };
        });
      },

      openLaptopWindow: (laptopId: string, windowId: string) => {
        set((state) => {
          const ds = state.laptopDesktopStates[laptopId];
          if (!ds) return state;

          const minimized = ds.minimizedWindows.filter((w) => w !== windowId);
          return {
            laptopDesktopStates: {
              ...state.laptopDesktopStates,
              [laptopId]: {
                ...ds,
                activeWindow: windowId,
                minimizedWindows: minimized,
                startMenuOpen: false
              }
            }
          };
        });
      },

      closeLaptopWindow: (laptopId: string, windowId: string) => {
        set((state) => {
          const ds = state.laptopDesktopStates[laptopId];
          if (!ds) return state;

          return {
            laptopDesktopStates: {
              ...state.laptopDesktopStates,
              [laptopId]: {
                ...ds,
                activeWindow: ds.activeWindow === windowId ? null : ds.activeWindow,
                minimizedWindows: ds.minimizedWindows.filter((w) => w !== windowId)
              }
            }
          };
        });
      },

      minimizeLaptopWindow: (laptopId: string, windowId: string) => {
        set((state) => {
          const ds = state.laptopDesktopStates[laptopId];
          if (!ds) return state;

          const minimized = Array.from(new Set([...ds.minimizedWindows, windowId]));
          return {
            laptopDesktopStates: {
              ...state.laptopDesktopStates,
              [laptopId]: {
                ...ds,
                activeWindow: ds.activeWindow === windowId ? null : ds.activeWindow,
                minimizedWindows: minimized
              }
            }
          };
        });
      },

      restoreLaptopWindow: (laptopId: string, windowId: string) => {
        set((state) => {
          const ds = state.laptopDesktopStates[laptopId];
          if (!ds) return state;

          return {
            laptopDesktopStates: {
              ...state.laptopDesktopStates,
              [laptopId]: {
                ...ds,
                activeWindow: windowId,
                minimizedWindows: ds.minimizedWindows.filter((w) => w !== windowId)
              }
            }
          };
        });
      },

      duplicateLaptopNode: (id: string) => {
        get().duplicateNode(id);
      },

      renameNodeLabel: (id: string, newLabel: string) => {
        get().renameNode(id, newLabel);
      },

      resetTopology: () => {
        set({
          nodes: [],
          edges: [],
          topologyStatus: 'Topology Invalid',
          isTopologyValid: false,
          discoveredNeighbors: [],
          ipAddresses: [],
          dhcpClients: [],
          dhcpServers: [],
          dhcpLeases: [],
          firewallRules: { nat: [], filter: [], mangle: [] },
          isNatConfigured: false,
          isInternetConnected: false,
          hasInternet: false,
          activeDesktopLaptopId: null,
          activeLaptopId: null,
          laptopDesktopStates: {}
        });
      },

      resetAll: () => {
        get().resetTopology();
      }
    }),
    {
      name: 'mikrotik-winbox-state',
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        routerData: state.routerData,
        ipAddresses: state.ipAddresses,
        dhcpServers: state.dhcpServers,
        firewallRules: state.firewallRules,
        isNatConfigured: state.isNatConfigured,
        isInternetConnected: state.isInternetConnected,
        laptopDesktopStates: state.laptopDesktopStates,
      }),
    }
  )
);