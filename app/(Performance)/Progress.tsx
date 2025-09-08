import { cn } from "@/lib/utils";

type Props = {
  percentage: number,
  className?: string
}

const Progress = ({ percentage, className }: Props) => {
  const radius = 90
  const circ = 2 * Math.PI * radius;
  const strokePct = ((100 - percentage) * circ) / 100
  return (
    <svg viewBox="0 0 200 200" className={cn("size-24 md:size-32 lg:size-36", className)}>
      <g transform={`rotate(-90 ${"100 100"})`}>
        <circle className="stroke-accent"
          r={radius}
          cx={100}
          cy={100}
          fill="transparent"
          strokeWidth={"1rem"}
          strokeDasharray={circ}
          strokeDashoffset={0}
        />
        <circle className={strokePct !== circ ? "stroke-[url(#MyGradient)]" : ""}
          r={radius}
          cx={100}
          cy={100}
          fill="transparent"
          strokeWidth={"1rem"}
          strokeDasharray={circ}
          strokeDashoffset={strokePct}
        />
      </g>

      <linearGradient id="MyGradient">
          <stop offset="0%" stopColor="#1fadffcc" />
          <stop offset="50%" stopColor="#9838ffcc" />
          <stop offset="100%" stopColor="#ff0048cc" />
      </linearGradient>

      <text className="text-3xl fill-foreground"
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
      >
        {percentage.toFixed(0)}%
      </text>
    </svg>
  );
};

export default Progress