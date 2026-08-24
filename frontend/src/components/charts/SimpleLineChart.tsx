// Hand-rolled SVG line/trend chart, matching the style of the local SimpleBarChart/
// SimplePieChart components used in Dashboard.tsx and FinanceDashboard.tsx. No charting
// library is installed in this project, so this follows the same no-dependency approach.
export interface LineChartPoint {
  label: string;
  value: number;
}

export const SimpleLineChart = ({ data }: { data: LineChartPoint[] }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-sm text-gray-500">No data yet</p>
      </div>
    );
  }

  const width = 100;
  const height = 40;
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;

  const points = data.map((d, i) => {
    const x = data.length > 1 ? i * stepX : width / 2;
    const y = height - (d.value / maxValue) * height;
    return { x, y, ...d };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPoints = `0,${height} ${polylinePoints} ${width},${height}`;

  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40" preserveAspectRatio="none">
        <polygon points={areaPoints} fill="currentColor" className="text-gray-100" />
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          className="text-black"
        />
        {points.map((p) => (
          <circle key={p.label} cx={p.x} cy={p.y} r="1.5" className="fill-black" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="flex justify-between text-xs text-gray-500">
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
    </div>
  );
};
