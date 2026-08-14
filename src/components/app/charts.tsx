import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const axis = {
  stroke: "var(--color-muted-foreground)",
  fill: "var(--color-muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

const tooltipStyle = {
  contentStyle: {
    background: "var(--color-popover)",
    border: "1px solid var(--color-border)",
    borderRadius: 12,
    fontSize: 12,
    color: "var(--color-popover-foreground)",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
  },
  itemStyle: {
    color: "var(--color-popover-foreground)",
    fontSize: 12,
    fontWeight: 600,
  },
  labelStyle: { color: "var(--color-muted-foreground)", fontSize: 11, fontWeight: 500, marginBottom: 4 },
} as const;

export function EquityChart({ data }: { data: { i: number; equity: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ left: -18, right: 6, top: 6 }}>
        <defs>
          <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.55} />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--color-border)" />
        <XAxis dataKey="i" {...axis} />
        <YAxis {...axis} width={56} />
        <Tooltip {...tooltipStyle} />
        <Area
          type="monotone"
          dataKey="equity"
          stroke="var(--color-primary)"
          strokeWidth={2.4}
          fill="url(#eq)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DrawdownChart({ data }: { data: { i: number; drawdown: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ left: -18, right: 6, top: 6 }}>
        <defs>
          <linearGradient id="dd" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-destructive)" stopOpacity={0} />
            <stop offset="100%" stopColor="var(--color-destructive)" stopOpacity={0.5} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--color-border)" />
        <XAxis dataKey="i" {...axis} />
        <YAxis {...axis} width={44} unit="%" />
        <Tooltip {...tooltipStyle} />
        <Area
          type="monotone"
          dataKey="drawdown"
          stroke="var(--color-destructive)"
          strokeWidth={2}
          fill="url(#dd)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function WinLossPie({ wins, losses }: { wins: number; losses: number }) {
  const data = [
    { name: "Wins", value: wins, color: "oklch(0.72 0.19 155)" },
    { name: "Losses", value: losses, color: "var(--color-destructive)" },
  ];
  return (
    <ResponsiveContainer width="100%" height={230}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          innerRadius={62}
          outerRadius={92}
          paddingAngle={4}
          stroke="none"
        >
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
        <Tooltip {...tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function BarsChart({
  data,
  xKey = "label",
  yKey = "pnl",
  height = 240,
  unit,
}: {
  data: Record<string, unknown>[];
  xKey?: string;
  yKey?: string;
  height?: number;
  unit?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: -18, right: 6, top: 6 }}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" />
        <XAxis dataKey={xKey} {...axis} interval={0} />
        <YAxis {...axis} width={52} {...(unit ? { unit } : {})} />
        <Tooltip {...tooltipStyle} cursor={{ fill: "var(--color-muted)", opacity: 0.35 }} />
        <Bar dataKey={yKey} radius={[8, 8, 4, 4]}>
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={Number(d[yKey]) >= 0 ? "var(--color-primary)" : "var(--color-destructive)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendChart({
  data,
  yKey = "winRate",
}: {
  data: Record<string, unknown>[];
  yKey?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <LineChart data={data} margin={{ left: -18, right: 6, top: 6 }}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} width={44} unit="%" />
        <Tooltip {...tooltipStyle} />
        <Line
          type="monotone"
          dataKey={yKey}
          stroke="var(--color-accent)"
          strokeWidth={2.6}
          dot={{ r: 3, fill: "var(--color-accent)" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
