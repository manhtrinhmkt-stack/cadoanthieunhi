import React, { useState } from 'react';
import { Plus, X, Calendar, Check } from 'lucide-react';
import { MassEvent, LiturgicalSeason, LiturgicalCycle, FeastType, LiturgicalColor } from '../types/cantus';
import { getLiturgicalCycleForYear } from '../utils/cantusUtils';

interface NewMassModalProps {
  onSave: (newMass: MassEvent) => void;
  onClose: () => void;
}

export const NewMassModal: React.FC<NewMassModalProps> = ({
  onSave,
  onClose,
}) => {
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [time, setTime] = useState('06:00');
  const [name, setName] = useState('Chúa nhật XXIX Thường Niên');
  const [season, setSeason] = useState<LiturgicalSeason>('THUONG_NIEN');
  const [feastType, setFeastType] = useState<FeastType>('CHUA_NHAT');
  const [accompanist, setAccompanist] = useState('Nguyễn Văn A');
  const [conductor, setConductor] = useState('Trần Văn B');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!date || !name) return;

    const year = parseInt(date.substring(0, 4), 10);
    const cycle = getLiturgicalCycleForYear(year);

    const newMass: MassEvent = {
      id: 'm-' + Date.now(),
      date,
      time,
      name,
      season,
      liturgicalColor: season === 'THUONG_NIEN' ? 'GREEN' : season === 'GIANG_SINH' || season === 'PHUC_SINH' ? 'WHITE' : 'PURPLE',
      cycle,
      feastType,
      status: 'DRAFT',
      accompanist,
      conductor,
      notes,
      program: [
        { id: 'p-' + Date.now() + '-1', position: 'NL', positionLabel: 'Nhập lễ', songId: null, title: 'Nhờ Máu Thánh Chúa', composer: 'Nhạc sĩ Bùi Loan', key: 'F', rhythm: 'Ballad', hasSolo: false, soloSinger: '', accompanist, notes: '' },
        { id: 'p-' + Date.now() + '-2', position: 'DC', positionLabel: 'Đáp ca', songId: null, title: 'Thánh Vịnh 22 - Chúa Là Mục Tử', composer: 'Kim Long', key: 'G', rhythm: 'Chant', hasSolo: true, soloSinger: 'Lê Thị C', accompanist, notes: '' },
        { id: 'p-' + Date.now() + '-3', position: 'ALL', positionLabel: 'Alleluia', songId: null, title: 'Alleluia - Tung Hô Tin Mừng', composer: 'Thành Tâm', key: 'C', rhythm: 'March', hasSolo: false, soloSinger: '', accompanist, notes: '' },
        { id: 'p-' + Date.now() + '-4', position: 'DL', positionLabel: 'Dâng lễ', songId: null, title: 'Hạt Lúa Trong Đồng', composer: 'Mi Trầm', key: 'Am', rhythm: 'Ballad', hasSolo: false, soloSinger: '', accompanist, notes: '' },
        { id: 'p-' + Date.now() + '-5', position: 'HL', positionLabel: 'Hiệp lễ', songId: null, title: 'Linh Hồn Tôi Tung Hô Chúa', composer: 'Hải Ánh', key: 'G', rhythm: 'Ballad', hasSolo: true, soloSinger: 'Lê Thị C', accompanist, notes: '' },
        { id: 'p-' + Date.now() + '-6', position: 'KL', positionLabel: 'Kết lễ', songId: null, title: 'Nguyện Cầu Cho Xứ Đạo', composer: 'Phanxicô', key: 'D', rhythm: 'March', hasSolo: false, soloSinger: '', accompanist, notes: '' }
      ]
    };

    onSave(newMass);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200 dark:border-slate-700">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-700 pb-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            <span>Thêm Thánh Lễ Phụng Vụ Mới</span>
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-500 mb-1">Ngày cử hành:</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-stone-50 dark:bg-slate-900 p-2.5 rounded-xl border border-stone-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-500 mb-1">Giờ hát lễ:</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-stone-50 dark:bg-slate-900 p-2.5 rounded-xl border border-stone-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                placeholder="06:00, 18:00..."
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-500 mb-1">Tên ngày lễ / Chúa nhật:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-stone-50 dark:bg-slate-900 p-2.5 rounded-xl border border-stone-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
              placeholder="e.g. Chúa nhật XXIX Thường Niên"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-500 mb-1">Mùa phụng vụ:</label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value as LiturgicalSeason)}
                className="w-full bg-stone-50 dark:bg-slate-900 p-2.5 rounded-xl border border-stone-300 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
              >
                <option value="THUONG_NIEN">Mùa Thường Niên</option>
                <option value="MUA_VONG">Mùa Vọng</option>
                <option value="GIANG_SINH">Mùa Giáng Sinh</option>
                <option value="MUA_CHAY">Mùa Chay</option>
                <option value="PHUC_SINH">Mùa Phục Sinh</option>
                <option value="LE_TRONG">Lễ Trọng</option>
                <option value="DAC_BIET">Lễ Kính / Đặc Biệt</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-500 mb-1">Loại lễ:</label>
              <select
                value={feastType}
                onChange={(e) => setFeastType(e.target.value as FeastType)}
                className="w-full bg-stone-50 dark:bg-slate-900 p-2.5 rounded-xl border border-stone-300 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
              >
                <option value="CHUA_NHAT">Chúa Nhật</option>
                <option value="LE_TRONG">Lễ Trọng</option>
                <option value="LE_KINH">Lễ Kính</option>
                <option value="LE_NHO">Lễ Nhớ</option>
                <option value="DAC_BIET">Dịp Đặc Biệt</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-500 mb-1">Người đàn:</label>
              <input
                type="text"
                value={accompanist}
                onChange={(e) => setAccompanist(e.target.value)}
                className="w-full bg-stone-50 dark:bg-slate-900 p-2.5 rounded-xl border border-stone-300 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-500 mb-1">Phụ trách / Ca trưởng:</label>
              <input
                type="text"
                value={conductor}
                onChange={(e) => setConductor(e.target.value)}
                className="w-full bg-stone-50 dark:bg-slate-900 p-2.5 rounded-xl border border-stone-300 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
              />
            </div>
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
            onClick={handleSave}
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs shadow flex items-center justify-center gap-1"
          >
            <Check className="w-4 h-4" />
            <span>Tạo Thánh Lễ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
