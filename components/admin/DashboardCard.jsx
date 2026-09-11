export default function DashboardCard({ icon: Icon, label, value, change, trend = "up" }) {
  const isPositive = trend === "up";

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-blue-300 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          {Icon && (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
              <Icon size={24} className="text-blue-600" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-600">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
      </div>

      {change && (
        <div className="flex items-center gap-1">
          <span className={`inline-flex items-center gap-0.5 text-sm font-semibold ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? '↑' : '↓'} {change}
          </span>
          <span className="text-xs text-gray-500">vs last month</span>
        </div>
      )}
    </div>
  );
}
