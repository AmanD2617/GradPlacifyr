import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ChartConfig } from './ChartCard'

const PIE_COLORS = ['#1f4b9c', '#20468b', '#3d68ba', '#daa824', '#f0c55b', '#5c88dc']

const DashboardCharts = ({ config }: { config: ChartConfig }) => {
  if (config.kind === 'donut') {
    return (
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={config.data}
              dataKey="value"
              nameKey="name"
              innerRadius={72}
              outerRadius={106}
              strokeWidth={2}
              animationDuration={900}
            >
              {config.data.map((entry, idx) => (
                <Cell key={`${entry.name}-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" height={32} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (config.kind === 'line') {
    return (
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={config.data}>
            <CartesianGrid strokeDasharray="4 4" stroke="#d9e2ff" />
            <XAxis dataKey={config.xKey} tick={{ fill: '#334155', fontSize: 12 }} />
            <YAxis tick={{ fill: '#334155', fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {config.series.map((item) => (
              <Line
                key={item.key}
                type="monotone"
                dataKey={item.key}
                stroke={item.color}
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name={item.label}
                animationDuration={900}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={config.data}>
          <CartesianGrid strokeDasharray="4 4" stroke="#d9e2ff" />
          <XAxis dataKey={config.xKey} tick={{ fill: '#334155', fontSize: 12 }} />
          <YAxis tick={{ fill: '#334155', fontSize: 12 }} />
          <Tooltip />
          <Legend />
          {config.series.map((item) => (
            <Bar
              key={item.key}
              dataKey={item.key}
              fill={item.color}
              radius={[8, 8, 0, 0]}
              animationDuration={900}
              name={item.label}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default DashboardCharts
