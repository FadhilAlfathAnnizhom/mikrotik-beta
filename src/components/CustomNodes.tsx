import React from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';

// Import gambar logo dari folder assets
import ispImg from '../assets/isp.png';
import routerImg from '../assets/router.png';
import switchImg from '../assets/switch.png';
import laptopImg from '../assets/leptop.png';

const nodeBaseStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: '8px',
  background: '#ffffff',
  border: '1px solid #d1d5db',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '110px',
  fontFamily: 'Segoe UI, Tahoma, sans-serif',
  userSelect: 'none'
};

const handleLabelStyle: React.CSSProperties = {
  fontSize: '9px',
  color: '#4b5563',
  fontWeight: 600,
  position: 'absolute',
  whiteSpace: 'nowrap'
};

const nodeIconStyle: React.CSSProperties = {
  width: '42px',
  height: '42px',
  objectFit: 'contain'
};

// 1. ISP Cloud Node
export const ISPNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div style={{ ...nodeBaseStyle, borderColor: '#93c5fd', backgroundColor: '#f0f9ff' }}>
      <img src={ispImg} alt="ISP" style={nodeIconStyle} />
      <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0369a1', marginTop: '4px' }}>
        {data?.label || 'Cloud ISP'}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="lan"
        style={{ background: '#0284c7', width: '8px', height: '8px' }}
      />
      <span style={{ ...handleLabelStyle, right: '-25px', top: '42%' }}>LAN</span>
    </div>
  );
};

// 2. MikroTik Router Node
export const RouterNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div style={{ ...nodeBaseStyle, borderColor: '#3b82f6', minWidth: '130px', padding: '12px' }}>
      <img src={routerImg} alt="Router" style={{ ...nodeIconStyle, width: '48px', height: '48px' }} />

      <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a', marginTop: '6px' }}>
        {data?.label || 'MikroTik RB941'}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        id="ether1"
        style={{ top: '35%', background: '#2563eb', width: '8px', height: '8px' }}
      />
      <span style={{ ...handleLabelStyle, left: '6px', top: '28%' }}>ether1</span>

      <Handle
        type="source"
        position={Position.Right}
        id="ether2"
        style={{ top: '30%', background: '#16a34a', width: '8px', height: '8px' }}
      />
      <span style={{ ...handleLabelStyle, right: '8px', top: '23%' }}>ether2</span>

      <Handle
        type="source"
        position={Position.Right}
        id="ether3"
        style={{ top: '55%', background: '#4b5563', width: '8px', height: '8px' }}
      />
      <span style={{ ...handleLabelStyle, right: '8px', top: '48%' }}>ether3</span>

      <Handle
        type="source"
        position={Position.Right}
        id="ether4"
        style={{ top: '80%', background: '#4b5563', width: '8px', height: '8px' }}
      />
      <span style={{ ...handleLabelStyle, right: '8px', top: '73%' }}>ether4</span>
    </div>
  );
};

// 3. Switch Node
export const SwitchNode: React.FC<NodeProps> = ({ data }) => {
  const ports = Array.from({ length: 10 }, (_, i) => `ether${i + 1}`);

  return (
    <div style={{ ...nodeBaseStyle, borderColor: '#f97316', backgroundColor: '#fff7ed', minWidth: '220px', padding: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <img src={switchImg} alt="Switch" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#9a3412' }}>
            {data?.label || 'Switch (10 Ports)'}
          </span>
        </div>
        <span style={{ fontSize: '9px', background: '#ffedd5', color: '#c2410c', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
          10x ETH
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', width: '100%' }}>
        {ports.map((portName, idx) => (
          <div
            key={portName}
            style={{
              position: 'relative',
              background: '#ffffff',
              border: '1px solid #fdba74',
              borderRadius: '4px',
              padding: '4px 2px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '26px'
            }}
          >
            <span style={{ fontSize: '8px', fontWeight: 700, color: '#c2410c' }}>e{idx + 1}</span>

            <Handle
              type="target"
              position={Position.Top}
              id={portName}
              style={{
                width: '6px',
                height: '6px',
                background: '#ea580c',
                top: '-4px'
              }}
            />

            <Handle
              type="source"
              position={Position.Bottom}
              id={portName}
              style={{
                width: '6px',
                height: '6px',
                background: '#ea580c',
                bottom: '-4px'
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// 4. Laptop / PC Node
export const LaptopNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div style={{ ...nodeBaseStyle, borderColor: '#6b7280' }}>
      <img src={laptopImg} alt="Laptop" style={nodeIconStyle} />
      <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1f2937', marginTop: '2px' }}>
        {data?.label || 'Laptop/PC'}
      </div>
      {data?.assignedIp && (
        <div style={{ fontSize: '9px', color: '#16a34a', fontWeight: '600' }}>
          {data.assignedIp}
        </div>
      )}

      <Handle
        type="target"
        position={Position.Left}
        id="ethernet"
        style={{ background: '#374151', width: '8px', height: '8px' }}
      />
      <span style={{ ...handleLabelStyle, left: '6px', top: '75%' }}>Ethernet</span>
    </div>
  );
};