// src/app/page.tsx

import ForecastClient from "@/components/ForecastClient";

export default function Page() {
  return (
    <main className="p-4">
      <h1 className="text-xl font-bold">Real-Time Forecasts</h1>
      <ForecastClient />
    </main>
  );
}
