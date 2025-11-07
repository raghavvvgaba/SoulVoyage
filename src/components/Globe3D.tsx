import { Globe } from "lucide-react";

export const Globe3D = () => {
  return (
    <div className="w-full h-[500px] flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-lg">
      {/* Animated rotating globe */}
      <div className="relative w-64 h-64">
        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 animate-spin" style={{ animationDuration: "20s" }} />
        <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-spin" style={{ animationDuration: "30s", animationDirection: "reverse" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Globe className="w-32 h-32 text-cyan-400 opacity-80 drop-shadow-lg" />
        </div>
        
        {/* Glowing effect */}
        <div className="absolute inset-0 rounded-full shadow-2xl shadow-cyan-500/50" />
      </div>

      {/* Background elements */}
      <div className="absolute top-10 right-20 w-20 h-20 bg-cyan-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-20 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl" />
    </div>
  );
};

export default Globe3D;
