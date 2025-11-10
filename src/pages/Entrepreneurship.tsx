import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Entrepreneurship {
  id: string;
  name: string;
  description: string;
  cover_image?: string;
}

export default function EntrepreneurshipPage() {
  const [entrepreneurships, setEntrepreneurships] = useState<Entrepreneurship[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadEntrepreneurships();
  }, []);

  const loadEntrepreneurships = async () => {
    try {
      const { data, error } = await supabase
        .from('entrepreneurships')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setEntrepreneurships(data || []);
    } catch (error) {
      console.error('Error loading entrepreneurships:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-24 space-y-6">
      <header>
        <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
          <Briefcase className="h-8 w-8" />
          Emprendimientos
        </h1>
        <p className="text-muted-foreground">Gestiona tus proyectos emprendedores</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {entrepreneurships.map((entrepreneurship) => (
          <Card 
            key={entrepreneurship.id} 
            className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden group"
            onClick={() => navigate(`/entrepreneurship/${entrepreneurship.id}`)}
          >
            <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/10 transition-colors">
              {entrepreneurship.cover_image ? (
                <img 
                  src={entrepreneurship.cover_image} 
                  alt={entrepreneurship.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Briefcase className="h-16 w-16 text-primary/40" />
              )}
            </div>
            <CardHeader>
              <CardTitle>{entrepreneurship.name}</CardTitle>
              {entrepreneurship.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {entrepreneurship.description}
                </p>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>

      {entrepreneurships.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No hay emprendimientos disponibles.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
