import React, { useState } from 'react';
import { Share2, X, Copy, Check, Printer } from 'lucide-react';
import { MassEvent } from '../types/cantus';
import { getMassPositionLabel, getLiturgicalSeasonLabel } from '../utils/cantusUtils';

interface ExportProgramModalProps {
  currentMass: MassEvent;
  onClose: () => void;
}

export const ExportProgramModal: React.FC<ExportProgramModalProps> = ({
  currentMass,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const massTitle = currentMass.title || currentMass.name || 'Thánh Lễ';
  const season = currentMass.liturgicalSeason || currentMass.season;

  // Generate Zalo formatted text string matching prompt request format
  const formattedText = `CHƯƠNG TRÌNH THÁNH CA
${massTitle}
${currentMass.date} · ${getLiturgicalSeasonLabel(season)}

${currentMass.program.map(p => {
  let line = `${p.positionLabel || getMassPositionLabel(p.position)}: ${p.title}`;
  if (p.composer) line += ` (${p.composer})`;
  if (p.key) line += ` - Tone ${p.key}`;
  if (p.rhythm) line += ` [${p.rhythm}]`;
  if (p.hasSolo && p.soloSinger) line += ` - Solo: ${p.soloSinger}`;
  if (p.notes) line += `\n-> Note: ${p.notes}`;
  return line;
}).join('\n\n')}

Người đàn: ${currentMass.accompanist || 'N/A'} · Phụ trách: ${currentMass.conductor || 'N/A'}
Ca đoàn Cantus`;

  const handleCopyText = () => {
    navigator.clipboard.writeText(formattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-stone-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-700 pb-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-amber-500" />
            <span>Xuất Chương Trình Gửi Nhóm Zalo / In Ấn</span>
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formatted Copy Text */}
        <div className="space-y-2 text-xs">
          <label className="block font-semibold text-slate-500">Định dạng văn bản đẹp để gửi tin nhắn Zalo ca đoàn:</label>
          <textarea
            readOnly
            value={formattedText}
            rows={10}
            className="w-full bg-stone-50 dark:bg-slate-900 p-3 rounded-xl border border-stone-300 dark:border-slate-700 font-mono text-slate-900 dark:text-slate-200 text-[11px]"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={handlePrint}
            className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>In Chương Trình</span>
          </button>

          <button
            onClick={handleCopyText}
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs shadow flex items-center justify-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-900" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Đã sao chép!' : 'Sao chép văn bản Zalo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
