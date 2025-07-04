"use client";

import { useEffect, useState, useCallback } from 'react';
import { fetchForecastData, fetchEntsoeData, fetchRangeForecastData } from '@/utils/fetchData';
import {
  parseEntsoeXml,
  filterDaPricePoints,
  convertRangeForecastToPlotPoints,
  type DaPricePoint,
  RangeForecastPoint,
} from '@/utils/processData';
import {
  ProbabilisticForecastLineChart,
} from './ProbabilisticForecastChart';
import type { ForecastEntry } from './ProbabilisticForecastChart';
import DaPriceWithRangeBarsChart from './DAPriceWithRangeBarsChart';

export default function ForecastClient() {
  const [data, setData] = useState<ForecastEntry[]>([]);
  const [daPrices, setDaPrices] = useState<DaPricePoint[]>([]);
  const [rangeData, setRangeData] = useState<RangeForecastPoint[]>([]);

  const now = new Date();
  const start = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString();
  const end = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();

  const startDA = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
  const endDA = new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString();

  const load = useCallback(async () => {
    try {
      const result = await fetchForecastData(start, end);
      setData(result);
    } catch (err) {
      console.error('Failed to fetch forecast data:', err);
    }

    try {
      const xml = await fetchEntsoeData(start, end, 'dayaheadprices', 'BE');
      const parsed = parseEntsoeXml(xml);
      const filtered = filterDaPricePoints(parsed, startDA, endDA);
      setDaPrices(filtered);
    } catch (err) {
      console.error('Error fetching ENTSO-E data:', err);
    }

    try {
      const jsonRangeData = await fetchRangeForecastData(start, end);
      const parsed = convertRangeForecastToPlotPoints(jsonRangeData);
      setRangeData(parsed);
    } catch (err) {
      console.error('Failed to fetch range forecast data:', err);
    }
  }, [start, end, startDA, endDA]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Forecast Chart </h2>
      <ProbabilisticForecastLineChart data={data} />

      <h2 className="text-xl font-semibold mb-4">Range Forecast Bar Chart</h2>
      <DaPriceWithRangeBarsChart daPrices={daPrices} rangeData={rangeData} />
    </div>
  );
}
