import { Song, MassEvent, SheetArchive } from '../types/cantus';

export const INITIAL_SONGS: Song[] = [
  {
    id: 's1',
    title: 'Về bên Chúa',
    composer: 'Bùi Loan',
    categories: ['NL'],
    defaultPosition: 'NL',
    rhythm: 'Ballad',
    defaultKey: 'F',
    defaultRhythm: 'Ballad',
    storageCode: '71',
    note: 'Nhập lễ mừng vui'
  },
  {
    id: 's2',
    title: 'Hát lên bài ca',
    composer: 'Kim Long',
    categories: ['NL'],
    defaultPosition: 'NL',
    rhythm: 'March',
    defaultKey: 'G',
    defaultRhythm: 'March',
    storageCode: 'NL-002'
  },
  {
    id: 's3',
    title: 'Tv 22',
    composer: 'Kim Long',
    categories: ['DC'],
    defaultPosition: 'DC',
    rhythm: 'Chant',
    defaultKey: 'G',
    defaultRhythm: 'Chant',
    storageCode: 'DC-001'
  },
  {
    id: 's4',
    title: 'Tv 66',
    composer: 'Thành Tâm',
    categories: ['DC'],
    defaultPosition: 'DC',
    rhythm: 'Chant',
    defaultKey: 'F',
    defaultRhythm: 'Chant',
    storageCode: 'DC-002'
  },
  {
    id: 's5',
    title: 'Bài ca dâng hiến',
    composer: 'Mi Trầm',
    categories: ['DL'],
    defaultPosition: 'DL',
    rhythm: 'Ballad',
    defaultKey: 'Am',
    defaultRhythm: 'Ballad',
    storageCode: '72'
  },
  {
    id: 's6',
    title: 'Giai khúc dâng tiến 2',
    composer: 'Hải Ánh',
    categories: ['DL'],
    defaultPosition: 'DL',
    rhythm: 'Valse',
    defaultKey: 'F',
    defaultRhythm: 'Valse',
    storageCode: 'DL-005'
  },
  {
    id: 's7',
    title: 'Ngọt ngào bên Giêsu',
    composer: 'Phanxicô',
    categories: ['HL'],
    defaultPosition: 'HL',
    rhythm: 'Ballad',
    defaultKey: 'G',
    defaultRhythm: 'Ballad',
    storageCode: 'G'
  },
  {
    id: 's8',
    title: 'Đẹp thay',
    composer: 'Kim Long',
    categories: ['HL'],
    defaultPosition: 'HL',
    rhythm: 'Ballad',
    defaultKey: 'C',
    defaultRhythm: 'Ballad',
    storageCode: 'HL-012'
  },
  {
    id: 's9',
    title: 'Tình Cha nghĩa mẹ',
    composer: 'Việt Khôi',
    categories: ['KL'],
    defaultPosition: 'KL',
    rhythm: 'March',
    defaultKey: 'D',
    defaultRhythm: 'March',
    storageCode: 'KL-008'
  },
  {
    id: 's10',
    title: 'Sống chứng nhân',
    composer: 'Phanxicô',
    categories: ['KL'],
    defaultPosition: 'KL',
    rhythm: 'March',
    defaultKey: 'G',
    defaultRhythm: 'March',
    storageCode: 'KL-009'
  }
];

export const INITIAL_MASSES: MassEvent[] = [
  {
    id: 'm-2026-10-11',
    date: '2026-10-11',
    title: '28 Thường Niên',
    liturgicalSeason: 'THUONG_NIEN',
    status: 'APPROVED',
    accompanist: 'Nguyễn A',
    conductor: 'Trần B',
    program: [
      { id: 'p1', songId: 's1', position: 'NL', positionLabel: 'Nhập lễ', order: 1, title: 'Về bên Chúa', composer: 'Bùi Loan', key: '71', rhythm: 'Ballad' },
      { id: 'p2', songId: 's3', position: 'DC', positionLabel: 'Đáp ca', order: 2, hasSolo: true, soloist: 'Khánh Phương', soloSinger: 'Khánh Phương', title: 'Tv 22', composer: 'Kim Long', key: 'G' },
      { id: 'p3', songId: 's5', position: 'DL', positionLabel: 'Dâng lễ', order: 3, title: 'Bài ca dâng hiến', composer: 'Mi Trầm', key: '72', rhythm: 'Ballad' },
      { id: 'p4', songId: 's7', position: 'HL', positionLabel: 'Hiệp lễ', order: 4, title: 'Ngọt ngào bên Giêsu', composer: 'Phanxicô', key: 'G', rhythm: 'Ballad' },
      { id: 'p5', songId: 's9', position: 'KL', positionLabel: 'Kết lễ', order: 5, title: 'Tình Cha nghĩa mẹ', composer: 'Việt Khôi', key: 'D' }
    ]
  },
  {
    id: 'm-2026-10-18',
    date: '2026-10-18',
    title: '29 Thường Niên CN Truyền Giáo',
    liturgicalSeason: 'THUONG_NIEN',
    status: 'APPROVED',
    accompanist: 'Nguyễn A',
    conductor: 'Trần B',
    program: [
      { id: 'p1', songId: 's2', position: 'NL', positionLabel: 'Nhập lễ', order: 1, title: 'Hát lên bài ca', composer: 'Kim Long', key: '' },
      { id: 'p2', songId: 's4', position: 'DC', positionLabel: 'Đáp ca', order: 2, title: 'Tv 66', composer: 'Thành Tâm', key: '' },
      { id: 'p3', songId: 's6', position: 'DL', positionLabel: 'Dâng lễ', order: 3, title: 'Giai khúc dâng tiến 2', composer: 'Hải Ánh', key: '' },
      { id: 'p4', songId: 's8', position: 'HL', positionLabel: 'Hiệp lễ', order: 4, title: 'Đẹp thay', composer: 'Kim Long', key: '' },
      { id: 'p5', songId: 's10', position: 'KL', positionLabel: 'Kết lễ', order: 5, title: 'Sống chứng nhân', composer: 'Phanxicô', key: '' }
    ]
  },
  {
    id: 'm-2026-10-25',
    date: '2026-10-25',
    title: '30 Thường Niên',
    liturgicalSeason: 'THUONG_NIEN',
    status: 'DRAFT',
    program: [
      { id: 'p1', songId: null, position: 'NL', positionLabel: 'Nhập lễ', order: 1, title: '', key: '' },
      { id: 'p2', songId: null, position: 'DC', positionLabel: 'Đáp ca', order: 2, title: '', key: '' },
      { id: 'p3', songId: null, position: 'DL', positionLabel: 'Dâng lễ', order: 3, title: '', key: '' },
      { id: 'p4', songId: null, position: 'HL', positionLabel: 'Hiệp lễ', order: 4, title: '', key: '' },
      { id: 'p5', songId: null, position: 'KL', positionLabel: 'Kết lễ', order: 5, title: '', key: '' }
    ]
  },
  {
    id: 'm-2026-11-01',
    date: '2026-11-01',
    title: '31 Thường Niên',
    liturgicalSeason: 'THUONG_NIEN',
    status: 'DRAFT',
    program: []
  },
  {
    id: 'm-2026-11-08',
    date: '2026-11-08',
    title: '32 Thường Niên',
    liturgicalSeason: 'THUONG_NIEN',
    status: 'DRAFT',
    program: []
  },
  {
    id: 'm-2026-11-15',
    date: '2026-11-15',
    title: '33 Thường Niên Các Thánh Tử Đạo VN',
    liturgicalSeason: 'THUONG_NIEN',
    status: 'DRAFT',
    program: []
  },
  {
    id: 'm-2026-11-22',
    date: '2026-11-22',
    title: '34 Thường Niên Chúa Kitô Vua',
    liturgicalSeason: 'THUONG_NIEN',
    status: 'DRAFT',
    program: []
  },
  {
    id: 'm-2026-11-29',
    date: '2026-11-29',
    title: '1 Mùa Vọng',
    liturgicalSeason: 'MUA_VONG',
    status: 'APPROVED',
    program: [
      { id: 'p1', songId: 's1', position: 'NL', positionLabel: 'Nhập lễ', order: 1, title: 'Về bên Chúa', key: '71' },
      { id: 'p2', songId: 's3', position: 'DC', positionLabel: 'Đáp ca', order: 2, hasSolo: true, soloist: 'Khánh Phương', soloSinger: 'Khánh Phương', title: 'Tv 22', key: '' },
      { id: 'p3', songId: 's5', position: 'DL', positionLabel: 'Dâng lễ', order: 3, title: 'Bài ca dâng hiến', key: '72' },
      { id: 'p4', songId: 's7', position: 'HL', positionLabel: 'Hiệp lễ', order: 4, title: 'Ngọt ngào bên Giêsu', key: 'G' },
      { id: 'p5', songId: 's9', position: 'KL', positionLabel: 'Kết lễ', order: 5, title: 'Tình Cha nghĩa mẹ', key: '' }
    ]
  },
  {
    id: 'm-2026-12-06',
    date: '2026-12-06',
    title: '2 Mùa Vọng',
    liturgicalSeason: 'MUA_VONG',
    status: 'APPROVED',
    program: [
      { id: 'p1', songId: 's2', position: 'NL', positionLabel: 'Nhập lễ', order: 1, title: 'Hát lên bài ca', key: '' },
      { id: 'p2', songId: 's4', position: 'DC', positionLabel: 'Đáp ca', order: 2, title: 'Tv 66', key: '' },
      { id: 'p3', songId: 's6', position: 'DL', positionLabel: 'Dâng lễ', order: 3, title: 'Giai khúc dâng tiến 2', key: '' },
      { id: 'p4', songId: 's8', position: 'HL', positionLabel: 'Hiệp lễ', order: 4, title: 'Đẹp thay', key: '' },
      { id: 'p5', songId: 's10', position: 'KL', positionLabel: 'Kết lễ', order: 5, title: 'Sống chứng nhân', key: '' }
    ]
  },
  { id: 'm-2026-12-13', date: '2026-12-13', title: '3 Mùa Vọng', liturgicalSeason: 'MUA_VONG', status: 'DRAFT', program: [] },
  { id: 'm-2026-12-20', date: '2026-12-20', title: '4 Mùa Vọng', liturgicalSeason: 'MUA_VONG', status: 'DRAFT', program: [] },
  { id: 'm-2026-12-24', date: '2026-12-24', title: 'Vọng Giáng Sinh', liturgicalSeason: 'GIANG_SINH', status: 'DRAFT', program: [] },
  { id: 'm-2026-12-27', date: '2026-12-27', title: '5 Mùa Vọng', liturgicalSeason: 'MUA_VONG', status: 'DRAFT', program: [] }
];

export const INITIAL_SHEETS: SheetArchive[] = [
  { id: 'a1', songId: 's1', storageCode: '71', songTitle: 'Về bên Chúa', composer: 'Bùi Loan', printDate: '2026-01-10', quantity: 30, currentQty: 30, location: 'Tủ A - Ngăn 01' },
  { id: 'a2', songId: 's3', storageCode: 'Tv 22', songTitle: 'Tv 22', composer: 'Kim Long', printDate: '2026-01-20', quantity: 20, currentQty: 18, location: 'Tủ A - Ngăn 02' },
  { id: 'a3', songId: 's5', storageCode: '72', songTitle: 'Bài ca dâng hiến', composer: 'Mi Trầm', printDate: '2026-02-10', quantity: 25, currentQty: 25, location: 'Tủ B - Ngăn 01' },
  { id: 'a4', songId: 's7', storageCode: 'G', songTitle: 'Ngọt ngào bên Giêsu', composer: 'Phanxicô', printDate: '2026-10-10', quantity: 30, currentQty: 27, location: 'Tủ A - Ngăn 02' }
];
