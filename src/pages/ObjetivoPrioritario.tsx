import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Target } from 'lucide-react';
import danielFlaco from '@/assets/daniel-flaco.jpg';
import danielFuerte from '@/assets/daniel-fuerte.jpg';

type Version = 'actual' | 'comodidad';

const ObjetivoPrioritario = () => {
  const [version, setVersion] = useState<Version>('actual');

  const source = version === 'actual' ? danielFlaco : danielFuerte;

  return (
    <div className="min-h-screen pt-20 pb-8 px-4">
      <div className="container mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
            <Target className="h-8 w-8 text-primary" />
            Objetivo Prioritario
          </h1>
        </div>

        {/* Switches */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
              <div className="flex items-center justify-between gap-4 border rounded-lg px-4 py-3 min-w-[200px]">
                <span className="text-sm font-medium text-foreground">Versión Actual</span>
                <Switch
                  checked={version === 'actual'}
                  onCheckedChange={(checked) => checked && setVersion('actual')}
                  aria-label="Versión actual"
                />
              </div>
              <div className="flex items-center justify-between gap-4 border rounded-lg px-4 py-3 min-w-[200px]">
                <span className="text-sm font-medium text-foreground">Versión (Comodidad)</span>
                <Switch
                  checked={version === 'comodidad'}
                  onCheckedChange={(checked) => checked && setVersion('comodidad')}
                  aria-label="Versión comodidad"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Central photo with free side areas */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Left free area */}
              <div className="hidden md:block h-full rounded-lg border-2 border-dashed border-muted" />

              {/* Central photo */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-56 h-80 md:w-64 md:h-96 rounded-2xl overflow-hidden border-2 border-primary shadow-xl shadow-primary/20">
                  <img
                    src={source}
                    alt={version === 'actual' ? 'Versión Actual' : 'Versión Comodidad'}
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <span className="text-white text-sm font-medium">
                      {version === 'actual' ? 'Versión Actual' : 'Versión Comodidad'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right free area */}
              <div className="hidden md:block h-full rounded-lg border-2 border-dashed border-muted" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ObjetivoPrioritario;
