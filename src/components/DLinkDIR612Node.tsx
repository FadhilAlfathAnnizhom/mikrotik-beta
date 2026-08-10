
import { Handle, Position, type NodeProps } from 'reactflow';

export const DLinkDIR612Node = ({ data }: NodeProps) => {
    const radius = data?.radius || 180;
    const isOnline = data?.isOnline ?? true;

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* 1. Lingkaran Coverage Wi-Fi (Otomatis Mengikuti Zoom, Pan, & Drag React Flow) */}
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: `${radius * 2}px`,
                    height: `${radius * 2}px`,
                    transform: 'translate(-50%, -50%)',
                    borderRadius: '50%',
                    border: isOnline ? '1.5px dashed #3b82f6' : '1.5px dashed #ef4444',
                    backgroundColor: isOnline ? 'rgba(59, 130, 246, 0.05)' : 'rgba(239, 68, 68, 0.04)',
                    pointerEvents: 'none',
                    zIndex: -1,
                    transition: 'width 0.1s ease, height 0.1s ease',
                }}
            >
                {/* Garis Indikator Radius ke atas */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: '50%',
                        height: '50%',
                        borderLeft: isOnline ? '1.5px dashed #f59e0b' : '1.5px dashed #9ca3af',
                        transform: 'translateX(-50%)',
                    }}
                />
                {/* Titik Indikator di Puncak Lingkaran */}
                <div
                    style={{
                        position: 'absolute',
                        top: '-5px',
                        left: '50%',
                        width: '10px',
                        height: '10px',
                        backgroundColor: isOnline ? '#f59e0b' : '#9ca3af',
                        border: '2px solid #ffffff',
                        borderRadius: '50%',
                        transform: 'translateX(-50%)',
                    }}
                />
            </div>

            {/* 2. Tampilan Fisik Node D-Link DIR-612 */}
            <div
                style={{
                    background: '#0f172a',
                    border: '2px solid #1e293b',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: '#ffffff',
                    minWidth: '140px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                }}
            >
                <div style={{ fontSize: '10px', fontWeight: 'bold', textAlign: 'center', color: '#38bdf8', letterSpacing: '1px' }}>
                    D-Link
                </div>
                <div style={{ fontSize: '11px', fontWeight: 'bold', textAlign: 'center', color: '#f8fafc', margin: '2px 0 6px 0' }}>
                    {data?.label || 'D-Link DIR-612'}
                </div>

                {/* Status Online/Offline */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '8px' }}>
                    <div
                        style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: isOnline ? '#22c55e' : '#ef4444',
                        }}
                    />
                    <span style={{ fontSize: '9px', color: isOnline ? '#4ade80' : '#f87171' }}>
                        {isOnline ? 'Online' : 'Offline'}
                    </span>
                </div>

                {/* Port Ethernet Handles */}
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', paddingTop: '4px', borderTop: '1px solid #334155' }}>
                    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '7px', color: '#94a3b8', marginBottom: '2px' }}>WAN</span>
                        <Handle
                            type="target"
                            position={Position.Bottom}
                            id="wan"
                            style={{ position: 'relative', transform: 'none', top: 0, background: '#0284c7', width: '7px', height: '7px' }}
                        />
                    </div>
                    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '7px', color: '#94a3b8', marginBottom: '2px' }}>LAN1</span>
                        <Handle
                            type="source"
                            position={Position.Bottom}
                            id="lan1"
                            style={{ position: 'relative', transform: 'none', top: 0, background: '#16a34a', width: '7px', height: '7px' }}
                        />
                    </div>
                    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '7px', color: '#94a3b8', marginBottom: '2px' }}>LAN2</span>
                        <Handle
                            type="source"
                            position={Position.Bottom}
                            id="lan2"
                            style={{ position: 'relative', transform: 'none', top: 0, background: '#16a34a', width: '7px', height: '7px' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};