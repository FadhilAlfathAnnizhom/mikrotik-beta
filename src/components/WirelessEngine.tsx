import { useEffect } from 'react';
import { useStore } from '../store/useStore';

const WIFI_RADIUS = 200; // Radius jangkauan sinyal D-Link / AP (dalam piksel)

export const WirelessEngine = () => {
    const { nodes, edges, validateTopology } = useStore();

    useEffect(() => {
        // 1. Filter Node Access Point (D-Link) dan Laptop/PC
        const apNodes = nodes.filter(
            (n) => n.type === 'dlinkNode' || n.data?.type === 'ap' || (n.data?.label || '').toLowerCase().includes('d-link')
        );
        const laptopNodes = nodes.filter(
            (n) => n.type === 'laptopNode' || (n.data?.label || '').toLowerCase().includes('laptop')
        );

        if (apNodes.length === 0 || laptopNodes.length === 0) {
            // Hapus hanya edge Wi-Fi otomatis jika AP/Laptop dihapus
            const nonAutoEdges = edges.filter((e) => !e.data?.isAutoWifi);
            if (nonAutoEdges.length !== edges.length) {
                useStore.setState({ edges: nonAutoEdges });
                if (typeof validateTopology === 'function') validateTopology();
            }
            return;
        }

        let updatedEdges = [...edges];
        let hasChanged = false;

        laptopNodes.forEach((laptop) => {
            apNodes.forEach((ap) => {
                // Hitung koordinat titik tengah dari kedua node
                const laptopX = laptop.position.x + 60;
                const laptopY = laptop.position.y + 40;
                const apX = ap.position.x + 80;
                const apY = ap.position.y + 60;

                const dx = laptopX - apX;
                const dy = laptopY - apY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                const autoEdgeId = `wifi-auto-${laptop.id}-${ap.id}`;
                const existingEdgeIndex = updatedEdges.findIndex((e) => e.id === autoEdgeId);

                if (distance <= WIFI_RADIUS) {
                    // TERMASUK RADIUS: Tambahkan edge Wi-Fi otomatis jika belum terhubung
                    if (existingEdgeIndex === -1) {
                        updatedEdges.push({
                            id: autoEdgeId,
                            source: ap.id,
                            target: laptop.id,
                            type: 'smoothstep',
                            animated: true,
                            style: { strokeDasharray: '6,6', stroke: '#0284c7', strokeWidth: 2 },
                            data: { type: 'wifi', isAutoWifi: true },
                        });
                        hasChanged = true;
                    }
                } else {
                    // DI LUAR RADIUS: Hapus edge Wi-Fi otomatis jika sebelumnya terhubung
                    if (existingEdgeIndex !== -1) {
                        updatedEdges.splice(existingEdgeIndex, 1);
                        hasChanged = true;
                    }
                }
            });
        });

        // 2. Terapkan perubahan ke store tanpa mengganggu edge/koneksi kabel lainnya
        if (hasChanged) {
            useStore.setState({ edges: updatedEdges });
            if (typeof validateTopology === 'function') {
                validateTopology();
            }
        }
    }, [nodes, edges, validateTopology]);

    return null;
};