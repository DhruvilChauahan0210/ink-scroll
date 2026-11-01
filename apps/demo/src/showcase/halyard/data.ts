/* Halyard Capital N.V. — the numbers behind the 2026 annual report. A
   fictional ro-ro and ferry group headquartered in Rotterdam. Every figure on
   the page reads from here, so the KPI tiles, the quarterly chart, the
   five-year table and the segment split all add up to the same year. */

export const YEARS = [2022, 2023, 2024, 2025, 2026] as const;

/** Quarterly net revenue, € million: FY2026 against the same quarter of FY2025. */
export const QUARTERS = [
  { q: 'Q1', months: 'Jan–Mar', v: 412, py: 371, ebit: 18.9, note: 'A cold, stormy start held back short-sea volumes; 41 sailings lost to weather.' },
  { q: 'Q2', months: 'Apr–Jun', v: 468, py: 409, ebit: 21.6, note: 'Rotterdam–Aberdeen opened on 3 June; two extra Bergen sailings a week.' },
  { q: 'Q3', months: 'Jul–Sep', v: 451, py: 398, ebit: 20.2, note: 'Scheduled dry-docking of Eider, Skua and Petrel; record passenger summer.' },
  { q: 'Q4', months: 'Oct–Dec', v: 539, py: 463, ebit: 24.1, note: 'Best quarter in our history: record volumes and the first full quarter to Aberdeen.' },
] as const;

/** Key figures with a five-year series for the sparkline (2022 → 2026). */
export const KPIS = [
  { k: 'Net revenue', v: '€1,870m', d: '+14.0%', s: [1412, 1538, 1590, 1641, 1870] },
  { k: 'EBITDA', v: '€596m', d: '+17.8%', s: [402, 441, 468, 506, 596] },
  { k: 'EBIT margin', v: '21.4%', d: '+2.1 pt', s: [17.6, 18.3, 18.6, 19.3, 21.4] },
  { k: 'Free cash flow', v: '€312m', d: '+25.8%', s: [188, 205, 231, 248, 312] },
  { k: 'Freight carried', v: '41.2m', u: 'lane metres', d: '+9.3%', s: [34.1, 36.0, 36.8, 37.7, 41.2] },
  { k: 'Passengers', v: '1.28m', d: '+5.8%', s: [1.02, 1.11, 1.17, 1.21, 1.28] },
  { k: 'Sailings on schedule', v: '98.2%', d: '+0.9 pt', s: [96.4, 96.9, 97.0, 97.3, 98.2] },
  { k: 'Dividend per share', v: '€1.40', d: '+€0.15', s: [0.95, 1.05, 1.15, 1.25, 1.4], proposed: true },
] as const;

export const SEGMENTS = [
  { n: 'Freight ferries', d: 'Ro-ro sailings for trailers, containers and new cars', v: 1086, yoy: '+15.2%', c: 'var(--ink)' },
  { n: 'Passenger', d: 'Overnight ro-pax on the Bergen and Cuxhaven routes', v: 318, yoy: '+8.9%', c: 'var(--sea)' },
  { n: 'Port terminals', d: 'Our own berths in Rotterdam, Immingham and Esbjerg', v: 262, yoy: '+12.4%', c: 'var(--brass)' },
  { n: 'Logistics', d: 'Door-to-door haulage and cold-chain warehousing', v: 204, yoy: '+16.6%', c: 'var(--fog)' },
] as const;

export const ROUTES = [
  { from: 'Rotterdam', to: 'Immingham', week: 12, hrs: '13 h', ships: 3, trend: '+6%' },
  { from: 'Rotterdam', to: 'Teesport', week: 6, hrs: '16 h', ships: 2, trend: '+4%' },
  { from: 'Rotterdam', to: 'Aberdeen', week: 3, hrs: '31 h', ships: 1, trend: 'New', isNew: true },
  { from: 'Rotterdam', to: 'Bergen', week: 3, hrs: '38 h', ships: 2, trend: '+11%' },
  { from: 'Zeebrugge', to: 'Rosyth', week: 4, hrs: '22 h', ships: 2, trend: '+8%' },
  { from: 'Esbjerg', to: 'Immingham', week: 6, hrs: '19 h', ships: 2, trend: '+3%' },
  { from: 'Cuxhaven', to: 'Immingham', week: 5, hrs: '17 h', ships: 2, trend: '+9%' },
] as const;

export type Status = 'service' | 'dock' | 'order';
export const FLEET: { n: string; t: string; built: string; cap: string; route: string; fuel: string; st: Status; stl: string }[] = [
  { n: 'Gannet', t: 'Ro-ro freight', built: '2019', cap: '4,076 lm', route: 'Rotterdam – Immingham', fuel: 'MGO · scrubber', st: 'service', stl: 'In service' },
  { n: 'Fulmar', t: 'Ro-ro freight', built: '2019', cap: '4,076 lm', route: 'Rotterdam – Immingham', fuel: 'MGO · scrubber', st: 'service', stl: 'In service' },
  { n: 'Shearwater', t: 'Ro-ro freight', built: '2021', cap: '4,500 lm', route: 'Rotterdam – Aberdeen', fuel: 'LNG dual-fuel', st: 'service', stl: 'In service' },
  { n: 'Kittiwake', t: 'Ro-pax', built: '2016', cap: '2,900 lm · 600 pax', route: 'Rotterdam – Bergen', fuel: 'LNG dual-fuel', st: 'service', stl: 'In service' },
  { n: 'Eider', t: 'Ro-ro freight', built: '2008', cap: '3,350 lm', route: 'Zeebrugge – Rosyth', fuel: 'MGO', st: 'dock', stl: 'Dry dock to 14 Mar' },
  { n: 'Skua', t: 'Ro-ro freight', built: '2011', cap: '3,831 lm', route: 'Esbjerg – Immingham', fuel: 'MGO · shore power', st: 'service', stl: 'In service' },
  { n: 'Petrel', t: 'Ro-pax', built: '2013', cap: '2,600 lm · 450 pax', route: 'Cuxhaven – Immingham', fuel: 'MGO · shore power', st: 'service', stl: 'In service' },
  { n: 'Guillemot', t: 'Ro-ro freight', built: '2028', cap: '5,200 lm', route: 'North Sea, to be assigned', fuel: 'Methanol-ready', st: 'order', stl: 'On order · Q2 2028' },
  { n: 'Razorbill', t: 'Ro-ro freight', built: '2028', cap: '5,200 lm', route: 'North Sea, to be assigned', fuel: 'Methanol-ready', st: 'order', stl: 'On order · Q4 2028' },
];

/** Five-year summary, € million unless stated. */
export const FIVE_YEAR: { k: string; v: string[]; sub?: boolean }[] = [
  { k: 'Net revenue', v: ['1,412', '1,538', '1,590', '1,641', '1,870'] },
  { k: 'EBITDA', v: ['402', '441', '468', '506', '596'] },
  { k: 'EBIT', v: ['248', '281', '296', '316', '400'] },
  { k: 'EBIT margin, %', v: ['17.6', '18.3', '18.6', '19.3', '21.4'], sub: true },
  { k: 'Net profit', v: ['171', '196', '207', '224', '291'] },
  { k: 'Free cash flow', v: ['188', '205', '231', '248', '312'] },
  { k: 'Capital expenditure', v: ['164', '212', '338', '296', '241'] },
  { k: 'Net debt / EBITDA, ×', v: ['2.4', '2.2', '2.1', '1.9', '1.6'], sub: true },
  { k: 'Return on invested capital, %', v: ['9.1', '9.8', '10.2', '10.6', '12.4'], sub: true },
  { k: 'Dividend per share, €', v: ['0.95', '1.05', '1.15', '1.25', '1.40'], sub: true },
];

export const DOWNLOADS = [
  { t: 'Annual Report 2026', m: 'Integrated report incl. sustainability statement · 212 pages', f: 'PDF', size: '8.4 MB', main: true },
  { t: 'Annual Report 2026 — ESEF', m: 'Financial statements in iXBRL, as filed with the AFM', f: 'ZIP', size: '5.6 MB' },
  { t: 'Key figures 2017–2026', m: 'Ten years of income statement, balance sheet and KPIs', f: 'XLSX', size: '184 KB' },
  { t: 'Sustainability statement', m: 'ESRS disclosures, EU Taxonomy tables, assurance report', f: 'PDF', size: '3.1 MB' },
  { t: 'Q4 & full-year results presentation', m: '38 slides · webcast 26 Feb 2027, 09:00 CET', f: 'PDF', size: '4.7 MB' },
  { t: 'Remuneration report 2026', m: 'For the advisory vote at the 2027 AGM', f: 'PDF', size: '1.2 MB' },
] as const;

export const CALENDAR = [
  { d: '26', m: 'Feb', y: '2027', t: 'Full-year results 2026 and annual report', past: true },
  { d: '22', m: 'Apr', y: '2027', t: 'Annual General Meeting, Rotterdam' },
  { d: '26', m: 'Apr', y: '2027', t: 'Ex-dividend date, final dividend €1.40' },
  { d: '06', m: 'May', y: '2027', t: 'Q1 2027 trading update' },
  { d: '14', m: 'May', y: '2027', t: 'Dividend payment date' },
  { d: '19', m: 'Aug', y: '2027', t: 'Half-year results 2027' },
] as const;
