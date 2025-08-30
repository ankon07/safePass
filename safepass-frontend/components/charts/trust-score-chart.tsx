"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

// DUMMY DATA
const data = [
  { name: "Mar", score: 80 },
  { name: "Apr", score: 85 },
  { name: "May", score: 83 },
  { name: "Jun", score: 88 },
  { name: "Jul", score: 92 },
  { name: "Aug", score: 91 },
];

export function TrustScoreChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#588b76" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#588b76" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} />
        <YAxis domain={[70, 100]} stroke="#888888" fontSize={12} />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="score"
          stroke="#18392b"
          fillOpacity={1}
          fill="url(#colorScore)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
