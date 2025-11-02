import { ThemeToggle } from "@/components/ThemeToggle";

const MainPage = () => {
  return (
    <div className="min-h-screen">
      {/* Theme Toggle in top right corner */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to SoulVoyage!</h1>
          <p className="text-muted-foreground">You've successfully logged in.</p>
        </div>
      </div>
    </div>
  );
};

export default MainPage;
