import React, { useRef, useCallback, useState, useEffect } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    ReactFlowProvider,
    useReactFlow,
    type Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { DLinkDIR612Node } from './DLinkDIR612Node';
import { WirelessEngine } from './WirelessEngine';
import { DLinkContextMenu } from './DLinkContextMenu';
import { DLinkConfigurationDesktop } from './DLinkConfigurationDesktop';
import { useStore } from '../store/useStore';
import { ISPNode, RouterNode, SwitchNode, LaptopNode } from './CustomNodes';
import { LaptopDesktop } from './LaptopDesktop/LaptopDesktop';

// Import Gambar Asset Logo
import ispImg from '../assets/isp.png';
import apImg from '../assets/ap.png';
import routerImg from '../assets/router.png';
import switchImg from '../assets/switch.png';
import laptopImg from '../assets/leptop.png';

const nodeTypes = {
    ispNode: ISPNode,
    routerNode: RouterNode,
    switchNode: SwitchNode,
    laptopNode: LaptopNode,
    dlinkNode: DLinkDIR612Node,
};

const TopologyCanvas = () => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { screenToFlowPosition } = useReactFlow();

    const touchedNodeTypeRef = useRef<{ type: string; label: string } | null>(null);
    const [nodeToDelete, setNodeToDelete] = useState<{ id: string; label: string } | null>(null);
    const [showResetModal, setShowResetModal] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        topologyStatus,
        isTopologyValid,
        openWinBox,
        openLaptopDesktop,
        setContextMenuNode,
        deleteNode
    } = useStore();

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            const label = event.dataTransfer.getData('application/reactflow-label');

            if (!type) return;

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            position.x -= 50;
            position.y -= 25;

            addNewNode(type, label, position);
        },
        [screenToFlowPosition]
    );

    const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/reactflow-label', label);
        event.dataTransfer.effectAllowed = 'move';
    };

    const handleTouchStart = (nodeType: string, label: string) => {
        touchedNodeTypeRef.current = { type: nodeType, label };
    };

    const handleTouchEnd = (event: React.TouchEvent) => {
        if (!touchedNodeTypeRef.current) return;

        const { type, label } = touchedNodeTypeRef.current;
        touchedNodeTypeRef.current = null;

        const touch = event.changedTouches[0];
        if (!touch || !reactFlowWrapper.current) return;

        const rect = reactFlowWrapper.current.getBoundingClientRect();

        if (
            touch.clientX >= rect.left &&
            touch.clientX <= rect.right &&
            touch.clientY >= rect.top &&
            touch.clientY <= rect.bottom
        ) {
            const position = screenToFlowPosition({
                x: touch.clientX,
                y: touch.clientY,
            });

            position.x -= 50;
            position.y -= 25;

            addNewNode(type, label, position);
        }
    };

    const handleTapAdd = (type: string, label: string) => {
        if (!reactFlowWrapper.current) return;
        const rect = reactFlowWrapper.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const position = screenToFlowPosition({
            x: centerX,
            y: centerY,
        });

        addNewNode(type, label, position);
    };

    const addNewNode = (type: string, label: string, position: { x: number; y: number }) => {
        const newNode = {
            id: `${type}-${Date.now()}`,
            type,
            position,
            data: { label },
        };

        useStore.setState((state) => ({
            nodes: [...state.nodes, newNode],
        }));

        useStore.getState().validateTopology();
    };

    const handleNodeClick = (_event: React.MouseEvent, node: Node) => {
        if (node.type === 'laptopNode') {
            openLaptopDesktop(node.id);
        }
    };

    const handleNodeContextMenu = (event: React.MouseEvent, node: Node) => {
        event.preventDefault();

        if (node.type === 'dlinkNode') {
            setContextMenuNode({
                id: node.id,
                x: event.clientX,
                y: event.clientY,
            });
            return;
        }

        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        setNodeToDelete({ id: node.id, label: node.data?.label || node.id });
    };

    const handleDeleteNode = () => {
        if (!nodeToDelete) return;
        deleteNode(nodeToDelete.id);
        setNodeToDelete(null);
    };

    const handleConfirmReset = () => {
        const store = useStore.getState() as any;
        if (typeof store.resetAll === 'function') {
            store.resetAll();
        } else if (typeof store.resetTopology === 'function') {
            store.resetTopology();
        } else {
            useStore.setState({
                nodes: [],
                edges: [],
            });
            if (typeof store.validateTopology === 'function') {
                store.validateTopology();
            }
        }
        setShowResetModal(false);
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            width: '100vw',
            height: '100vh',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            color: '#000000',
            colorScheme: 'light'
        }}>
            <style>{`
                .react-flow, .react-flow__pane, .react-flow__viewport {
                    background-color: #ffffff !important;
                    color: #000000 !important;
                    color-scheme: light !important;
                }
                .react-flow__panel {
                    color-scheme: light !important;
                }
            `}</style>

            <div style={{
                ...sidebarContainerStyle,
                width: isMobile ? '100%' : '240px',
                height: isMobile ? 'auto' : '100%',
                maxHeight: isMobile ? '35vh' : 'none',
                overflowY: 'auto',
                borderRight: isMobile ? 'none' : '1px solid #e5e7eb',
                borderBottom: isMobile ? '1px solid #e5e7eb' : 'none',
                flexDirection: isMobile ? 'row' : 'column',
                flexWrap: isMobile ? 'wrap' : 'nowrap',
                justifyContent: isMobile ? 'center' : 'flex-start',
            }}>
                {!isMobile && (
                    <>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px', color: '#1f2937' }}>
                            Topology Builder
                        </h2>
                        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px' }}>
                            Drag or tap components:
                        </p>
                    </>
                )}

                <div
                    draggable
                    onDragStart={(e) => onDragStart(e, 'ispNode', 'Cloud ISP')}
                    onTouchStart={() => handleTouchStart('ispNode', 'Cloud ISP')}
                    onTouchEnd={handleTouchEnd}
                    onClick={() => isMobile && handleTapAdd('ispNode', 'Cloud ISP')}
                    style={paletteItemStyle}
                >
                    <img src={ispImg} alt="ISP" style={sidebarIconStyle} />
                    <span>Cloud ISP</span>
                </div>

                <div
                    draggable
                    onDragStart={(e) => onDragStart(e, 'dlinkNode', 'D-Link DIR-612')}
                    onTouchStart={() => handleTouchStart('dlinkNode', 'D-Link DIR-612')}
                    onTouchEnd={handleTouchEnd}
                    onClick={() => isMobile && handleTapAdd('dlinkNode', 'D-Link DIR-612')}
                    style={paletteItemStyle}
                >
                    <img src={apImg} alt="D-Link" style={sidebarIconStyle} />
                    <span>D-Link DIR-612</span>
                </div>

                <div
                    draggable
                    onDragStart={(e) => onDragStart(e, 'routerNode', 'Router MikroTik')}
                    onTouchStart={() => handleTouchStart('routerNode', 'Router MikroTik')}
                    onTouchEnd={handleTouchEnd}
                    onClick={() => isMobile && handleTapAdd('routerNode', 'Router MikroTik')}
                    style={paletteItemStyle}
                >
                    <img src={routerImg} alt="Router" style={sidebarIconStyle} />
                    <span>Router MikroTik</span>
                </div>

                <div
                    draggable
                    onDragStart={(e) => onDragStart(e, 'switchNode', 'Switch')}
                    onTouchStart={() => handleTouchStart('switchNode', 'Switch')}
                    onTouchEnd={handleTouchEnd}
                    onClick={() => isMobile && handleTapAdd('switchNode', 'Switch')}
                    style={paletteItemStyle}
                >
                    <img src={switchImg} alt="Switch" style={sidebarIconStyle} />
                    <span>Switch</span>
                </div>

                <div
                    draggable
                    onDragStart={(e) => onDragStart(e, 'laptopNode', 'Laptop/PC')}
                    onTouchStart={() => handleTouchStart('laptopNode', 'Laptop/PC')}
                    onTouchEnd={handleTouchEnd}
                    onClick={() => isMobile && handleTapAdd('laptopNode', 'Laptop/PC')}
                    style={paletteItemStyle}
                >
                    <img src={laptopImg} alt="Laptop" style={sidebarIconStyle} />
                    <span>Laptop/PC</span>
                </div>

                <div style={{
                    ...statusCardStyle,
                    marginTop: isMobile ? '0px' : 'auto',
                    backgroundColor: isTopologyValid ? '#dcfce7' : '#fef2f2',
                    padding: isMobile ? '6px 12px' : '12px'
                }}>
                    <div style={{ fontSize: '10px', color: '#4b5563', fontWeight: 'bold' }}>Status:</div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: isTopologyValid ? '#15803d' : '#b91c1c' }}>
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
                        padding: isMobile ? '8px 12px' : '12px',
                        fontSize: isMobile ? '12px' : '14px',
                        width: isMobile ? 'auto' : '100%'
                    }}
                >
                    Launch WinBox
                </button>

                <button
                    onClick={() => setShowResetModal(true)}
                    style={{
                        ...btnResetStyle,
                        padding: isMobile ? '8px 12px' : '10px 12px',
                        fontSize: isMobile ? '12px' : '13px',
                        width: isMobile ? 'auto' : '100%',
                        marginTop: isMobile ? '0px' : '6px'
                    }}
                >
                    🔄 Reset Semua
                </button>
            </div>

            <div
                ref={reactFlowWrapper}
                style={{
                    flexGrow: 1,
                    height: '100%',
                    width: '100%',
                    position: 'relative',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    colorScheme: 'light'
                }}
                onClick={() => setContextMenuNode(null)}
            >
                <DLinkContextMenu />

                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onNodeClick={handleNodeClick}
                    onNodeContextMenu={handleNodeContextMenu}
                    fitViewOptions={{ padding: 0.2 }}
                    snapToGrid={true}
                    snapGrid={[15, 15]}
                    panOnScroll={true}
                    zoomOnPinch={true}
                    preventScrolling={false}
                    connectOnClick={true}
                    connectionRadius={35}
                    style={{ backgroundColor: '#ffffff' }}
                >
                    <WirelessEngine />
                    <Background color="#d1d5db" gap={16} />
                    <Controls />
                    <MiniMap style={{ display: isMobile ? 'none' : 'block' }} />
                </ReactFlow>
            </div>

            {nodeToDelete && (
                <div style={modalOverlayStyle}>
                    <div style={modalBoxStyle}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🗑️</div>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '6px', color: '#111827' }}>
                            Hapus Perangkat?
                        </h3>
                        <p style={{ fontSize: '13px', color: '#4b5563', marginBottom: '18px' }}>
                            Apakah Anda yakin ingin menghapus <strong>{nodeToDelete.label}</strong> dari topologi?
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setNodeToDelete(null)} style={btnCancelStyle}>
                                Batal
                            </button>
                            <button onClick={handleDeleteNode} style={btnConfirmDeleteStyle}>
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showResetModal && (
                <div style={modalOverlayStyle}>
                    <div style={modalBoxStyle}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔄</div>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '6px', color: '#111827' }}>
                            Reset Semua Topologi?
                        </h3>
                        <p style={{ fontSize: '13px', color: '#4b5563', marginBottom: '18px' }}>
                            Tindakan ini akan mengosongkan topologi.
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setShowResetModal(false)} style={btnCancelStyle}>
                                Batal
                            </button>
                            <button onClick={handleConfirmReset} style={btnConfirmDeleteStyle}>
                                Reset Sekarang
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <DLinkConfigurationDesktop />
            <LaptopDesktop />
        </div>
    );
};

export const TopologyBuilder = () => {
    return (
        <ReactFlowProvider>
            <TopologyCanvas />
        </ReactFlowProvider>
    );
};

const sidebarContainerStyle: React.CSSProperties = {
    padding: '12px',
    background: '#f9fafb',
    display: 'flex',
    gap: '8px',
    zIndex: 10,
    userSelect: 'none',
    touchAction: 'manipulation'
};

const paletteItemStyle: React.CSSProperties = {
    padding: '8px 12px',
    background: '#ffffff',
    color: '#000000',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'grab',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    touchAction: 'none'
};

const sidebarIconStyle: React.CSSProperties = {
    width: '24px',
    height: '24px',
    objectFit: 'contain'
};

const statusCardStyle: React.CSSProperties = {
    borderRadius: '6px',
    textAlign: 'center',
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
};

const btnWinBoxStyle: React.CSSProperties = {
    color: 'white',
    fontWeight: 'bold',
    borderRadius: '6px',
    border: 'none',
};

const btnResetStyle: React.CSSProperties = {
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    border: '1px solid #fca5a5',
    fontWeight: 'bold',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
};

const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '16px'
};

const modalBoxStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    width: '100%',
    maxWidth: '320px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
    textAlign: 'center',
    color: '#000000'
};

const btnCancelStyle: React.CSSProperties = {
    flex: 1,
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer'
};

const btnConfirmDeleteStyle: React.CSSProperties = {
    flex: 1,
    padding: '10px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#dc2626',
    color: '#ffffff',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer'
};