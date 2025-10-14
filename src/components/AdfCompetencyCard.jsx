import React from 'react';
import { motion } from 'framer-motion';

const AdfCompetencyCard = ({ adf }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-white/30"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-white mb-1">{adf.title || `ADF #${adf.adf_id}`}</h3>
          <span className="text-purple-300 text-sm bg-purple-500/20 px-2 py-1 rounded-full">
            ADF {adf.adf_id}
          </span>
        </div>
      </div>

      {(!adf.evaluations || adf.evaluations.length === 0) ? (
        <p className="text-white/80 text-sm">Aucune évaluation disponible.</p>
      ) : (
        <div className="space-y-3">
          {adf.evaluations.map((ev, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="text-white font-medium text-sm">{ev.evaluation_name || 'Évaluation'}</div>
              <div className={`text-xs px-2 py-1 rounded-full ${
                ev.validated_label === 'Validé'
                  ? 'bg-green-500/20 text-green-300'
                  : ev.validated_label === 'En cours'
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'bg-red-500/20 text-red-300'
              }`}>
                {ev.validated_label}
              </div>
              </div>
              {ev.appreciation ? (
                <p className="text-white/80 text-sm mt-1">{ev.appreciation}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default AdfCompetencyCard;


