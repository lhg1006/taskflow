'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

interface Column {
  id: string;
  title: string;
  cards?: any[];
}

interface BoardProgressChartProps {
  columns: Column[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const BoardProgressChart = ({ columns }: BoardProgressChartProps) => {
  // Calculate statistics
  const stats = columns.map((column) => ({
    name: column.title,
    value: column.cards?.length || 0,
  })).filter(stat => stat.value > 0);

  const totalCards = stats.reduce((sum, stat) => sum + stat.value, 0);
  const completedCards = columns.reduce(
    (sum, col) => sum + (col.cards?.filter((card) => card.isCompleted).length || 0),
    0
  );

  const completionData = [
    { name: '완료', value: completedCards },
    { name: '미완료', value: totalCards - completedCards },
  ];

  const completionRate = totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0;

  if (totalCards === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-lg shadow-md"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">보드 진행 현황</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          카드가 없습니다
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-lg shadow-md"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">보드 진행 현황</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Completion Rate Pie Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 text-center">완료율</h4>
          <div className="overflow-visible">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <Pie
                  data={completionData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#e5e7eb" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-2">
            <span className="text-3xl font-bold text-green-600">{completionRate}%</span>
            <p className="text-sm text-gray-600">전체 완료율</p>
          </div>
        </div>

        {/* Cards per Column */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 text-center">컬럼별 카드 분포</h4>
          <div className="overflow-visible">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart margin={{ top: 20, right: 20, bottom: 10, left: 20 }}>
                <Pie
                  data={stats}
                  cx="50%"
                  cy="45%"
                  labelLine={true}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="mt-10 grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{totalCards}</div>
          <div className="text-xs text-gray-600">전체 카드</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{completedCards}</div>
          <div className="text-xs text-gray-600">완료</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">{totalCards - completedCards}</div>
          <div className="text-xs text-gray-600">미완료</div>
        </div>
      </div>
    </motion.div>
  );
};
