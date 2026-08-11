import React, { useState } from 'react';
import { useStore, type FirewallNatRule } from '../../store/useStore';

interface NatRuleModalProps {
    ruleToEdit?: FirewallNatRule | null;
    onClose: () => void;
}

export const NatRuleModal: React.FC<NatRuleModalProps> = ({ ruleToEdit, onClose }) => {
    const { interfaces, addFirewallNatRule, updateFirewallNatRule } = useStore();

    const [activeTab, setActiveTab] = useState<'General' | 'Advanced' | 'Extra' | 'Action' | 'Statistics'>('General');

    // Form State
    const [chain, setChain] = useState<'srcnat' | 'dstnat'>(ruleToEdit?.chain || 'srcnat');
    const [srcAddress, setSrcAddress] = useState(ruleToEdit?.srcAddress || '');
    const [dstAddress, setDstAddress] = useState(ruleToEdit?.dstAddress || '');
    const [inInterface, setInInterface] = useState(ruleToEdit?.inInterface || '');
    const [outInterface, setOutInterface] = useState(ruleToEdit?.outInterface || 'ether1');

    const [action, setAction] = useState<FirewallNatRule['action']>(ruleToEdit?.action || 'masquerade');
    const [toAddresses, setToAddresses] = useState(ruleToEdit?.toAddresses || '');
    const [toPorts, setToPorts] = useState(ruleToEdit?.toPorts || '');
    const [comment, setComment] = useState(ruleToEdit?.comment || '');
    const [disabled, setDisabled] = useState(ruleToEdit?.disabled || false);

    const handleSave = () => {
        const payload = {
            chain,
            srcAddress: srcAddress.trim() || undefined,
            dstAddress: dstAddress.trim() || undefined,
            inInterface: inInterface || undefined,
            outInterface: outInterface || undefined,
            action,
            toAddresses: action === 'src-nat' || action === 'dst-nat' ? toAddresses.trim() : undefined,
            toPorts: action === 'redirect' || action === 'dst-nat' ? toPorts.trim() : undefined,
            comment: comment.trim() || undefined,
            disabled,
        };

        if (ruleToEdit) {
            updateFirewallNatRule(ruleToEdit.id, payload);
        } else {
            addFirewallNatRule(payload);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="w-[520px] bg-[#d4d0c8] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 shadow-xl font-sans text-xs select-none">

                {/* Title Bar WinBox Classic */}
                <div className="bg-[#000080] text-white font-bold px-2 py-1 flex justify-between items-center text-xs">
                    <span>{ruleToEdit ? `NAT Rule <${ruleToEdit.id}>` : 'New NAT Rule'}</span>
                    <button
                        onClick={onClose}
                        className="bg-[#d4d0c8] text-black font-bold px-1.5 border border-t-white border-l-white border-b-black border-r-black active:border-none"
                    >
                        ✕
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex bg-[#d4d0c8] border-b border-gray-400 px-1 pt-1 gap-0.5">
                    {(['General', 'Advanced', 'Extra', 'Action', 'Statistics'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-1 border-t border-l border-r rounded-t-sm text-xs ${activeTab === tab
                                ? 'bg-[#d4d0c8] font-bold border-gray-600 border-b-transparent relative top-[1px] z-10'
                                : 'bg-[#c0c0c0] border-gray-400 text-gray-700 hover:bg-[#d0d0d0]'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Modal Body */}
                <div className="flex p-3 gap-3 bg-[#d4d0c8]">

                    {/* Main Content Area (Tab Views) */}
                    <div className="flex-1 border border-gray-500 p-2.5 bg-[#d4d0c8] min-h-[260px]">
                        {activeTab === 'General' && (
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center">
                                    <label className="w-28 text-right pr-2">Chain:</label>
                                    <select
                                        value={chain}
                                        onChange={(e) => setChain(e.target.value as any)}
                                        className="flex-1 bg-white border border-gray-600 px-1 py-0.5 focus:outline-none"
                                    >
                                        <option value="srcnat">srcnat</option>
                                        <option value="dstnat">dstnat</option>
                                    </select>
                                </div>

                                <div className="flex items-center">
                                    <label className="w-28 text-right pr-2">Src. Address:</label>
                                    <input
                                        type="text"
                                        value={srcAddress}
                                        onChange={(e) => setSrcAddress(e.target.value)}
                                        className="flex-1 bg-white border border-gray-600 px-1 py-0.5 focus:outline-none"
                                    />
                                </div>

                                <div className="flex items-center">
                                    <label className="w-28 text-right pr-2">Dst. Address:</label>
                                    <input
                                        type="text"
                                        value={dstAddress}
                                        onChange={(e) => setDstAddress(e.target.value)}
                                        className="flex-1 bg-white border border-gray-600 px-1 py-0.5 focus:outline-none"
                                    />
                                </div>

                                <div className="flex items-center">
                                    <label className="w-28 text-right pr-2">In. Interface:</label>
                                    <select
                                        value={inInterface}
                                        onChange={(e) => setInInterface(e.target.value)}
                                        className="flex-1 bg-white border border-gray-600 px-1 py-0.5 focus:outline-none"
                                    >
                                        <option value="">(all)</option>
                                        {interfaces.map((iface) => (
                                            <option key={iface.id} value={iface.name}>
                                                {iface.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center">
                                    <label className="w-28 text-right pr-2 text-blue-900 font-medium">Out. Interface:</label>
                                    <select
                                        value={outInterface}
                                        onChange={(e) => setOutInterface(e.target.value)}
                                        className="flex-1 bg-white border border-gray-600 px-1 py-0.5 focus:outline-none"
                                    >
                                        <option value="">(all)</option>
                                        {interfaces.map((iface) => (
                                            <option key={iface.id} value={iface.name}>
                                                {iface.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Action' && (
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center">
                                    <label className="w-28 text-right pr-2 text-blue-900 font-medium">Action:</label>
                                    <select
                                        value={action}
                                        onChange={(e) => setAction(e.target.value as any)}
                                        className="flex-1 bg-white border border-gray-600 px-1 py-0.5 focus:outline-none"
                                    >
                                        <option value="masquerade">masquerade</option>
                                        <option value="src-nat">src-nat</option>
                                        <option value="dst-nat">dst-nat</option>
                                        <option value="redirect">redirect</option>
                                        <option value="accept">accept</option>
                                        <option value="drop">drop</option>
                                    </select>
                                </div>

                                {/* Dynamic Field: Input To Addresses (tampil jika src-nat atau dst-nat dipilih) */}
                                {(action === 'src-nat' || action === 'dst-nat') && (
                                    <div className="flex items-center">
                                        <label className="w-28 text-right pr-2 text-blue-900 font-medium">To Addresses:</label>
                                        <input
                                            type="text"
                                            value={toAddresses}
                                            placeholder="e.g. 200.210.220.2"
                                            onChange={(e) => setToAddresses(e.target.value)}
                                            className="flex-1 bg-white border border-gray-600 px-1 py-0.5 focus:outline-none"
                                        />
                                    </div>
                                )}

                                {/* Dynamic Field: Input To Ports (tampil jika redirect atau dst-nat) */}
                                {(action === 'redirect' || action === 'dst-nat') && (
                                    <div className="flex items-center">
                                        <label className="w-28 text-right pr-2">To Ports:</label>
                                        <input
                                            type="text"
                                            value={toPorts}
                                            onChange={(e) => setToPorts(e.target.value)}
                                            className="flex-1 bg-white border border-gray-600 px-1 py-0.5 focus:outline-none"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'Advanced' && (
                            <div className="text-gray-500 italic p-2">Advanced configurations...</div>
                        )}
                        {activeTab === 'Extra' && (
                            <div className="text-gray-500 italic p-2">Extra match criteria...</div>
                        )}
                        {activeTab === 'Statistics' && (
                            <div className="text-gray-500 italic p-2">Rule traffic counters...</div>
                        )}
                    </div>

                    {/* Right Action Sidebar (Tombol-tombol khas WinBox) */}
                    <div className="flex flex-col gap-1.5 w-24">
                        <button
                            onClick={handleSave}
                            className="bg-[#d4d0c8] hover:bg-[#e4e0d8] text-black border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 py-1 text-center font-medium active:border-none"
                        >
                            OK
                        </button>
                        <button
                            onClick={onClose}
                            className="bg-[#d4d0c8] hover:bg-[#e4e0d8] text-black border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 py-1 text-center font-medium active:border-none"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="bg-[#d4d0c8] hover:bg-[#e4e0d8] text-black border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 py-1 text-center font-medium active:border-none"
                        >
                            Apply
                        </button>
                        <button
                            onClick={() => setDisabled(!disabled)}
                            className="bg-[#d4d0c8] hover:bg-[#e4e0d8] text-black border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 py-1 text-center font-medium active:border-none"
                        >
                            {disabled ? 'Enable' : 'Disable'}
                        </button>
                        <button
                            onClick={() => {
                                const c = prompt('Comment:', comment);
                                if (c !== null) setComment(c);
                            }}
                            className="bg-[#d4d0c8] hover:bg-[#e4e0d8] text-black border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 py-1 text-center font-medium active:border-none"
                        >
                            Comment
                        </button>
                    </div>

                </div>

                {/* Footer Status Bar */}
                <div className="bg-[#d4d0c8] border-t border-gray-400 px-2 py-0.5 text-gray-700 text-[11px]">
                    {disabled ? 'disabled' : 'enabled'}
                </div>

            </div>
        </div>
    );
};