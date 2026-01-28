
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { EfficiencyPoint, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  data: EfficiencyPoint[];
  language: Language;
}

const EfficiencyChart: React.FC<Props> = ({ data, language }) => {
  const T = TRANSLATIONS[language].charts;

  const formatTime = (tickItem: number) => {
    const mins = Math.floor(tickItem / 60);
    const secs = tickItem % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPercent = (val: number) => `${Math.round(val * 100)}%`;

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
          <XAxis dataKey="time" tickFormatter={formatTime} stroke="#64748b" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
          <YAxis stroke="#64748b" tickFormatter={formatPercent} domain={[0.5, 1.0]} tick={{fontSize: 10}} axisLine={false} tickLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', borderRadius: '8px', fontSize: '12px' }}
            itemStyle={{ color: '#f1f5f9' }}
            labelFormatter={formatTime}
            formatter={(val: number) => Math.round(val * 100) + '%'}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          <ReferenceLine y={0.85} stroke="rgba(239, 68, 68, 0.5)" strokeDasharray="3 3" />
          <Line type="monotone" dataKey="woodEfficiency" stroke="#10b981" strokeWidth={2} name="Wood Efficiency" dot={false} />
          <Line type="monotone" dataKey="foodEfficiency" stroke="#ef4444" strokeWidth={2} name="Food Efficiency" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EfficiencyChart;
