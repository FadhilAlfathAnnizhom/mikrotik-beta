import React, { useRef, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useStore } from '../store/useStore';
import { ISPNode, RouterNode, SwitchNode, LaptopNode } from './CustomNodes';

// Register Custom Nodes
const nodeTypes = {
  ispNode: ISPNode,
  routerNode: RouterNode,
  switchNode: SwitchNode,
  laptopNode: LaptopNode,
};

// --- KOMPONEN UTAMA CANVAS ---
const TopologyCanvas = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    topologyStatus,
    isTopologyValid,
    openWinBox
  } = useStore();

  // Handle Drag Over Canvas
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle Drop Perangkat ke Canvas (Posisi Presisi)
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/reactflow-label');

      if (!type) return;

      // Konversi koordinat kursor ke koordinat internal canvas React Flow
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Geser offset sedikit ke tengah ikon perangkat
      position.x -= 50;
      position.y -= 25;

      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label },
      };

      // Tambahkan node baru via store
      useStore.setState((state) => ({
        nodes: [...state.nodes, newNode],
      }));

      // Panggil re-validasi topologi
      useStore.getState().validateTopology();
    },
    [screenToFlowPosition]
  );

  // Drag Start dari Sidebar
  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/reactflow-label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>

      {/* SIDEBAR COMPONENT PALETTE */}
      <div style={sidebarContainerStyle}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#1f2937' }}>
          Topology Builder
        </h2>
        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '15px' }}>
          Drag components to canvas:
        </p>

        <div
          draggable
          onDragStart={(e) => onDragStart(e, 'ispNode', 'Cloud ISP')}
          style={paletteItemStyle}
        >
          ☁️ ISP Cloud
        </div>

        <div
          draggable
          onDragStart={(e) => onDragStart(e, 'routerNode', 'Router MikroTik')}
          style={paletteItemStyle}
        >
          🟦 Router MikroTik
        </div>

        <div
          draggable
          onDragStart={(e) => onDragStart(e, 'switchNode', 'Switch')}
          style={paletteItemStyle}
        >
          🟧 Switch
        </div>

        <div
          draggable
          onDragStart={(e) => onDragStart(e, 'laptopNode', 'Laptop/PC')}
          style={paletteItemStyle}
        >
          💻 Laptop/PC
        </div>

        {/* STATUS CARD */}
        <div style={{ ...statusCardStyle, backgroundColor: isTopologyValid ? '#dcfce7' : '#fef2f2' }}>
          <div style={{ fontSize: '11px', color: '#4b5563', fontWeight: 'bold' }}>Status:</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: isTopologyValid ? '#15803d' : '#b91c1c', marginTop: '4px' }}>
            {topologyStatus}
          </div>
        </div>

        <button
          disabled={!isTopologyValid}
          onClick={openWinBox}
          style={{
            ...btnWinBoxStyle,
            backgroundColor: isTopologyValid ? '#0284c7' : '#9ca3af',
            cursor: isTopologyValid ? 'pointer' : 'not-allowed',
          }}
        >
          Launch WinBox
        </button>
      </div>

      {/* CANVAS WORKSPACE */}
      <div ref={reactFlowWrapper} style={{ flexGrow: 1, height: '100%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          fitViewOptions={{ padding: 0.2 }}
          snapToGrid={true}
          snapGrid={[15, 15]}
        >
          <Background color="#ccc" gap={16} />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
};

// --- WRAPPER DENGAN REACTFLOW PROVIDER ---
export const TopologyBuilder = () => {
  return (
    <ReactFlowProvider>
      <TopologyCanvas />
    </ReactFlowProvider>
  );
};

// Styling UI Sidebar
const sidebarContainerStyle: React.CSSProperties = {
  width: '240px',
  padding: '20px',
  background: '#f9fafb',
  borderRight: '1px solid #e5e7eb',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  zIndex: 10,
  userSelect: 'none',
};

const paletteItemStyle: React.CSSProperties = {
  padding: '12px 16px',
  background: '#ffffff',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'grab',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  textAlign: 'center',
};

const statusCardStyle: React.CSSProperties = {
  marginTop: 'auto',
  padding: '15px',
  borderRadius: '8px',
  textAlign: 'center',
  border: '1px solid #e5e7eb',
};

const btnWinBoxStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  color: 'white',
  fontWeight: 'bold',
  borderRadius: '6px',
  border: 'none',
  fontSize: '14px',
};