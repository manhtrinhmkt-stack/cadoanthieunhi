import React, { useState } from 'react';
import { 
  BarChart3, 
  Search, 
  Repeat, 
  Music, 
  Calendar, 
  Award, 
  Printer,
  ChevronRight,
  TrendingUp,
  History
} from 'lucide-react';
import { Song, MassEvent, SheetPrintArchive } from '../types/cantus';
import { getMassPositionLabel } from '../utils/cantusUtils';

interface StatsLookupModuleProps {
  songs: Song[];
  masses: MassEvent[];
  archives: SheetPrintArchive[];
}

export const StatsLookupModule: React.FC<StatsLookupModuleProps> = ({
  songs,
  masses,
  archives,
}) => {
  const [activeTab, setActiveTab] = useState<'LOOKUP' | 'STATS' | 'REPETITION'>('LOOKUP');
  const [lookupQuery, setLookupQuery] = useState('');

  // Calculate top songs
  const songFrequencyMap: { [key: string]: { count: number; composer: string; firstYear: string; recentYear: string } } = {};
  masses.forEach(m => {
    m.program.forEach(p => {
      const title = (p.title || '').trim();
      if (!title) return;
      if (!songFrequencyMap[title]) {
        songFrequencyMap[title] = {
          count: 0,
          composer: p.composer || 'N/A',
          firstYear: m.date.substring(0, 4),
          recentYear: m.date.substring(0, 4)
        };
      }
      songFrequencyMap[title].count += 1;
      if (m.date.substring(0, 4) < songFrequencyMap[title].firstYear) {
        songFrequencyMap[title].firstYear = m.date.substring(0, 4);
      }
      if (m.date.substring(0, 4) > songFrequencyMap[title].recentYear) {
        songFrequencyMap[title].recentYear = m.date.substring(0, 4);
      }
    });
  });

  const sortedTopSongs = Object.entries(songFrequencyMap)
    .sort((a, b) => b[1].count - a[1].count);

  // Calculate top composers
  const composerMap: { [key: string]: number } = {};
  songs.forEach(s => {
    if (s.composer) {
      composerMap[s.composer] = (composerMap[s.composer] || 0) + 1;
    }
  });

  const sortedTopComposers = Object.entries(composerMap)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {/* Header & Sub-tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-stone-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            <span>06. Tra Cứu Hai Chiều & Thống Kê Phụng Vụ</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tra cứu chiều 1 (Thánh lễ → Bài hát) & chiều 2 (Bài hát → Lịch sử Thánh lễ), cảnh báo trùng bài & báo cáo năm.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-stone-100 dark:bg-slate-900 p-1.5 rounded-xl border border-stone-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('LOOKUP')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'LOOKUP'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tra Cứu Hai Chiều
          </button>
          <button
            onClick={() => setActiveTab('STATS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'STATS'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Thống Kê Tần Suất
          </button>
        </div>
      </div>

      {activeTab === 'LOOKUP' ? (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-stone-200 dark:border-slate-700 shadow-sm">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                placeholder="Nhập tên bài hát OR tên ngày lễ để tra cứu hai chiều..."
                className="w-full bg-stone-50 dark:bg-slate-900 text-xs pl-9 pr-3 py-2.5 rounded-lg border border-stone-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Direct 1: Search Mass -> see songs */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-stone-200 dark:border-slate-700 space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>Chiều 1: Từ Thánh lễ → Xem các bài hát đã dùng</span>
              </h3>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {masses
                  .filter(m => {
                    const mTitle = m.title || m.name || '';
                    return mTitle.toLowerCase().includes(lookupQuery.toLowerCase()) || m.date.includes(lookupQuery);
                  })
                  .map(m => (
                    <div key={m.id} className="bg-stone-50 dark:bg-slate-900 p-3 rounded-xl border border-stone-200 dark:border-slate-700 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-amber-600 dark:text-amber-400">{m.date} - {m.title || m.name}</span>
                        <span className="text-slate-400">Năm {m.cycle}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 text-[11px]">
                        {m.program.map((p, idx) => (
                          <span key={idx} className="bg-stone-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded font-medium">
                            {p.positionLabel}: <strong>{p.title}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Direct 2: Search Song -> see masses */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-stone-200 dark:border-slate-700 space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Music className="w-4 h-4 text-amber-500" />
                <span>Chiều 2: Từ Bài hát → Xem danh sách các Thánh lễ</span>
              </h3>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {songs
                  .filter(s => s.title.toLowerCase().includes(lookupQuery.toLowerCase()) || s.composer.toLowerCase().includes(lookupQuery))
                  .map(s => {
                    const matchedMasses: { date: string; name: string; position: string }[] = [];
                    masses.forEach(m => {
                      m.program.forEach(p => {
                        const pTitle = p.title || '';
                        if (pTitle.toLowerCase().trim() === s.title.toLowerCase().trim()) {
                          matchedMasses.push({ date: m.date, name: m.title || m.name || '', position: p.positionLabel || '' });
                        }
                      });
                    });

                    return (
                      <div key={s.id} className="bg-stone-50 dark:bg-slate-900 p-3 rounded-xl border border-stone-200 dark:border-slate-700 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-slate-900 dark:text-white">{s.title} ({s.composer})</span>
                          <span className="text-amber-500 font-extrabold">{matchedMasses.length} lần hát</span>
                        </div>

                        <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                          {matchedMasses.map((mm, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <span>• {mm.date} - {mm.name}</span>
                              <span className="font-semibold text-amber-600 dark:text-amber-400">{mm.position}</span>
                            </div>
                          ))}
                          {matchedMasses.length === 0 && <p className="italic">Chưa có lịch sử hát.</p>}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Top Songs & Composers Stats */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-stone-200 dark:border-slate-700 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Bài Hát Được Sử Dụng Nhiều Nhất</span>
            </h3>

            <div className="space-y-2 text-xs">
              {sortedTopSongs.slice(0, 8).map(([title, info], idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-stone-50 dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-700/60">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{idx + 1}. {title}</span>
                    <span className="text-[11px] text-slate-400">Tác giả: {info.composer} (Lần đầu: {info.firstYear} · Gần nhất: {info.recentYear})</span>
                  </div>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
                    {info.count} lần
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-stone-200 dark:border-slate-700 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Tác Giả Nổi Bật Trong Thư Viện</span>
            </h3>

            <div className="space-y-2 text-xs">
              {sortedTopComposers.slice(0, 8).map(([composer, count], idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-stone-50 dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-700/60">
                  <span className="font-bold text-slate-900 dark:text-white">{idx + 1}. {composer}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{count} tác phẩm</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
