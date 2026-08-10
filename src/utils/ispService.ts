export interface RealISPInfo {
    ip: string;          // IP dengan CIDR, misal: "180.250.10.15/24"
    gateway: string;     // Gateway perkiraan, misal: "180.250.10.1"
    netmask: string;     // Netmask
    dns: string[];       // DNS Servers
    ispName: string;     // Nama Provider (Indihome, Biznet, Telkomsel, dll)
}

export const fetchRealISPConfig = async (): Promise<RealISPInfo> => {
    try {
        // Mengambil data publik ISP asli via API
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('Gagal mengambil data ISP');

        const data = await response.json();

        const publicIp = data.ip || '192.168.1.100';
        const ipParts = publicIp.split('.');

        // Estimasi Gateway dari IP Publik
        const estimatedGateway = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.1`;

        return {
            ip: `${publicIp}/24`,
            gateway: estimatedGateway,
            netmask: '255.255.255.0',
            dns: ['8.8.8.8', '1.1.1.1'],
            ispName: data.org || data.asn || 'Real ISP'
        };
    } catch (error) {
        console.warn('Offline / Gagal Fetch ISP, menggunakan fallback lokal:', error);

        // Data cadangan jika internet mati atau di-block CORS
        return {
            ip: '192.168.18.50/24',
            gateway: '192.168.18.1',
            netmask: '255.255.255.0',
            dns: ['192.168.18.1', '8.8.8.8'],
            ispName: 'Default ISP (Simulated)'
        };
    }
};