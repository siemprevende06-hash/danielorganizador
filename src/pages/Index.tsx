import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Index() {
  return (
    <div className="min-h-screen flex items-center justify-center container mx-auto px-4 py-24">
      <div className="text-center space-y-8">
        <div>
          <h1 className="text-5xl font-bold gradient-primary bg-clip-text text-transparent mb-4">
            Sistema de Vida
          </h1>
          <p className="text-lg text-muted-foreground">
            Tu centro de comando para una vida extraordinaria
          </p>
        </div>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/control-room">
            <Button size="lg">Ir a Sala de Control</Button>
          </Link>
          <Link to="/habits">
            <Button variant="outline" size="lg">Ver Hábitos</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
