"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export interface WeeklyPoint {
  week: string;
  submitted: number;
  late: number;
}

export interface StatusSlice {
  name: string;
  value: number;
  color: string;
}

function ChartPlaceholder({ message }: { message: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-xl border border-dashed border-border">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function SubmissionsTrendChart({ data }: { data: WeeklyPoint[] }) {
  if (data.length === 0) {
    return <ChartPlaceholder message="No submission activity yet." />;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barGap={4}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
          vertical={false}
        />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            fontSize: 12,
          }}
        />
        <Bar
          dataKey="submitted"
          name="On time"
          fill="var(--primary)"
          radius={[6, 6, 0, 0]}
        />
        <Bar
          dataKey="late"
          name="Late"
          fill="var(--danger)"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StatusBreakdownChart({ data }: { data: StatusSlice[] }) {
  if (data.every((s) => s.value === 0)) {
    return <ChartPlaceholder message="No submissions to break down yet." />;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={58}
          outerRadius={88}
          paddingAngle={3}
        >
          {data.map((s) => (
            <Cell key={s.name} fill={s.color} stroke="none" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            fontSize: 12,
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
