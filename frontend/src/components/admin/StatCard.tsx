import React from 'react';

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  subtext?: string;
  color?: 'red' | 'green' | 'blue' | 'purple';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  subtext,
  color = 'blue',
  onClick,
}) => {
  const colorClasses = {
    red: 'from-red-50 to-red-100 border-red-200',
    green: 'from-green-50 to-green-100 border-green-200',
    blue: 'from-blue-50 to-blue-100 border-blue-200',
    purple: 'from-purple-50 to-purple-100 border-purple-200',
  };

  const iconBgClasses = {
    red: 'bg-red-200 text-red-700',
    green: 'bg-green-200 text-green-700',
    blue: 'bg-blue-200 text-blue-700',
    purple: 'bg-purple-200 text-purple-700',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-gradient-to-br ${colorClasses[color]} border rounded-lg p-6 cursor-pointer transition-transform hover:scale-105 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          {subtext && <p className="text-xs text-gray-600">{subtext}</p>}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${iconBgClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
