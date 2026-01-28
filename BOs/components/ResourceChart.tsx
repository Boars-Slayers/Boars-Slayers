
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { ResourcePoint, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  data: ResourcePoint[];
  baselineData?: ResourcePoint[];
  language: Language;
  currentTime?: number;
}

const ResourceChart: React.FC<Props> = ({ data, baselineData, language, currentTime }) => {
  const T = TRANSLATIONS[language].charts;

  const formatTime = (tickItem: number) => {
    const mins = Math.floor(tickItem / 60);
    const secs = tickItem % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  let chartData = data;
  if (baselineData) {
     chartData = data.map((d, i) => {
         const baseline = baselineData[i];
         return {
             ...d,
             baseFood: baseline?.food,
             baseWood: baseline?.wood,
             baseGold: baseline?.gold
         };
     });
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorFood" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorWood" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#eab308" stopOpacity={0.6}/>
              <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
          <XAxis 
            dataKey="time" 
            tickFormatter={formatTime} 
            stroke="#64748b" 
            tick={{fontSize: 10}}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            stroke="#64748b" 
            tick={{fontSize: 10}}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', borderRadius: '8px', fontSize: '12px' }}
            itemStyle={{ padding: 0 }}
            labelStyle={{ color: '#94a3b8', marginBottom: '5px' }}
            labelFormatter={formatTime}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          
          {currentTime !== undefined && (
              <ReferenceLine x={currentTime} stroke="#fbbf24" strokeDasharray="3 3" label={{ position: 'top', value: 'NOW', fill: '#fbbf24', fontSize: 10 }} />
          )}

          {baselineData && <Area type="monotone" dataKey="baseFood" stroke="#ef4444" strokeDasharray="5 5" fill="none" strokeOpacity={0.3} strokeWidth={1} name="Base Food" />}
          {baselineData && <Area type="monotone" dataKey="baseWood" stroke="#10b981" strokeDasharray="5 5" fill="none" strokeOpacity={0.3} strokeWidth={1} name="Base Wood" />}
          
          <Area type="monotone" dataKey="food" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorFood)" name={T.food} activeDot={{ r: 4, strokeWidth: 0 }} />
          <Area type="monotone" dataKey="wood" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorWood)" name={T.wood} activeDot={{ r: 4, strokeWidth: 0 }} />
          <Area type="monotone" dataKey="gold" stroke="#eab308" strokeWidth={2} fillOpacity={1} fill="url(#colorGold)" name={T.gold} activeDot={{ r: 4, strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ResourceChart;
