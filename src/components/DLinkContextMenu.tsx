import React from 'react';
import { useStore } from '../store/useStore';

export const DLinkContextMenu = () => {
    const { contextMenuNode, setContextMenuNode, openDLinkConfig, duplicateNode, deleteNode, renameNode } = useStore();

    if (!contextMenuNode) return null;

    const handleOpenConfig = () => {
        openDLinkConfig(contextMenuNode.id);
        setContextMenuNode(null);
    };

    const handleRename = () => {
        const newName = prompt('Enter new device name:', 'D-Link DIR-612');
        if (newName) {
            renameNode(contextMenuNode.id, newName);
        }
        setContextMenuNode(null);
    };

    const handleDuplicate = () => {
        duplicateNode(contextMenuNode.id);
        setContextMenuNode(null);
    };

    const handleDelete = () => {
        deleteNode(contextMenuNode.id);
        setContextMenuNode(null);
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: contextMenuNode.y,
                left: contextMenuNode.x,
                zIndex: 9999,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
                width: '160px',
                padding: '4px 0',
                fontSize: '12px',
                userSelect: 'none',
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <div style={menuItemStyle} onClick={handleOpenConfig}>
                ⚙️ Open Configuration
            </div>
            <div style={menuItemStyle} onClick={handleRename}>
                ✏️ Rename
            </div>
            <div style={menuItemStyle} onClick={handleDuplicate}>
                📋 Duplicate
            </div>
            <div style={{ ...menuItemStyle, color: '#ef4444' }} onClick={handleDelete}>
                🗑️ Delete
            </div>
        </div>
    );
};

const menuItemStyle: React.CSSProperties = {
    padding: '8px 12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: 500,
    color: '#334155',
};