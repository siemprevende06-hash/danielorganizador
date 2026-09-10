import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Github, ExternalLink, Server, RefreshCw, Copy, Check } from "lucide-react";

const LOCAL_URL = "http://localhost:8080";
const DEMO_URL = "https://opengym.duarte-santos.ch";
const REPO_URL = "https://github.com/arvids-unavailable/openGym";

const DOCKER_COMMANDS = [
  "git clone https://github.com/arvids-unavailable/openGym",
  "cd openGym",
  "cp .env.example .env",
  "docker compose up -d",
];

export default function Gym20() {
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");
  const [copied, setCopied] = useState(false);

  const checkServer = useCallback(() => {
    setStatus("checking");
    fetch(LOCAL_URL, { mode: "no-cors" })
      .then(() => setStatus("online"))
      .catch(() => setStatus("offline"));
  }, []);

  useEffect(() => {
    checkServer();
    const interval = setInterval(checkServer, 8000);
    return () => clearInterval(interval);
  }, [checkServer]);

  const copyCommands = async () => {
    try {
      await navigator.clipboard.writeText(DOCKER_COMMANDS.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-3rem)] flex-col lg:min-h-dvh">
      <div className="flex items-center justify-between gap-3 border-b bg-background px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-primary" />
          <h1 className="text-sm font-bold uppercase tracking-tight">GYM 2.0</h1>
          <Badge variant="outline" className="text-[10px]">openGym</Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge
            variant={status === "online" ? "default" : status === "checking" ? "outline" : "secondary"}
            className="text-[10px]"
          >
            {status === "online" ? "Servidor activo" : status === "checking" ? "Verificando..." : "Servidor apagado"}
          </Badge>
          <Button asChild size="sm" variant="ghost">
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              <Github className="h-3.5 w-3.5" /> Repo
            </a>
          </Button>
        </div>
      </div>

      {status === "online" ? (
        <iframe
          key={LOCAL_URL}
          src={LOCAL_URL}
          title="openGym - GYM 2.0"
          className="min-h-0 w-full flex-1 border-0 bg-background"
          allow="fullscreen; encrypted-media"
        />
      ) : (
        <div className="flex flex-1 items-start justify-center p-4 md:p-8">
          <Card className="w-full max-w-xl space-y-4 p-6">
            <div className="space-y-1">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Server className="h-5 w-5 text-primary" /> openGym no está corriendo
              </h2>
              <p className="text-sm text-muted-foreground">
                openGym es un tracker de gimnasio y peso corporal auto-alojado (proyecto de código abierto AGPL). Para usarlo dentro de esta página, ejecuta tu propia instancia con Docker:
              </p>
            </div>
            <div className="space-y-1 overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs">
              {DOCKER_COMMANDS.map(c => <p key={c}>{c}</p>)}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={copyCommands} variant="outline" size="sm">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copiado" : "Copiar comandos"}
              </Button>
              <Button onClick={checkServer} size="sm">
                <RefreshCw className="h-3.5 w-3.5" /> Reintentar
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href={DEMO_URL} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" /> Abrir demo web
                </a>
              </Button>
            </div>
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              En el primer arranque descarga los medios de ejercicio (~140 MB). Tus datos quedan en la carpeta{" "}
              <code>./data</code>. Abre <code>http://localhost:8080</code> y crea tu perfil con "Create profile". La
              demo web (duarte-santos.ch) tiene datos de ejemplo y no permite sincronización: para tus datos reales usa
              tu instancia.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}