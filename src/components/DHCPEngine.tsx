import { useEffect } from 'react';
import { useStore } from '../store/useStore';

export const DHCPEngine = () => {
    const { nodes, edges } = useStore();

    useEffect(() => {
        // 1. Cari semua node Laptop yang diset ke mode 'dhcp'
        const laptopNodes = nodes.filter(
            (n) => n.type === 'laptopNode' && (n.data?.ipAssignmentMode === 'dhcp' || !n.data?.ipAssignmentMode)
        );

        if (laptopNodes.length === 0) return;

        let hasChanges = false;
        const updatedNodes = nodes.map((node) => {
            // Hanya proses jika node adalah Laptop yang bermode DHCP
            if (node.type !== 'laptopNode' || node.data?.ipAssignmentMode === 'static') {
                return node;
            }

            // 2. Cari Router MikroTik yang terhubung ke Laptop ini (bisa via Switch / Wireless / Direct)
            const connectedRouter = findConnectedRouter(node.id, nodes, edges);

            if (connectedRouter && connectedRouter.data?.dhcpServerActive) {
                const dhcpConfig = connectedRouter.data.dhcpServerConfig || {
                    network: '192.168.88.0/24',
                    gateway: '192.168.88.1',
                    subnetMask: '255.255.255.0',
                    dns: '8.8.8.8',
                    poolStart: 10,
                };

                // Hitung IP otomatis berdasarkan index/ID Laptop agar unik
                const laptopIndex = nodes.filter((n) => n.type === 'laptopNode').findIndex((n) => n.id === node.id);
                const ipOffset = (dhcpConfig.poolStart || 10) + laptopIndex;

                const baseIpPrefix = dhcpConfig.gateway ? dhcpConfig.gateway.split('.').slice(0, 3).join('.') : '192.168.88';
                const assignedIp = `${baseIpPrefix}.${ipOffset}`;

                // Cek apakah data jaringan laptop berbeda dari nilai DHCP baru
                if (
                    node.data?.ipAddress !== assignedIp ||
                    node.data?.gateway !== dhcpConfig.gateway ||
                    node.data?.subnetMask !== dhcpConfig.subnetMask ||
                    node.data?.dnsServer !== dhcpConfig.dns ||
                    !node.data?.dhcpBound
                ) {
                    hasChanges = true;
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            ipAssignmentMode: 'dhcp',
                            ipAddress: assignedIp,
                            subnetMask: dhcpConfig.subnetMask || '255.255.255.0',
                            gateway: dhcpConfig.gateway || '192.168.88.1',
                            dnsServer: dhcpConfig.dns || '8.8.8.8',
                            dhcpBound: true,
                            dhcpServerSource: connectedRouter.data?.label || 'MikroTik Router',
                        },
                    };
                }
            } else {
                // Jika terputus dari Router DHCP / DHCP MikroTik dimatikan
                if (node.data?.dhcpBound || node.data?.ipAddress) {
                    hasChanges = true;
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            ipAssignmentMode: 'dhcp',
                            ipAddress: '',
                            subnetMask: '',
                            gateway: '',
                            dnsServer: '',
                            dhcpBound: false,
                            dhcpServerSource: null,
                        },
                    };
                }
            }

            return node;
        });

        // 3. Terapkan perubahan ke state utama tanpa merusak node lain
        if (hasChanges) {
            useStore.setState({ nodes: updatedNodes });
        }
    }, [nodes, edges]);

    return null;
};

/**
 * Helper BFS untuk menelusuri jalur koneksi dari Laptop ke Router MikroTik
 */
function findConnectedRouter(startNodeId: string, nodes: any[], edges: any[]): any | null {
    const visited = new Set<string>();
    const queue = [startNodeId];

    while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (visited.has(currentId)) continue;
        visited.add(currentId);

        const currentNode = nodes.find((n) => n.id === currentId);
        if (currentNode && currentNode.type === 'routerNode') {
            return currentNode;
        }

        // Cari semua tetangga yang terhubung lewat edges (kabel maupun wifi)
        const connectedEdges = edges.filter((e) => e.source === currentId || e.target === currentId);

        for (const edge of connectedEdges) {
            const neighborId = edge.source === currentId ? edge.target : edge.source;
            if (!visited.has(neighborId)) {
                queue.push(neighborId);
            }
        }
    }

    return null;
}