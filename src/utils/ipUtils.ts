// Helper konversi IP String & Number
export function ipToNum(ip: string): number {
    return ip
        .split('.')
        .reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0);
}

export function numToIp(num: number): string {
    return [
        (num >>> 24) & 255,
        (num >>> 16) & 255,
        (num >>> 8) & 255,
        num & 255,
    ].join('.');
}

// Menghitung Network Address, Gateway, Pool, dan Broadcast dari CIDR (contoh: 192.168.100.1/24)
export function calculateDhcpDefaults(ipWithCidr: string) {
    if (!ipWithCidr || !ipWithCidr.includes('/')) return null;

    const [ipStr, prefixStr] = ipWithCidr.split('/');
    const prefix = parseInt(prefixStr, 10);
    if (isNaN(prefix) || prefix < 8 || prefix > 30) return null;

    const ipNum = ipToNum(ipStr);
    const maskNum = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    const netNum = (ipNum & maskNum) >>> 0;
    const broadcastNum = (netNum | (~maskNum >>> 0)) >>> 0;

    const networkAddress = `${numToIp(netNum)}/${prefix}`;
    const gateway = ipStr;

    // Tentukan Range Pool (menghindari Network, Gateway, & Broadcast)
    let startNum = netNum + 1;
    let endNum = broadcastNum - 1;

    // Jika IP Gateway ada di awal subnet (.1), pool mulai dari .2
    if (ipNum === startNum) {
        startNum = netNum + 2;
    } else if (ipNum === endNum) {
        // Jika IP Gateway ada di akhir subnet, pool berakhir di endNum - 1
        endNum = broadcastNum - 2;
    }

    const poolStart = numToIp(startNum);
    const poolEnd = numToIp(endNum);
    const addressesToGiveOut = `${poolStart}-${poolEnd}`;

    return {
        networkAddress,
        gateway,
        addressesToGiveOut,
        poolStart,
        poolEnd,
        subnetMask: numToIp(maskNum),
        broadcast: numToIp(broadcastNum),
        netNum,
        broadcastNum,
    };
}

// Validasi apakah Range Pool berada dalam Network Address Space
export function validateDhcpPool(
    poolStr: string,
    networkCidr: string,
    gatewayIp: string
): boolean {
    if (!poolStr.includes('-')) return false;

    const [startIp, endIp] = poolStr.split('-').map((s) => s.trim());
    const calc = calculateDhcpDefaults(networkCidr);
    if (!calc) return false;

    const startNum = ipToNum(startIp);
    const endNum = ipToNum(endIp);
    const gatewayNum = ipToNum(gatewayIp);

    // Harus di dalam batas Network & Broadcast, serta tidak boleh sama dengan Gateway
    if (
        startNum <= calc.netNum ||
        endNum >= calc.broadcastNum ||
        startNum > endNum ||
        gatewayNum === startNum ||
        gatewayNum === endNum
    ) {
        return false;
    }

    return true;
}