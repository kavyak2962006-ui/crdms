import React from 'react';
import { Loader2 } from 'lucide-react';

const Loading = ({ message = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
      </div>
      <p className="text-slate-400 text-sm font-medium animate-pulse">{message}</p>
    </div>
  );
};

export default Loading;
