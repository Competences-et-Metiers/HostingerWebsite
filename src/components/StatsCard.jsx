import React from 'react';
import { motion } from 'framer-motion';

const StatsCard = ({ title, value, change, icon: Icon, color }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      transition={{ duration: 0.2 }}
      className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-white/30"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-r ${color} rounded-lg flex items-center justify-center`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-white/80 text-sm font-medium">{title}</h3>
        <p className="text-3xl font-bold text-white">{value}</p>
        <p className="text-purple-200 text-xs">{change}</p>
      </div>
    </motion.div>
  );
};

export default StatsCard;