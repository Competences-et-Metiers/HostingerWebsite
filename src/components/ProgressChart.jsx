import React from 'react';
import { motion } from 'framer-motion';

const ProgressChart = ({ data }) => {
  const maxValue = Math.max(...data.map(d => Math.max(d.skills, d.goals)));
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
            <span className="text-white/80">Compétences</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
            <span className="text-white/80">Objectifs</span>
          </div>
        </div>
      </div>
      
      <div className="h-48 flex items-end justify-between space-x-2">
        {data.map((item, index) => (
          <div key={item.month} className="flex-1 flex flex-col items-center space-y-2">
            <div className="w-full flex flex-col space-y-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(item.skills / maxValue) * 100}%` }}
                transition={{ duration: 1, delay: 0.1 * index }}
                className="bg-gradient-to-t from-purple-500 to-pink-500 rounded-t-sm min-h-[4px]"
              />
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(item.goals / maxValue) * 100}%` }}
                transition={{ duration: 1, delay: 0.1 * index + 0.2 }}
                className="bg-gradient-to-t from-blue-500 to-cyan-500 rounded-t-sm min-h-[4px]"
              />
            </div>
            <span className="text-white/60 text-xs">{item.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressChart;