export type LiturgicalSeason = 
  | 'MUA_VONG'
  | 'GIANG_SINH'
  | 'MUA_CHAY'
  | 'PHUC_SINH'
  | 'THUONG_NIEN'
  | 'LE_TRONG'
  | 'DAC_BIET'
  | 'KHAC';

export type LiturgicalCycle = 'A' | 'B' | 'C';
export type LiturgicalColor = 'GREEN' | 'PURPLE' | 'WHITE' | 'RED' | 'ROSE' | 'GOLD';
export type MassPosition = 'NL' | 'DC' | 'ALL' | 'DL' | 'HL' | 'KL' | 'OTHER';
export type ProgramStatus = 'DRAFT' | 'APPROVED' | 'USED';
export type FeastType = 'CHUA_NHAT' | 'LE_TRONG' | 'LE_KINH' | 'LE_NHO' | 'DAC_BIET';

export interface Song {
  id: string;
  title: string;
  composer: string;
  categories: MassPosition[];
  defaultPosition?: MassPosition;
  rhythm?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;

  defaultKey?: string;
  defaultRhythm?: string;
  storageCode?: string;
  pageNumber?: string;
  page?: string;
  fixedNotes?: string;
  pdfUrl?: string;
  audioUrl?: string;
  seasons?: LiturgicalSeason[];
}

export interface MassProgramItem {
  id: string;
  songId: string | null;
  position: MassPosition;
  customPosition?: string;
  order?: number;
  hasSolo?: boolean;
  soloist?: string;
  instrumentalist?: string; // Người đàn
  rhythm?: string;
  key?: string;
  pageNumber?: string;
  note?: string;

  // Render aliases
  title?: string;
  composer?: string;
  positionLabel?: string;
  soloSinger?: string;
  accompanist?: string;
  organist?: string;
  notes?: string;
}

export interface MassEvent {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string;
  title?: string; // Tên Thánh lễ
  liturgicalSeason?: LiturgicalSeason;
  generalNote?: string;
  status: ProgramStatus;
  program: MassProgramItem[];
  createdAt?: string;
  updatedAt?: string;

  // Legacy & Alias fields
  name?: string;
  season?: LiturgicalSeason;
  cycle?: LiturgicalCycle;
  liturgicalColor?: LiturgicalColor;
  feastType?: FeastType;
  accompanist?: string;
  conductor?: string;
  notes?: string;
}

export interface SheetArchive {
  id: string;
  storageCode: string;
  songId?: string;
  songTitle: string;
  composer: string;
  printDate?: string;
  quantity?: number;
  location: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;

  currentQty?: number;
  currentQuantity?: number;
  printedQuantity?: number;
  firstPrintDate?: string;
  borrowedBy?: string;
  category?: MassPosition;
  status?: 'LƯU_TRỮ' | 'CẦN_IN_THÊM' | 'HẾT_BẢN';
  pdfUrl?: string;
  history?: PrintBatchLog[];
}

export type SheetPrintArchive = SheetArchive;

export interface PrintBatchLog {
  id: string;
  date: string;
  quantity: number;
  printedBy: string;
  reason: string;
  notes?: string;
}

export interface BorrowRecord {
  id: string;
  sheetArchiveId: string;
  borrowerName: string;
  borrowerRole: string;
  quantity: number;
  borrowDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  status: 'ĐANG_MƯỢN' | 'ĐÃ_TRẢ';
  notes?: string;
}

export interface Personnel {
  id: string;
  name: string;
  role: 'SOLO' | 'ORGANIST' | 'CONDUCTOR' | 'CHOIR_MEMBER';
  voicePart?: 'SOPRANO' | 'ALTO' | 'TENOR' | 'BASS';
  phone?: string;
  email?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  notes?: string;
}

export interface RehearsalPlan {
  id: string;
  massEventId: string;
  rehearsalDate: string;
  conductor: string;
  items: { id: string; songTitle: string; status: 'BAI_MOI' | 'CAN_ON' | 'DA_XONG'; keyFocus: string }[];
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}
