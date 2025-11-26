import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ErrorState = ({ 
  title = "Erreur de chargement", 
  message = "Une erreur est survenue lors du chargement des données.", 
  onRetry,
  className = ""
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-red-500/30 ${className}`}
    >
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
          <p className="text-white/70 max-w-md">
            {message}
          </p>
        </div>
        {onRetry && (
          <Button
            onClick={onRetry}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default ErrorState;

