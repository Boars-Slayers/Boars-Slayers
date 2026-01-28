
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ResourcePoint, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  data: ResourcePoint[];
  language: Language;
}

const VillagerChart: React.FC<Props> = ({ data, language }) => {
  const T = TRANSLATIONS[language].charts;

  const chartData = data.map(point => ({
    time: point.time,
    Food: point.villagerAllocation.food,
    Wood: point.villagerAllocation.wood,
    Gold: point.villagerAllocation.gold,
    Builders: point.villagerAllocation.builders
  }));

  const formatTime = (tickItem: number) => {
    const mins = Math.floor(tickItem / 60);
    const secs = tickItem % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
           <defs>
            <linearGradient id="popFood" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="popWood" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="popGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#eab308" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
          <XAxis dataKey="time" tickFormatter={formatTime} stroke="#64748b" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
          <YAxis stroke="#64748b" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', borderRadius: '8px', fontSize: '12px' }}
            itemStyle={{ color: '#f1f5f9' }}
            labelFormatter={formatTime}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
          <Area type="monotone" dataKey="Food" stackId="1" stroke="#ef4444" fill="url(#popFood)" name={T.food} />
          <Area type="monotone" dataKey="Wood" stackId="1" stroke="#10b981" fill="url(#popWood)" name={T.wood} />
          <Area type="monotone" dataKey="Gold" stackId="1" stroke="#eab308" fill="url(#popGold)" name={T.gold} />
          <Area type="monotone" dataKey="Builders" stackId="1" stroke="#94a3b8" fill="#475569" name={T.builders} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VillagerChart;
