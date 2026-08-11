import { useEffect } from 'react';
import { useStore } from '../store/useStore';

export const DHCPEngine = () => {
    const nodes = useStore((state) => state.nodes);
    const edges = useStore((state) => state.edges);
    const dhcpServers = useStore((state) => state.dhcpServers);
    const ipAddresses = useStore((state) => state.ipAddresses);
    const natRules = useStore((state) => state.natRules);
    const requestDhcpLease = useStore((state) => state.requestDhcpLease);
    const evaluateConnectivity = useStore((state) => state.evaluateConnectivity);
    const deviceStates = useStore((state) => state.deviceStates);

    useEffect(() => {
        const laptopNodes = nodes.filter((node) => node.type === 'laptop');

        laptopNodes.forEach((node) => {
            const state = deviceStates[node.id];
            if (!state || state.mode === 'dhcp') {
                requestDhcpLease(node.id);
            } else {
                evaluateConnectivity(node.id);
            }
        });
    }, [nodes, edges, dhcpServers, ipAddresses, natRules, requestDhcpLease, evaluateConnectivity]);

    return null;
};