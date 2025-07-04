import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { DaPricePoint } from '@/utils/processData';

type Props = {
  data: DaPricePoint[];
};

export default function DaPriceChart({ data }: Props) {
  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp_utc"
            tickFormatter={(val) =>
              new Date(val).toLocaleTimeString('nl-BE', {
                hour: '2-digit',
                minute: '2-digit',
              })
            }
          />
          <YAxis
            dataKey="price_eur_per_mwh"
            domain={['auto', 'auto']}
            tickFormatter={(v) => `${v.toFixed(0)} €/MWh`}
          />
          <Tooltip
            labelFormatter={(label) => new Date(label).toLocaleString()}
            formatter={(value: number) => [`${value.toFixed(2)} €/MWh`, 'DA Price']}
          />
        <Line
        type="stepAfter"
        dataKey="price_eur_per_mwh"
        stroke="#8884d8"
        strokeWidth={2}
        dot={false}
        />

        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
