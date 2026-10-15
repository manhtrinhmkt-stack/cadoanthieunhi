import React, { useState } from 'react';
import { Copy, X, Check } from 'lucide-react';
import { MassEvent } from '../types/cantus';

interface CopyProgramModalProps {
  currentMass: MassEvent;
  allMasses: MassEvent[];
  onCopyFromMass: (sourceMass: MassEvent) => void;
  onClose: () => void;
}

export const CopyProgramModal: React.FC<CopyProgramModalProps> = ({
  currentMass,
  allMasses,
  onCopyFromMass,
  onClose,
}) => {
  const [selectedMassId, setSelectedMassId] = useState('');

  const otherMasses = allMasses.filter(m => m.id !== currentMass.id);

  const handleCopy = () => {
    const source = allMasses.find(m => m.id === selectedMassId);
    if (!source) return;
    onCopyFromMass(source);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200 dark:border-slate-700">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-700 pb-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Copy className="w-5 h-5 text-amber-500" />
            <span>Sao Chép Chương Trình Thánh Ca</span>
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <p className="text-slate-600 dark:text-slate-300">
            Chọn chương trình của một Thánh lễ trước để áp dụng toàn bộ danh sách bài hát vào <strong>{currentMass.name}</strong>:
          </p>

          <div>
            <label className="block font-semibold text-slate-500 mb-1">Chọn Thánh lễ nguồn:</label>
            <select
              value={selectedMassId}
              onChange={(e) => setSelectedMassId(e.target.value)}
              className="w-full bg-stone-50 dark:bg-slate-900 p-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
            >
              <option value="">-- Chọn Thánh lễ mẫu --</option>
              {otherMasses.map(m => (
                <option key={m.id} value={m.id}>
                  {m.date} - {m.name} ({m.program.length} bài)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 bg-stone-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-2.5 rounded-xl text-xs"
          >
            Hủy
          </button>
          <button
            onClick={handleCopy}
            disabled={!selectedMassId}
            className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold py-2.5 rounded-xl text-xs shadow flex items-center justify-center gap-1"
          >
            <Check className="w-4 h-4" />
            <span>Sao Chép Chương Trình</span>
          </button>
        </div>
      </div>
    </div>
  );
};
