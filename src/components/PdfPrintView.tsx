import React from 'react';
import { MassEvent } from '../types/cantus';
import { getMassPositionLabel, getLiturgicalSeasonLabel } from '../utils/cantusUtils';

interface PdfPrintViewProps {
  mass: MassEvent;
  onClose: () => void;
}

export const PdfPrintView: React.FC<PdfPrintViewProps> = ({ mass, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-stone-200 space-y-6 max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center no-print border-b border-stone-100 pb-3">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Xem trước bản in A4</span>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl shadow-xs">
              In A4 / Xuất PDF
            </button>
            <button onClick={onClose} className="bg-stone-100 hover:bg-stone-200 text-slate-800 font-bold text-xs px-3.5 py-2 rounded-xl">
              Đóng
            </button>
          </div>
        </div>

        {/* A4 Printable Sheet Content */}
        <div className="space-y-6 p-4 border border-stone-200 rounded-2xl bg-white text-slate-900 font-serif">
          {/* Sheet Header */}
          <div className="text-center space-y-1 pb-4 border-b-2 border-slate-900">
            <p className="text-xs tracking-widest uppercase font-sans text-stone-500 font-bold">CHƯƠNG TRÌNH THÁNH CA PHỤNG VỤ</p>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{mass.title || mass.name}</h1>
            <p className="text-sm italic font-medium text-stone-700">
              Ngày cử hành: <strong>{mass.date}</strong> · {getLiturgicalSeasonLabel(mass.liturgicalSeason || mass.season || 'THUONG_NIEN')}
            </p>
            {(mass.accompanist || mass.conductor) && (
              <p className="text-xs font-sans text-stone-600 font-semibold pt-1">
                Người đàn: {mass.accompanist || 'N/A'} · Ca trưởng: {mass.conductor || 'N/A'}
              </p>
            )}
          </div>

          {/* Program Table */}
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-800 text-slate-900 font-bold uppercase tracking-wider font-sans">
                <th className="py-2 px-1 w-28">Vị trí</th>
                <th className="py-2 px-2">Tên bài hát</th>
                <th className="py-2 px-2 w-32">Tác giả</th>
                <th className="py-2 px-2 w-20 text-center">Tone</th>
                <th className="py-2 px-2 w-28">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {mass.program.map((p, idx) => (
                <tr key={idx} className="align-top">
                  <td className="py-2.5 px-1 font-bold font-sans text-amber-900">
                    {p.positionLabel || getMassPositionLabel(p.position)}
                  </td>
                  <td className="py-2.5 px-2 font-extrabold text-sm">
                    {p.title}
                    {p.soloist && <span className="block text-[11px] font-sans font-semibold text-purple-900 italic">Solo: {p.soloist}</span>}
                  </td>
                  <td className="py-2.5 px-2 italic text-stone-700">{p.composer || '-'}</td>
                  <td className="py-2.5 px-2 text-center font-bold font-sans text-amber-900">{p.key || '-'}</td>
                  <td className="py-2.5 px-2 italic text-stone-600 font-sans text-[11px]">{p.note || p.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {mass.generalNote && (
            <div className="pt-4 border-t border-stone-200 text-xs italic text-stone-700 font-sans">
              <strong>Ghi chú chung:</strong> {mass.generalNote}
            </div>
          )}

          <div className="text-right text-[10px] text-stone-400 font-sans pt-4 italic">
            Trích xuất từ Cantus - Sổ tay Thánh ca
          </div>
        </div>
      </div>
    </div>
  );
};
