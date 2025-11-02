import { MessageCircle, Globe, Lock, UserCircle } from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: "Real-time Chat",
    description: "Chat with your group before and during the trip."
  },
  {
    icon: Globe,
    title: "Community Channels",
    description: "A dedicated space for every destination."
  },
  {
    icon: Lock,
    title: "Secure Trip Rooms",
    description: "Private chat rooms for confirmed trip members."
  },
  {
    icon: UserCircle,
    title: "Traveler Profiles",
    description: "Get to know your future travel buddies."
  }
];

const Features = () => {
  return (
    <section id="features" className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
          Everything You Need for a Perfect Trip
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          All the tools you need to plan and enjoy your adventure
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
          {features.map((feature, index) => (
            <div key={index} className="text-center group">
              <div className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-all group-hover:scale-110">
                <feature.icon className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
