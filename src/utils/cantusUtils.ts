import { LiturgicalSeason, MassPosition, ProgramStatus, LiturgicalCycle, MassEvent } from '../types/cantus';
import * as XLSX from 'xlsx';

/**
 * Remove Vietnamese accents and diacritics for insensitive searching
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  let result = str.toLowerCase();
  result = result.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  result = result.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  result = result.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  result = result.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  result = result.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  result = result.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  result = result.replace(/đ/g, 'd');
  // Combine diacritics
  result = result.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, '');
  result = result.replace(/\u02C6|\u0306|\u031B/g, '');
  return result.trim();
}

/**
 * Insensitive Vietnamese text match
 */
export function matchVietnameseText(source: string, search: string): boolean {
  if (!search) return true;
  if (!source) return false;
  const normSource = removeVietnameseTones(source);
  const normSearch = removeVietnameseTones(search);
  return normSource.includes(normSearch);
}

export function getLiturgicalSeasonLabel(season?: LiturgicalSeason): string {
  if (!season) return 'Mùa Thường Niên';
  switch (season) {
    case 'THUONG_NIEN': return 'Mùa Thường Niên';
    case 'MUA_VONG': return 'Mùa Vọng';
    case 'GIANG_SINH': return 'Mùa Giáng Sinh';
    case 'MUA_CHAY': return 'Mùa Chay';
    case 'PHUC_SINH': return 'Mùa Phục Sinh';
    case 'LE_TRONG': return 'Lễ Trọng';
    case 'DAC_BIET': return 'Lễ Kính / Khác';
    default: return season || 'Mùa Thường Niên';
  }
}

export function getLiturgicalHeaderStyle(season?: LiturgicalSeason): {
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  headerBg: string;
  headerHover: string;
  headerText: string;
  headerBorder: string;
  rowBg: string;
  accentBar: string;
  name: string;
} {
  const s = season || 'THUONG_NIEN';
  switch (s) {
    case 'THUONG_NIEN':
      return {
        name: 'Mùa Thường Niên',
        badgeBg: 'bg-emerald-100',
        badgeText: 'text-emerald-950',
        badgeBorder: 'border-emerald-300',
        headerBg: 'bg-emerald-100',
        headerHover: 'hover:bg-emerald-200',
        headerText: 'text-emerald-950',
        headerBorder: 'border-emerald-300',
        rowBg: 'bg-emerald-50/50',
        accentBar: 'bg-emerald-600',
      };
    case 'MUA_VONG':
      return {
        name: 'Mùa Vọng',
        badgeBg: 'bg-purple-100',
        badgeText: 'text-purple-950',
        badgeBorder: 'border-purple-300',
        headerBg: 'bg-purple-100',
        headerHover: 'hover:bg-purple-200',
        headerText: 'text-purple-950',
        headerBorder: 'border-purple-300',
        rowBg: 'bg-purple-50/50',
        accentBar: 'bg-purple-600',
      };
    case 'MUA_CHAY':
      return {
        name: 'Mùa Chay',
        badgeBg: 'bg-violet-100',
        badgeText: 'text-violet-950',
        badgeBorder: 'border-violet-300',
        headerBg: 'bg-violet-100',
        headerHover: 'hover:bg-violet-200',
        headerText: 'text-violet-950',
        headerBorder: 'border-violet-300',
        rowBg: 'bg-violet-50/50',
        accentBar: 'bg-violet-700',
      };
    case 'GIANG_SINH':
      return {
        name: 'Mùa Giáng Sinh',
        badgeBg: 'bg-amber-100',
        badgeText: 'text-amber-950',
        badgeBorder: 'border-amber-300',
        headerBg: 'bg-amber-100',
        headerHover: 'hover:bg-amber-200',
        headerText: 'text-amber-950',
        headerBorder: 'border-amber-300',
        rowBg: 'bg-amber-50/50',
        accentBar: 'bg-amber-500',
      };
    case 'PHUC_SINH':
      return {
        name: 'Mùa Phục Sinh',
        badgeBg: 'bg-amber-100',
        badgeText: 'text-amber-950',
        badgeBorder: 'border-amber-300',
        headerBg: 'bg-amber-100',
        headerHover: 'hover:bg-amber-200',
        headerText: 'text-amber-950',
        headerBorder: 'border-amber-300',
        rowBg: 'bg-amber-50/50',
        accentBar: 'bg-amber-500',
      };
    case 'LE_TRONG':
    case 'DAC_BIET':
      return {
        name: 'Lễ Trọng',
        badgeBg: 'bg-rose-100',
        badgeText: 'text-rose-950',
        badgeBorder: 'border-rose-300',
        headerBg: 'bg-rose-100',
        headerHover: 'hover:bg-rose-200',
        headerText: 'text-rose-950',
        headerBorder: 'border-rose-300',
        rowBg: 'bg-rose-50/50',
        accentBar: 'bg-rose-600',
      };
    default:
      return {
        name: 'Thánh lễ',
        badgeBg: 'bg-sky-100',
        badgeText: 'text-sky-950',
        badgeBorder: 'border-sky-300',
        headerBg: 'bg-sky-100',
        headerHover: 'hover:bg-sky-200',
        headerText: 'text-sky-950',
        headerBorder: 'border-sky-300',
        rowBg: 'bg-sky-50/50',
        accentBar: 'bg-sky-500',
      };
  }
}

export function getLiturgicalSeasonColorClass(season?: LiturgicalSeason): { bg: string; text: string; border: string } {
  const style = getLiturgicalHeaderStyle(season);
  return {
    bg: style.rowBg,
    text: style.badgeText,
    border: style.badgeBorder
  };
}

export function getMassPositionLabel(pos: MassPosition): string {
  switch (pos) {
    case 'NL': return 'Nhập lễ';
    case 'DC': return 'Đáp ca';
    case 'ALL': return 'Alleluia';
    case 'DL': return 'Dâng lễ';
    case 'HL': return 'Hiệp lễ';
    case 'KL': return 'Kết lễ';
    case 'OTHER': return 'Bài khác';
    default: return pos || 'Bài khác';
  }
}

export function getMassPositionBadgeColor(pos: MassPosition): string {
  switch (pos) {
    case 'NL': return 'bg-amber-100 text-amber-900 border-amber-300';
    case 'DC': return 'bg-sky-100 text-sky-900 border-sky-300';
    case 'ALL': return 'bg-indigo-100 text-indigo-900 border-indigo-300';
    case 'DL': return 'bg-rose-100 text-rose-900 border-rose-300';
    case 'HL': return 'bg-emerald-100 text-emerald-900 border-emerald-300';
    case 'KL': return 'bg-purple-100 text-purple-900 border-purple-300';
    default: return 'bg-stone-100 text-stone-800 border-stone-300';
  }
}

export function getProgramStatusLabel(status: ProgramStatus | string): { label: string; color: string } {
  switch (status) {
    case 'DRAFT': return { label: 'Bản nháp', color: 'bg-amber-100 text-amber-900 border-amber-300' };
    case 'APPROVED':
    case 'USED': return { label: 'Đã chốt', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
    default: return { label: 'Bản nháp', color: 'bg-amber-100 text-amber-900 border-amber-300' };
  }
}

export function formatDateToDDMMYYYY(dateStr?: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr;
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    if (year.length === 4) {
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
  }
  return dateStr;
}

export function getLiturgicalCycleForYear(year: number): 'A' | 'B' | 'C' {
  const mod = (year + 1) % 3;
  if (mod === 0) return 'A';
  if (mod === 1) return 'B';
  return 'C';
}

export function checkRepetitionWarning(
  songTitle: string,
  targetDateStr: string,
  allMasses: MassEvent[],
  currentMassId?: string
): { isRecent: boolean; daysDiff?: number; lastUsedDate?: string; lastMassName?: string } {
  return { isRecent: false };
}

export function checkLentAlleluiaWarning(season?: LiturgicalSeason, position?: MassPosition, title?: string): boolean {
  if (!season || !title) return false;
  if (season === 'MUA_CHAY' && (position === 'ALL' || title.toLowerCase().includes('alleluia'))) {
    return true;
  }
  return false;
}

export function generateStorageCode(category: MassPosition, existingCodes: string[]): string {
  const prefix = category === 'OTHER' ? 'TC' : category;
  return `${prefix}-${String(existingCodes.length + 1).padStart(3, '0')}`;
}

export function getNextSundayDate(fromDateStr?: string): string {
  const base = fromDateStr ? new Date(fromDateStr) : new Date();
  const day = base.getDay();
  const diffToSunday = day === 0 ? 7 : 7 - day;
  const nextSunday = new Date(base.getTime() + diffToSunday * 86400000);
  return nextSunday.toISOString().substring(0, 10);
}

export function generateAutoSundayMass(existingMasses: MassEvent[]): MassEvent {
  let nextDate = getNextSundayDate();
  if (existingMasses && existingMasses.length > 0) {
    const dates = existingMasses.map(m => m.date).filter(Boolean).sort();
    const lastDate = dates[dates.length - 1];
    if (lastDate) {
      nextDate = getNextSundayDate(lastDate);
    }
  }

  return {
    id: 'm-' + Date.now(),
    date: nextDate,
    title: 'Chúa Nhật Thường Niên',
    liturgicalSeason: 'THUONG_NIEN',
    generalNote: 'Tự động tạo cho Lễ Chúa Nhật',
    status: 'DRAFT',
    program: [
      { id: 'p1', songId: null, position: 'NL', positionLabel: 'Nhập lễ', order: 1, hasSolo: false, title: '', composer: '', key: '', rhythm: 'Ballad' },
      { id: 'p2', songId: null, position: 'DC', positionLabel: 'Đáp ca', order: 2, hasSolo: false, title: '', composer: '', key: '', rhythm: 'Chant' },
      { id: 'p3', songId: null, position: 'ALL', positionLabel: 'Alleluia', order: 3, hasSolo: false, title: '', composer: '', key: '', rhythm: 'March' },
      { id: 'p4', songId: null, position: 'DL', positionLabel: 'Dâng lễ', order: 4, hasSolo: false, title: '', composer: '', key: '', rhythm: 'Ballad' },
      { id: 'p5', songId: null, position: 'HL', positionLabel: 'Hiệp lễ', order: 5, hasSolo: false, title: '', composer: '', key: '', rhythm: 'Ballad' },
      { id: 'p6', songId: null, position: 'KL', positionLabel: 'Kết lễ', order: 6, hasSolo: false, title: '', composer: '', key: '', rhythm: 'March' },
    ]
  };
}

export function exportToExcel(data: any[], fileName: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

export function importFromExcel(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName]);
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}
