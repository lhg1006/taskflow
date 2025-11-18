'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface WorkspaceStat {
  id: string;
  name: string;
  totalCards: number;
  completedCards: number;
  completionRate: number;
}

interface WorkspaceStatsChartProps {
  workspaceStats: WorkspaceStat[];
}

export const WorkspaceStatsChart = ({ workspaceStats }: WorkspaceStatsChartProps) => {
  if (workspaceStats.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">워크스페이스별 진행 현황</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          데이터가 없습니다
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-lg shadow-md"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">워크스페이스별 진행 현황</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={workspaceStats}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
          />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="totalCards" fill="#3b82f6" name="전체 카드" />
          <Bar dataKey="completedCards" fill="#10b981" name="완료 카드" />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};
