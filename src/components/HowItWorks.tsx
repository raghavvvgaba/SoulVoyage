import { Compass, Users, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    icon: Compass,
    title: "Find a Channel",
    description: "Browse channels for your dream destination. From the mountains of Peru to the beaches of Thailand, your next stop is waiting."
  },
  {
    icon: Users,
    title: "Join a Voyage",
    description: "Find a trip initiated by a fellow traveler for your dates, or create your own and invite others to join your journey."
  },
  {
    icon: Send,
    title: "Connect & Explore",
    description: "Chat in real-time with your new travel mates in a private trip room. Plan your itinerary, share your excitement, and get ready to go!"
  }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
          Adventure Awaits in 3 Simple Steps
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Getting started with soulVoyage is easy
        </p>

        <div className="grid md:grid-cols-3 gap-8 mt-12">
          {steps.map((step, index) => (
            <Card key={index} className="border-2 hover:border-primary transition-all hover:shadow-lg">
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
