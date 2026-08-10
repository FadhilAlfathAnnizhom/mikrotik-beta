import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { calculateDhcpDefaults, validateDhcpPool } from '../utils/ipUtils';

interface Props {
    onClose: () => void;
}

export const DhcpSetupWizard: React.FC<Props> = ({ onClose }) => {
    const { ipAddresses, addDhcpServer } = useStore();

    const [step, setStep] = useState<number>(1);
    const [selectedInterface, setSelectedInterface] = useState<string>('ether2');
    const [addressSpace, setAddressSpace] = useState<string>('');
    const [gateway, setGateway] = useState<string>('');
    const [addressesToGiveOut, setAddressesToGiveOut] = useState<string>('');
    const [dnsServers, setDnsServers] = useState<string>('8.8.8.8');
    const [leaseTime, setLeaseTime] = useState<string>('00:10:00');
    const [errorMessage, setErrorMessage] = useState<string>('');

    // Sinkronisasi data realtime saat interface dipilih atau IP LAN berubah
    useEffect(() => {
        const currentIpObj = ipAddresses.find((ip) => ip.interfaceName === selectedInterface);
        if (currentIpObj) {
            const calc = calculateDhcpDefaults(currentIpObj.address);
            if (calc) {
                setAddressSpace(calc.networkAddress);
                setGateway(calc.gateway);
                setAddressesToGiveOut(calc.addressesToGiveOut);
                setErrorMessage('');
            }
        } else {
            setAddressSpace('');
            setGateway('');
            setAddressesToGiveOut('');
        }
    }, [selectedInterface, ipAddresses]);

    const handleNext = () => {
        setErrorMessage('');

        // Step 1: Validasi Interface & IP Address
        if (step === 1) {
            const currentIpObj = ipAddresses.find((ip) => ip.interfaceName === selectedInterface);
            if (!currentIpObj) {
                setErrorMessage(
                    'The selected interface does not have an IP address.\nPlease configure an IP address first in IP → Addresses.'
                );
                return;
            }
        }

        // Step 4: Validasi Range Pool
        if (step === 4) {
            const isValid = validateDhcpPool(addressesToGiveOut, addressSpace, gateway);
            if (!isValid) {
                setErrorMessage(
                    'Invalid DHCP address pool.\nThe address pool must belong to the DHCP network.'
                );
                return;
            }
        }

        // Step 6: Finish / Save
        if (step === 6) {
            addDhcpServer({
                name: `dhcp-${selectedInterface}`,
                interface: selectedInterface,
                addressSpace,
                gateway,
                addressesToGiveOut,
                dnsServers,
                leaseTime,
                status: 'running',
            });
            onClose();
            return;
        }

        setStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setErrorMessage('');
        if (step > 1) setStep((prev) => prev - 1);
    };

    return (
        <div
            style={{
                position: 'absolute',
                top: '20%',
                left: '30%',
                width: '380px',
                backgroundColor: '#d4d0c8',
                border: '2px solid #ffffff',
                borderRightColor: '#404040',
                borderBottomColor: '#404040',
                boxShadow: '3px 3px 10px rgba(0,0,0,0.4)',
                fontFamily: 'Tahoma, sans-serif',
                fontSize: '11px',
                zIndex: 1000,
            }}
        >
            {/* Title Bar WinBox */}
            <div
                style={{
                    background: 'linear-gradient(90deg, #0a246a, #a6caf0)',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    padding: '3px 6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <span>DHCP Setup</span>
                <button
                    onClick={onClose}
                    style={{
                        width: '16px',
                        height: '14px',
                        lineHeight: '10px',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        backgroundColor: '#d4d0c8',
                        border: '1px solid #ffffff',
                        borderRightColor: '#404040',
                        borderBottomColor: '#404040',
                        cursor: 'pointer',
                    }}
                >
                    X
                </button>
            </div>

            {/* Body Content */}
            <div style={{ padding: '12px' }}>
                {/* Step 1: Select Interface */}
                {step === 1 && (
                    <div>
                        <div style={{ color: '#404040', marginBottom: '8px' }}>
                            Select interface to run DHCP server on
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                            <label style={{ width: '130px', fontWeight: 'bold' }}>DHCP Server Interface:</label>
                            <select
                                value={selectedInterface}
                                onChange={(e) => setSelectedInterface(e.target.value)}
                                style={{ width: '140px', padding: '2px', border: '1px solid #7f9db9' }}
                            >
                                <option value="ether1">ether1</option>
                                <option value="ether2">ether2</option>
                                <option value="ether3">ether3</option>
                                <option value="ether4">ether4</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Step 2: DHCP Address Space */}
                {step === 2 && (
                    <div>
                        <div style={{ color: '#404040', marginBottom: '8px' }}>
                            Select network for DHCP addresses
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                            <label style={{ width: '130px', fontWeight: 'bold' }}>DHCP Address Space:</label>
                            <input
                                type="text"
                                value={addressSpace}
                                onChange={(e) => setAddressSpace(e.target.value)}
                                style={{ width: '160px', padding: '2px', border: '1px solid #7f9db9' }}
                            />
                        </div>
                    </div>
                )}

                {/* Step 3: Gateway */}
                {step === 3 && (
                    <div>
                        <div style={{ color: '#404040', marginBottom: '8px' }}>
                            Select gateway for given network
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                            <label style={{ width: '140px', fontWeight: 'bold' }}>Gateway for DHCP Network:</label>
                            <input
                                type="text"
                                value={gateway}
                                onChange={(e) => setGateway(e.target.value)}
                                style={{ width: '150px', padding: '2px', border: '1px solid #7f9db9' }}
                            />
                        </div>
                    </div>
                )}

                {/* Step 4: Addresses to Give Out */}
                {step === 4 && (
                    <div>
                        <div style={{ color: '#404040', marginBottom: '8px' }}>
                            Select pool of ip addresses given out by DHCP server
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                            <label style={{ width: '130px', fontWeight: 'bold' }}>Addresses to Give Out:</label>
                            <input
                                type="text"
                                value={addressesToGiveOut}
                                onChange={(e) => setAddressesToGiveOut(e.target.value)}
                                style={{ width: '170px', padding: '2px', border: '1px solid #7f9db9' }}
                            />
                        </div>
                    </div>
                )}

                {/* Step 5: DNS Servers */}
                {step === 5 && (
                    <div>
                        <div style={{ color: '#404040', marginBottom: '8px' }}>Select DNS servers</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                            <label style={{ width: '100px', fontWeight: 'bold', color: '#0000ff' }}>DNS Servers:</label>
                            <input
                                type="text"
                                value={dnsServers}
                                onChange={(e) => setDnsServers(e.target.value)}
                                style={{ width: '180px', padding: '2px', border: '1px solid #7f9db9' }}
                            />
                        </div>
                    </div>
                )}

                {/* Step 6: Lease Time */}
                {step === 6 && (
                    <div>
                        <div style={{ color: '#404040', marginBottom: '8px' }}>Select lease time</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                            <label style={{ width: '100px', fontWeight: 'bold' }}>Lease Time:</label>
                            <input
                                type="text"
                                value={leaseTime}
                                onChange={(e) => setLeaseTime(e.target.value)}
                                style={{ width: '140px', padding: '2px', border: '1px solid #7f9db9' }}
                            />
                        </div>
                    </div>
                )}

                {/* Pesan Error Validasi */}
                {errorMessage && (
                    <div
                        style={{
                            marginTop: '12px',
                            padding: '6px',
                            backgroundColor: '#ffcccc',
                            border: '1px solid #ff0000',
                            color: '#990000',
                            fontSize: '10px',
                            whiteSpace: 'pre-line',
                        }}
                    >
                        {errorMessage}
                    </div>
                )}

                {/* Tombol Aksi Navigation Wizard */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '6px',
                        marginTop: '20px',
                        paddingTop: '10px',
                        borderTop: '1px solid #808080',
                    }}
                >
                    <button
                        onClick={handleBack}
                        disabled={step === 1}
                        style={{
                            width: '60px',
                            padding: '2px 0',
                            backgroundColor: '#d4d0c8',
                            border: '1px solid #ffffff',
                            borderRightColor: '#404040',
                            borderBottomColor: '#404040',
                            cursor: step === 1 ? 'default' : 'pointer',
                            opacity: step === 1 ? 0.6 : 1,
                        }}
                    >
                        Back
                    </button>
                    <button
                        onClick={handleNext}
                        style={{
                            width: '60px',
                            padding: '2px 0',
                            backgroundColor: '#d4d0c8',
                            border: '1px solid #ffffff',
                            borderRightColor: '#404040',
                            borderBottomColor: '#404040',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                        }}
                    >
                        {step === 6 ? 'Finish' : 'Next'}
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            width: '60px',
                            padding: '2px 0',
                            backgroundColor: '#d4d0c8',
                            border: '1px solid #ffffff',
                            borderRightColor: '#404040',
                            borderBottomColor: '#404040',
                            cursor: 'pointer',
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};