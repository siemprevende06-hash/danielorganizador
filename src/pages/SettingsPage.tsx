import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, BookOpen, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { toast } = useToast();
  const [booksPerMonth, setBooksPerMonth] = useState(2);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('app_settings')
        .select('*')
        .eq('setting_key', 'reading_goals')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      if (data?.setting_value) {
        setBooksPerMonth(data.setting_value.books_per_month || 2);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveReadingGoals = async () => {
    try {
      const { error } = await (supabase as any)
        .from('app_settings')
        .upsert({
          setting_key: 'reading_goals',
          setting_value: { books_per_month: booksPerMonth },
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,setting_key' });

      if (error) throw error;
      toast({ title: 'Configuración guardada' });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ title: 'Error', description: 'No se pudo guardar', variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-24"><p className="text-muted-foreground">Cargando...</p></div>;
  }

  return (
    <div className="container mx-auto px-4 py-24 space-y-6">
      <header>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Configuración
        </h1>
        <p className="text-muted-foreground">Ajusta los parámetros de cada área</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5" />
            Lectura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="books-per-month">Cantidad de libros al mes</Label>
            <div className="flex items-center gap-3">
              <Input
                id="books-per-month"
                type="number"
                min={1}
                max={10}
                value={booksPerMonth}
                onChange={(e) => setBooksPerMonth(parseInt(e.target.value) || 1)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">libros/mes</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Este valor se usará como objetivo en la página de Lectura
            </p>
          </div>
          <Button onClick={saveReadingGoals}>
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
