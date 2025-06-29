"use client";

import { useEffect, useState } from 'react';
import { fetchForecastData } from '@/utils/fetchData';
import {ProbabilisticForecastLineChart} from './ProbabilisticForecastChart';
import type { ForecastEntry } from './ProbabilisticForecastChart';


export default function ForecastClient() {
  const [data, setData] = useState<ForecastEntry[]>([]);
    const now = new Date();
    const start = new Date(now.getTime()).toISOString(); // -1h
    const end = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(); // +4h
  async function load() {
    try {
      const result = await fetchForecastData(start,end);
      setData(result);
    } catch (err) {
      console.error("Failed to fetch forecast data:", err);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Forecast Chart </h2>
      <ProbabilisticForecastLineChart data={data} />
    </div>
  );
}
