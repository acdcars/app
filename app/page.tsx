"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  TrendingUp,
  FileSpreadsheet,
  Calculator,
  Settings as SettingsIcon,
  ChevronRight,
  Search,
  Upload,
  Link2,
  AlertTriangle,
} from "lucide-react";

/* ---------- Brand tokens ---------- */
const brand = {
  bg: "bg-neutral-900",
  panel: "bg-neutral-800",
  text: "text-white",
  subtext: "text-neutral-300",
  border: "border-neutral-700",
};

/* ---------- Helpers ---------- */
type Band = { fromKg: number; toKg: number; priceEur: number };
type PackBand = { fromKg: number; toKg: number; costEur: number };

function bandCost(weight: number | undefined | null, bands: readonly (Band | PackBand)[]) {
  if (weight == null || Number.isNaN(weight)) return undefined;
  for (const b of bands) {
    if (weight > b.fromKg && weight <= b.toKg) {
      // @ts-expect-error union property
      return (b.priceEur ?? b.costEur) as number;
    }
  }
  return undefined;
}
function fmtMoney(n?: number) {
  return n == null || Number.isNaN(n) ? "—" : `${n.toFixed(2)} EUR`;
}
function parseDate(s: string) {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}
function computeVAT(brutto: number, netto?: number, vatRatePct?: number) {
  if (typeof netto === "number" && brutto >= netto) return brutto - netto;
  if (typeof vatRatePct === "number") return brutto * (vatRatePct / (100 + vatRatePct));
  return 0;
}
function pctMarkup(profit?: number, zakupNetto?: number) {
  if (profit == null || zakupNetto == null || zakupNetto <= 0) return undefined;
  return (profit / zakupNetto) * 100;
}

/* ---------- Demo data / KPI ---------- */
const KPI_REGISTRY = [
  { key: "orders30", label: "Zamówienia (30d)", demo: "9 214" },
  { key: "returnsTime", label: "Śr. czas zwrotu (dni)", demo: "3.8" },
  { key: "seoOkPct", label: "% ofert OK (SEO)", demo: "86%" },
  { key: "dhlDiff", label: "Rozbieżności DHL (7d)", demo: "42" },
];
const DEFAULT_USER_KPIS = ["seoOkPct", "dhlDiff", "returnsTime", "orders30"];

/* ---------- Settings types ---------- */
type SettingsState = {
  vatRate: number;
  ebay: { fixedEur: number; percent: number };
  eshop: { fixedEur: number; percent: number };
  packRanges: PackBand[];
  shipBandsDE: Band[];
  useCsvForecast: boolean;
  defaultDateDays: number;
};
const DEFAULT_SETTINGS: SettingsState = {
  vatRate: 19,
  ebay: { fixedEur: 0.35, percent: 14.8 },
  eshop: { fixedEur: 0.3, percent: 3.0 },
  packRanges: [
    { fromKg: 0.0, toKg: 0.0, costEur: 1.49 },
    { fromKg: 0.0001, toKg: 0.3, costEur: 0.5 },
    { fromKg: 0.3001, toKg: 0.6, costEur: 0.75 },
    { fromKg: 0.6001, toKg: 1.2, costEur: 0.99 },
    { fromKg: 1.2001, toKg: 3.0, costEur: 1.24 },
    { fromKg: 3.0001, toKg: 5.0, costEur: 1.49 },
    { fromKg: 5.0001, toKg: 10.0, costEur: 1.74 },
    { fromKg: 10.0001, toKg: 15.0, costEur: 1.99 },
    { fromKg: 15.0001, toKg: 20.0, costEur: 2.24 },
    { fromKg: 20.0001, toKg: 25.0, costEur: 2.49 },
    { fromKg: 25.0001, toKg: 31.0, costEur: 2.73 },
    { fromKg: 31.0001, toKg: 1000.0, costEur: 5.4 },
  ],
  shipBandsDE: [
    { fromKg: 0.0001, toKg: 2.0, priceEur: 4.04 },
    { fromKg: 2.0001, toKg: 5.0, priceEur: 4.8 },
    { fromKg: 5.0001, toKg: 10.0, priceEur: 5.2 },
    { fromKg: 10.0001, toKg: 20.0, priceEur: 6.22 },
    { fromKg: 20.0001, toKg: 25.0, priceEur: 6.77 },
    { fromKg: 25.0001, toKg: 31.5, priceEur: 7.23 },
  ],
  useCsvForecast: true,
  defaultDateDays: 31,
};

/* ---------- Profitability demo rows ---------- */
type SalesRow = {
  DataSprzedazy: string;
  NrZamNx: string; // "BE-..." lub "WBE-..."
  NrZamEbay: string;
  NrDokumentu: string;
  SprzedazBrutto: number;
  SprzedazNetto: number;
  ZakupNetto: number;
  WagaKg: number;
  shipForecastEur?: number;
};
const salesProfitPreview: SalesRow[] = [
  { DataSprzedazy: "2025-08-10", NrZamNx: "BE-1001", NrZamEbay: "07-13429-01599", NrDokumentu: "FV/25/08/001", SprzedazBrutto: 129.99, SprzedazNetto: 109.24, ZakupNetto: 70.0, WagaKg: 1.8, shipForecastEur: 4.8 },
  { DataSprzedazy: "2025-08-09", NrZamNx: "WBE-2002", NrZamEbay: "",                NrDokumentu: "FV/25/08/002", SprzedazBrutto: 89.00,  SprzedazNetto: 74.79,  ZakupNetto: 40.0, WagaKg: 0.55, shipForecastEur: 4.04 },
  { DataSprzedazy: "2025-08-08", NrZamNx: "BE-1003", NrZamEbay: "03-13433-70165", NrDokumentu: "FV/25/08/003", SprzedazBrutto: 219.00, SprzedazNetto: 184.03, ZakupNetto: 120.0, WagaKg: 10.2 },
  { DataSprzedazy: "2025-08-07", NrZamNx: "WBE-2004", NrZamEbay: "",                NrDokumentu: "FV/25/08/004", SprzedazBrutto: 49.90,  SprzedazNetto: 41.93,  ZakupNetto: 25.0, WagaKg: 0.28, shipForecastEur: 4.04 },
  { DataSprzedazy: "2025-08-06", NrZamNx: "BE-1005", NrZamEbay: "23-13405-33818", NrDokumentu: "FV/25/08/005", SprzedazBrutto: 315.50, SprzedazNetto: 265.13, ZakupNetto: 200.0, WagaKg: 22.4 },
];

/* ---------- Walidator DHL demo ---------- */
const dhlRows = Array.from({ length: 6 }).map((_, i) => ({
  invoice: `INV-DHL-${5400 + i}`,
  waybill: `JD0146${i}PL`,
  billed: (15.2 + i * 0.7).toFixed(2),   // naliczone (EUR)
  expected: (14.8 + i * 0.7).toFixed(2), // wg cennika DE (demo)
  forecast: (14.9 + i * 0.7).toFixed(2), // z CSV (demo)
  status: i % 2 === 0 ? "OK" : "Rozbieżność",
  orderId: i % 2 === 0 ? `BE-100${i}` : `WBE-200${i}`,
}));
const actualShipByOrder = dhlRows.reduce<Record<string, number>>((acc, r) => {
  if (r.orderId) acc[r.orderId] = (acc[r.orderId] || 0) + parseFloat(r.billed);
  return acc;
}, {});

/* ---------- Small table ---------- */
function Table({
  columns,
  rows,
}: {
  columns: Array<string | React.ReactNode>;
  rows: React.ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-neutral-300">
            {columns.map((c, i) => (
              <th key={`h-${i}`} className="px-3 py-2 border-b border-neutral-800">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={`r-${ri}`} className="text-neutral-200">
              {r.map((cell, ci) => (
                <td key={`c-${ri}-${ci}`} className="px-3 py-2 border-b border-neutral-900">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Sidebar ---------- */
function Sidebar({ tab, setTab }: { tab: string; setTab: (t: string) => void }) {
  const items = [
    { key: "dashboard", label: "Dashboard", icon: <TrendingUp className="h-4 w-4" /> },
    { key: "profit", label: "Opłacalność zamówień", icon: <Calculator className="h-4 w-4" /> },
    { key: "dhl", label: "Walidacja DHL", icon: <FileSpreadsheet className="h-4 w-4" /> },
    { key: "settings", label: "Ustawienia", icon: <SettingsIcon className="h-4 w-4" /> },
  ];
  return (
    <aside className="w-72 hidden md:flex flex-col border-r border-neutral-800 p-4 gap-1">
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => setTab(it.key)}
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-left ${
            tab === it.key ? "bg-neutral-800 text-white" : "text-neutral-300 hover:bg-neutral-800/60"
          }`}
        >
          <span className="text-orange-400">{it.icon}</span>
          {it.label}
          <ChevronRight className="ml-auto h-4 w-4 text-neutral-500" />
        </button>
      ))}
    </aside>
  );
}

/* ---------- Dashboard ---------- */
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className={`${brand.panel} ${brand.text} border ${brand.border} rounded-2xl`}>
      <CardHeader className="pb-2"><CardTitle className="text-sm text-neutral-300">{label}</CardTitle></CardHeader>
      <CardContent className="text-2xl">{value}</CardContent>
    </Card>
  );
}
function DashboardView({ selectedKeys }: { selectedKeys: string[] }) {
  const cards = KPI_REGISTRY.filter((k) => selectedKeys.includes(k.key));
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((k) => <StatCard key={k.key} label={k.label} value={k.demo} />)}
      </div>

      <Card className={`${brand.panel} ${brand.text} border ${brand.border} rounded-2xl`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-orange-400" /> eBay – szybkie wskaźniki (MVP)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-neutral-300">
          <div className="flex items-center justify-between"><span>Oferty bez zdjęć/alt text</span><Badge className="bg-neutral-700">4 130</Badge></div>
          <div className="flex items-center justify-between"><span>Tytuł &gt; 80 znaków</span><Badge className="bg-neutral-700">12 540</Badge></div>
          <div className="flex items-center justify-between"><span>Brak Item Specifics</span><Badge className="bg-neutral-700">8 220</Badge></div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- Settings (opłacalność) ---------- */
function SettingsProfitability({ settings, setSettings }: { settings: SettingsState; setSettings: (s: SettingsState) => void }) {
  const s = settings;
  return (
    <div className="p-6 space-y-6">
      <Card className={`${brand.panel} ${brand.text} border ${brand.border} rounded-2xl`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><SettingsIcon className="h-5 w-5 text-orange-400" /> Ustawienia opłacalności</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label>VAT [%] (DE)</Label>
              <Input type="number" step="0.1" value={s.vatRate}
                     onChange={(e) => setSettings({ ...s, vatRate: parseFloat(e.target.value || "0") })} />
            </div>
            <div>
              <Label>eBay: stała [EUR]</Label>
              <Input type="number" step="0.01" value={s.ebay.fixedEur}
                     onChange={(e) => setSettings({ ...s, ebay: { ...s.ebay, fixedEur: parseFloat(e.target.value || "0") } })} />
            </div>
            <div>
              <Label>eBay: % od brutto</Label>
              <Input type="number" step="0.1" value={s.ebay.percent}
                     onChange={(e) => setSettings({ ...s, ebay: { ...s.ebay, percent: parseFloat(e.target.value || "0") } })} />
            </div>
            <div className="flex items-end gap-2">
              <Switch checked={s.useCsvForecast} onCheckedChange={(v) => setSettings({ ...s, useCsvForecast: v })} />
              <span className="text-neutral-300">Koszt przesyłki: {s.useCsvForecast ? "z CSV" : "wg cennika DE"}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>eShop: stała [EUR]</Label>
              <Input type="number" step="0.01" value={s.eshop.fixedEur}
                     onChange={(e) => setSettings({ ...s, eshop: { ...s.eshop, fixedEur: parseFloat(e.target.value || "0") } })} />
            </div>
            <div>
              <Label>eShop: % od brutto</Label>
              <Input type="number" step="0.1" value={s.eshop.percent}
                     onChange={(e) => setSettings({ ...s, eshop: { ...s.eshop, percent: parseFloat(e.target.value || "0") } })} />
            </div>
            <div>
              <Label>Domyślny zakres dat (dni)</Label>
              <Input type="number" step="1" value={s.defaultDateDays}
                     onChange={(e) => setSettings({ ...s, defaultDateDays: Math.max(1, parseInt(e.target.value || "31", 10)) })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={`${brand.panel} ${brand.text} border ${brand.border} rounded-2xl`}>
        <CardHeader><CardTitle>Reguły pakowania (EUR, netto)</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {s.packRanges.map((r, idx) => (
              <div key={`pack-${idx}`} className="flex items-center gap-2">
                <span className="text-neutral-400">(</span>
                <Input type="number" value={r.fromKg} onChange={(e) => {
                  const v = parseFloat(e.target.value || "0"); const arr = [...s.packRanges]; arr[idx] = { ...arr[idx], fromKg: v }; setSettings({ ...s, packRanges: arr });
                }} className="w-24" />
                <span className="text-neutral-400">,</span>
                <Input type="number" value={r.toKg} onChange={(e) => {
                  const v = parseFloat(e.target.value || "0"); const arr = [...s.packRanges]; arr[idx] = { ...arr[idx], toKg: v }; setSettings({ ...s, packRanges: arr });
                }} className="w-24" />
                <span className="text-neutral-400">] →</span>
                <Input type="number" step="0.01" value={r.costEur} onChange={(e) => {
                  const v = parseFloat(e.target.value || "0"); const arr = [...s.packRanges]; arr[idx] = { ...arr[idx], costEur: v }; setSettings({ ...s, packRanges: arr });
                }} className="w-28" />
                <span className="text-neutral-400">EUR</span>
              </div>
            ))}
          </div>
          <div className="text-xs text-neutral-400">Konwencja zakresów: (od, do] – prawa granica włącznie.</div>
        </CardContent>
      </Card>

      <Card className={`${brand.panel} ${brand.text} border ${brand.border} rounded-2xl`}>
        <CardHeader><CardTitle>Cennik DHL – Niemcy (EUR, netto)</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {s.shipBandsDE.map((b, idx) => (
              <div key={`band-${idx}`} className="flex items-center gap-2">
                <span className="text-neutral-400">(</span>
                <Input type="number" value={b.fromKg} onChange={(e) => {
                  const v = parseFloat(e.target.value || "0"); const arr = [...s.shipBandsDE]; arr[idx] = { ...arr[idx], fromKg: v }; setSettings({ ...s, shipBandsDE: arr });
                }} className="w-24" />
                <span className="text-neutral-400">,</span>
                <Input type="number" value={b.toKg} onChange={(e) => {
                  const v = parseFloat(e.target.value || "0"); const arr = [...s.shipBandsDE]; arr[idx] = { ...arr[idx], toKg: v }; setSettings({ ...s, shipBandsDE: arr });
                }} className="w-24" />
                <span className="text-neutral-400">] →</span>
                <Input type="number" step="0.01" value={b.priceEur} onChange={(e) => {
                  const v = parseFloat(e.target.value || "0"); const arr = [...s.shipBandsDE]; arr[idx] = { ...arr[idx], priceEur: v }; setSettings({ ...s, shipBandsDE: arr });
                }} className="w-28" />
                <span className="text-neutral-400">EUR</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- Profitability ---------- */
function computeSellingFee(brutto: number, nrZamNx: string, s: SettingsState) {
  const isBE = nrZamNx.startsWith("BE");
  const cfg = isBE ? s.ebay : s.eshop;
  return cfg.fixedEur + brutto * (cfg.percent / 100);
}
function ProfitabilityView({ settings }: { settings: SettingsState }) {
  const [q, setQ] = useState("");
  const [platform, setPlatform] = useState<"ALL" | "BE" | "WBE">("ALL");
  const [showForecast, setShowForecast] = useState(true);
  const [showActual, setShowActual] = useState(true);
  const [minW, setMinW] = useState<string>("");
  const [maxW, setMaxW] = useState<string>("");
  const today = new Date();
  const startDefault = new Date(today.getTime() - (settings.defaultDateDays ?? 31) * 24 * 3600 * 1000);
  const [dateFrom, setDateFrom] = useState<string>(startDefault.toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState<string>(today.toISOString().slice(0, 10));
  const [markupMin, setMarkupMin] = useState<string>("");
  const [markupMax, setMarkupMax] = useState<string>("");

  const rows = useMemo(() => {
    const df = parseDate(dateFrom)?.getTime() ?? -Infinity;
    const dt = parseDate(dateTo)?.getTime() ?? Infinity;

    return salesProfitPreview
      .filter(row => {
        const d = parseDate(row.DataSprzedazy)?.getTime() ?? 0;
        if (d < df || d > dt) return false;
        if (platform !== "ALL" && !row.NrZamNx.startsWith(platform)) return false;
        if (q) {
          const qq = q.toLowerCase();
          const hit = [row.NrZamNx, row.NrZamEbay, row.NrDokumentu].some(v => (v || "").toLowerCase().includes(qq));
          if (!hit) return false;
        }
        const w = row.WagaKg;
        if (minW && w < parseFloat(minW)) return false;
        if (maxW && w > parseFloat(maxW)) return false;
        return true;
      })
      .map(row => {
        const vat = computeVAT(row.SprzedazBrutto, row.SprzedazNetto, settings.vatRate);
        const pack = bandCost(row.WagaKg, settings.packRanges) ?? 0;
        const ship = settings.useCsvForecast && row.shipForecastEur != null
          ? row.shipForecastEur
          : (bandCost(row.WagaKg, settings.shipBandsDE) ?? 0);
        const fee = computeSellingFee(row.SprzedazBrutto, row.NrZamNx, settings);

        const profitForecast = row.SprzedazBrutto - vat - row.ZakupNetto - ship - pack - fee;
        const muForecast = pctMarkup(profitForecast, row.ZakupNetto);

        const actualShip = actualShipByOrder[row.NrZamNx];
        const profitActual = actualShip != null
          ? row.SprzedazBrutto - vat - row.ZakupNetto - actualShip - pack - fee
          : undefined;
        const muActual = profitActual != null ? pctMarkup(profitActual, row.ZakupNetto) : undefined;

        return { row, ship, fee, profitForecast, muForecast, profitActual, muActual };
      })
      .filter(r => {
        const min = markupMin ? parseFloat(markupMin) : -Infinity;
        const max = markupMax ? parseFloat(markupMax) : Infinity;
        const candidates: number[] = [];
        if (showForecast && r.muForecast != null) candidates.push(r.muForecast);
        if (showActual && r.muActual != null) candidates.push(r.muActual);
        if (candidates.length === 0) return true;
        return candidates.some(v => v >= min && v <= max);
      });
  }, [q, platform, dateFrom, dateTo, minW, maxW, markupMin, markupMax, settings, showForecast, showActual]);

  const columns = [
    "NrZamNx",
    "NrDokumentu",
    "SprzedazBrutto",
    "SprzedazNetto",
    "ZakupNetto",
    "Waga [kg]",
    "Koszt przesyłki [EUR]",
    "Prowizja sprzedażowa [EUR]",
    ...(showForecast ? ["Zysk prognozowany [EUR]"] : []),
    ...(showActual ? ["Zysk rzeczywisty [EUR]"] : []),
    "NrZamEbay",
  ];
  const tableRows = rows.map(r => {
    const moneyAndMarkup = (v?: number, mu?: number) => {
      if (v == null) return "—";
      const base = fmtMoney(v).replace(" EUR", "");
      const muTxt = mu == null ? "" : ` (${mu.toFixed(2)}%)`;
      return `${base}${muTxt} EUR`;
    };
    return [
      r.row.NrZamNx,
      r.row.NrDokumentu,
      fmtMoney(r.row.SprzedazBrutto),
      fmtMoney(r.row.SprzedazNetto),
      fmtMoney(r.row.ZakupNetto),
      r.row.WagaKg.toFixed(2),
      fmtMoney(r.ship),
      fmtMoney(r.fee),
      ...(showForecast ? [moneyAndMarkup(r.profitForecast, r.muForecast)] : []),
      ...(showActual ? [moneyAndMarkup(r.profitActual, r.muActual)] : []),
      r.row.NrZamEbay || "—",
    ];
  });

  return (
    <div className="p-6 space-y-4">
      <Card className={`${brand.panel} ${brand.text} border ${brand.border} rounded-2xl`}>
        <CardHeader><CardTitle>Opłacalność zamówień</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-3">
            <div className="col-span-2">
              <Label className={brand.subtext}>Szukaj (NrZamNx / NrZamEbay / NrDokumentu)</Label>
              <div className="flex items-center gap-2">
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="np. BE-1001" />
                <Button><Search className="h-4 w-4 mr-2" />Szukaj</Button>
              </div>
            </div>
            <div>
              <Label className={brand.subtext}>Platforma</Label>
              <div className="flex gap-2">
                {(["ALL","BE","WBE"] as const).map(p => (
                  <Button key={p} onClick={() => setPlatform(p)} variant={platform===p?"default":"outline"}>
                    {p}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex gap-4 items-end">
              <div className="flex items-center gap-2">
                <Switch checked={showForecast} onCheckedChange={setShowForecast} />
                <Label>Pokaż prognozowane</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={showActual} onCheckedChange={setShowActual} />
                <Label>Pokaż rzeczywiste</Label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-3">
            <div className="flex gap-2">
              <div>
                <Label className={brand.subtext}>Data od</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div>
                <Label className={brand.subtext}>Data do</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
              <div>
                <Label className={brand.subtext}>Waga min [kg]</Label>
                <Input type="number" value={minW} onChange={(e)=>setMinW(e.target.value)} />
              </div>
              <div>
                <Label className={brand.subtext}>Waga max [kg]</Label>
                <Input type="number" value={maxW} onChange={(e)=>setMaxW(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
              <div>
                <Label className={brand.subtext}>Narzut min [%]</Label>
                <Input type="number" value={markupMin} onChange={(e)=>setMarkupMin(e.target.value)} />
              </div>
              <div>
                <Label className={brand.subtext}>Narzut max [%]</Label>
                <Input type="number" value={markupMax} onChange={(e)=>setMarkupMax(e.target.value)} />
              </div>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={()=>{
                setQ(""); setPlatform("ALL"); setMinW(""); setMaxW(""); setMarkupMin(""); setMarkupMax("");
                const t = new Date(); const s = new Date(t.getTime() - (settings.defaultDateDays ?? 31)*24*3600*1000);
                setDateTo(t.toISOString().slice(0,10)); setDateFrom(s.toISOString().slice(0,10));
              }}>Wyczyść filtry</Button>
            </div>
          </div>

          <Table columns={columns} rows={tableRows} />
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- DHL Validator ---------- */
function DHLValidatorView() {
  const [hasOrdersData, setHasOrdersData] = useState(false);
  const [csvUploaded, setCsvUploaded] = useState(false);
  const completeness = useMemo(() => {
    if (!csvUploaded) return "Brak pliku";
    if (!hasOrdersData) return "Niekompletne dane";
    return "Gotowe do walidacji";
  }, [csvUploaded, hasOrdersData]);

  return (
    <div className="p-6 space-y-4">
      <Card className={`${brand.panel} ${brand.text} border ${brand.border} rounded-2xl`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-orange-400" /> Walidacja kosztów – faktura DHL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label className={brand.subtext}>Wgraj fakturę (XLSX/CSV). Używamy: <code>Sendungsnummer</code>, <code>Abrechnungsgewicht</code>, <code>Bezeichnung</code>.</Label>
              <div className="mt-1 flex items-center gap-3 p-4 border-2 border-dashed border-neutral-700 rounded-2xl bg-neutral-900/60">
                <Upload className="h-5 w-5 text-neutral-400" />
                <Button onClick={() => setCsvUploaded(true)}>Wybierz plik</Button>
                {csvUploaded && <Badge className="bg-neutral-700">plik</Badge>}
              </div>
            </div>
            <div>
              <Label className={brand.subtext}>Dane zamówień</Label>
              <div className="mt-1 flex items-center gap-3 p-4 border border-neutral-700 rounded-2xl bg-neutral-900/60">
                <Badge className={hasOrdersData ? "bg-neutral-700" : "bg-orange-600"}>{hasOrdersData ? "Załadowane" : "Brak"}</Badge>
                <Button variant="outline" onClick={() => setHasOrdersData(true)}>Import CSV</Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-neutral-300">Status kompletności:</span>
            <Badge className={completeness === "Gotowe do walidacji" ? "bg-neutral-700" : "bg-orange-600"}>{completeness}</Badge>
            {completeness === "Niekompletne dane" && (
              <Button>Uzupełnij brakujące dane</Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button disabled={completeness !== "Gotowe do walidacji"}>Waliduj</Button>
            <Button variant="outline">Historia</Button>
          </div>
        </CardContent>
      </Card>

      <Card className={`${brand.panel} ${brand.text} border ${brand.border} rounded-2xl`}>
        <CardHeader><CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5 text-orange-400" /> Powiązania przesyłek z zamówieniami</CardTitle></CardHeader>
        <CardContent>
          <Table
            columns={["Faktura", "Lista przewozowa", "Zamówienie", "Status"]}
            rows={dhlRows.map((r) => [
              r.invoice,
              r.waybill,
              r.orderId || <Button key={`assign-${r.invoice}`}>Przypisz zamówienie</Button>,
              r.orderId ? <Badge key={`lk-${r.invoice}`} className="bg-neutral-700">OK</Badge> : <Badge key={`lk-${r.invoice}`} className="bg-orange-600">Brak powiązania</Badge>,
            ])}
          />
          <div className="text-xs text-neutral-400 mt-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-400" />
            Jeden waybill może mieć wiele pozycji (dopłaty: Nachbelastung, Gewichtskorrekturentgelt 10–20 / 20+, Energiezuschlag). Sumujemy per waybill.
          </div>
        </CardContent>
      </Card>

      <Card className={`${brand.panel} ${brand.text} border ${brand.border} rounded-2xl`}>
        <CardHeader><CardTitle>Wyniki ostatniej walidacji (demo)</CardTitle></CardHeader>
        <CardContent>
          <Table
            columns={["Faktura", "Lista przewozowa", "Naliczono [EUR]", "Powinno (cennik DE)", "Prognoza (CSV)", "Status"]}
            rows={dhlRows.map((r) => [
              r.invoice,
              r.waybill,
              `${r.billed} EUR`,
              `${r.expected} EUR`,
              `${r.forecast} EUR`,
              <Badge key={`dhl2-${r.invoice}`} className={r.status === "OK" ? "bg-neutral-700" : "bg-orange-600"}>{r.status}</Badge>,
            ])}
          />
          <div className="text-xs text-neutral-400 mt-2">
            Porównujemy naliczone vs prognoza oraz „Powinno”. Dopłaty za &gt;10kg / &gt;20kg i Energiezuschlag jako osobne pozycje.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- Root Page ---------- */
export default function Page() {
  const [tab, setTab] = useState<string>("profit");
  const [selectedKeys] = useState<string[]>(DEFAULT_USER_KPIS);
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);

  return (
    <div className={`min-h-screen ${brand.bg} ${brand.text}`}>
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="text-xl font-semibold">Aplikacja firmowa</span>
          <Badge className="bg-orange-500/20 text-orange-400">MVP</Badge>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-700 bg-neutral-800">
          <Search className="h-4 w-4 text-neutral-400" />
          <input placeholder="Szukaj…" className="bg-transparent text-sm outline-none text-neutral-200 placeholder:text-neutral-500" />
        </div>
        <Button>Nowe zadanie</Button>
      </div>

      <div className="flex">
        <Sidebar tab={tab} setTab={setTab} />
        <main className="flex-1 p-4">
          {tab === "dashboard" && <DashboardView selectedKeys={selectedKeys} />}
          {tab === "profit" && <ProfitabilityView settings={settings} />}
          {tab === "dhl" && <DHLValidatorView />}
          {tab === "settings" && <SettingsProfitability settings={settings} setSettings={setSettings} />}
        </main>
      </div>

      {/* Self-checks */}
      <div className="p-4 text-xs text-neutral-400">
        <div className="font-semibold mb-1">Self-checks</div>
        <ul className="list-disc ml-5 space-y-1">
          <li>Zakresy wag (od, do] – prawa granica włącznie.</li>
          <li>VAT (DE) = 19% — preferencyjnie liczony jako Brutto−Netto (fallback: stawka).</li>
          <li>BE (eBay) vs WBE (eShop): różne prowizje sprzedażowe.</li>
          <li>Narzut % = zysk / ZakupNetto · 100; filtry po narzucie działają.</li>
          <li>„Powinno (cennik DE)” używane w raporcie walidacji DHL.</li>
        </ul>
      </div>
    </div>
  );
}