import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  BookOpen, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Edit3, 
  Trash2,
  Calendar,
  Mic,
  Music
} from 'lucide-react';
import { Personnel, RehearsalPlan, MassEvent } from '../types/cantus';

interface PersonnelModuleProps {
  personnel: Personnel[];
  rehearsals: RehearsalPlan[];
  masses: MassEvent[];
  onSavePersonnel: (p: Personnel) => void;
  onSaveRehearsal: (r: RehearsalPlan) => void;
}

export const PersonnelModule: React.FC<PersonnelModuleProps> = ({
  personnel,
  rehearsals,
  masses,
  onSavePersonnel,
  onSaveRehearsal,
}) => {
  const [activeTab, setActiveTab] = useState<'PERSONNEL' | 'REHEARSAL'>('PERSONNEL');
  const [showAddPersonnelModal, setShowAddPersonnelModal] = useState(false);

  // New personnel form state
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'SOLO' | 'ORGANIST' | 'CONDUCTOR' | 'CHOIR_MEMBER'>('CHOIR_MEMBER');
  const [newVoice, setNewVoice] = useState<'SOPRANO' | 'ALTO' | 'TENOR' | 'BASS'>('SOPRANO');
  const [newPhone, setNewPhone] = useState('');

  const handleCreatePersonnel = () => {
    if (!newName) return;

    const p: Personnel = {
      id: 'p-' + Date.now(),
      name: newName,
      role: newRole,
      voicePart: newVoice,
      phone: newPhone,
      status: 'ACTIVE'
    };

    onSavePersonnel(p);
    setShowAddPersonnelModal(false);
    setNewName('');
    setNewPhone('');
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-stone-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            <span>05. Nhân Sự Ca Đoàn & Kế Hoạch Tập Hát</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Danh sách ca viên, người đàn, solo, ca trưởng & kế hoạch các buổi tập hát hàng tuần.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-stone-100 dark:bg-slate-900 p-1.5 rounded-xl border border-stone-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('PERSONNEL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'PERSONNEL'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Danh Sách Nhân Sự
          </button>
          <button
            onClick={() => setActiveTab('REHEARSAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'REHEARSAL'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Kế Hoạch Tập Hát
          </button>
        </div>
      </div>

      {activeTab === 'PERSONNEL' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Danh Sách Ca Viên & Ban Điều Hành ({personnel.length} thành viên)
            </h3>

            <button
              onClick={() => setShowAddPersonnelModal(true)}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs px-3.5 py-2 rounded-xl font-bold shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Ca Viên Mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {personnel.map((p) => (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-200 dark:border-slate-700 p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-md">
                    {p.role === 'ORGANIST' ? 'Người đàn' : p.role === 'CONDUCTOR' ? 'Ca trưởng' : p.role === 'SOLO' ? 'Soloist' : 'Ca viên'}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">Bè {p.voicePart || 'Tổng hợp'}</span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">{p.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">SĐT: {p.phone || 'Chưa cập nhật'}</p>
                </div>

                {p.notes && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-stone-50 dark:bg-slate-900 p-2 rounded-lg border border-stone-200 dark:border-slate-700/60 italic">
                    "{p.notes}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Rehearsal Plan Manager */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Lịch & Tiến Độ Tập Hát Chuẩn Bị Thánh Lễ
            </h3>
          </div>

          {rehearsals.map((r) => {
            const mass = masses.find(m => m.id === r.massEventId);

            return (
              <div
                key={r.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-200 dark:border-slate-700 p-5 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-slate-700 pb-3">
                  <div>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block">
                      Lịch tập: {r.rehearsalDate}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      Chuẩn bị cho: {mass?.name || 'Thánh lễ sắp tới'}
                    </h4>
                  </div>
                  <div className="text-xs text-slate-500 font-semibold">
                    Ca trưởng hướng dẫn: {r.conductor}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Danh mục bài tập:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {r.items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-stone-50 dark:bg-slate-900 p-3 rounded-xl border border-stone-200 dark:border-slate-700 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">{item.songTitle}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'DA_XONG' ? 'bg-emerald-100 text-emerald-800' :
                            item.status === 'CAN_ON' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {item.status === 'DA_XONG' ? 'Đã xong' : item.status === 'CAN_ON' ? 'Cần ôn' : 'Bài mới'}
                          </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 italic">Trọng tâm: {item.keyFocus}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Personnel Modal */}
      {showAddPersonnelModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Thêm Nhân Sự Ca Đoàn Mới</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Họ và tên:</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-slate-900 p-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  placeholder="e.g. Nguyễn Văn C"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Chức vụ / Vai trò chính:</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full bg-stone-50 dark:bg-slate-900 p-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="CHOIR_MEMBER">Ca viên</option>
                  <option value="SOLO">Soloist</option>
                  <option value="ORGANIST">Người đàn</option>
                  <option value="CONDUCTOR">Ca trưởng</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Bè hát:</label>
                <select
                  value={newVoice}
                  onChange={(e) => setNewVoice(e.target.value as any)}
                  className="w-full bg-stone-50 dark:bg-slate-900 p-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="SOPRANO">Nữ cao (Soprano)</option>
                  <option value="ALTO">Nữ trung (Alto)</option>
                  <option value="TENOR">Nam cao (Tenor)</option>
                  <option value="BASS">Nam trầm (Bass)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Số điện thoại liên hệ:</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-slate-900 p-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowAddPersonnelModal(false)}
                className="flex-1 bg-stone-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-2.5 rounded-xl text-xs"
              >
                Hủy
              </button>
              <button
                onClick={handleCreatePersonnel}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs shadow"
              >
                Thêm Thành Viên
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
