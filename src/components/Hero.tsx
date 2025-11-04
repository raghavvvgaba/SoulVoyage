import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-travelers.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Travelers on adventure" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--hero-from))]/90 to-[hsl(var(--hero-to))]/80 dark:from-[hsl(var(--hero-from))]/95 dark:to-[hsl(var(--hero-to))]/90"></div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-in">
          Your Journey, Shared.
        </h1>
        <p className="text-xl md:text-2xl text-white/95 max-w-3xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          soulVoyage is the ultimate platform for solo travelers to connect, plan, and embark on unforgettable adventures together. Find your travel tribe today.
        </p>
        <Link to="/login-auth">
          <Button 
            size="lg" 
            className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6 font-semibold animate-fade-in shadow-lg hover:shadow-xl transition-all"
            style={{ animationDelay: "0.4s" }}
          >
            Start Voyaging
          </Button>
        </Link>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-float">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
