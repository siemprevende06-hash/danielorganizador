import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Scale, Camera } from 'lucide-react';
import { useImageUpload } from '@/hooks/useImageUpload';

interface AddMeasurementDialogProps {
  onSave: (measurement: {
    weight: number;
    body_fat_percentage?: number;
    chest_cm?: number;
    waist_cm?: number;
    arm_cm?: number;
    front_photo_url?: string;
    side_photo_url?: string;
    notes?: string;
  }) => Promise<unknown>;
}

export const AddMeasurementDialog = ({ onSave }: AddMeasurementDialogProps) => {
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [notes, setNotes] = useState('');
  const [frontPhotoUrl, setFrontPhotoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { uploadImage, uploading } = useImageUpload();

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await uploadImage(file);
      if (url) setFrontPhotoUrl(url);
    }
  };

  const handleSubmit = async () => {
    if (!weight) return;
    
    setIsLoading(true);
    await onSave({
      weight: parseFloat(weight),
      body_fat_percentage: bodyFat ? parseFloat(bodyFat) : undefined,
      front_photo_url: frontPhotoUrl || undefined,
      notes: notes || undefined
    });
    
    setWeight('');
    setBodyFat('');
    setNotes('');
    setFrontPhotoUrl('');
    setIsLoading(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Actualizar Peso
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Registrar Medición
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Peso actual (kg) *</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              placeholder="67.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bodyFat">% Grasa corporal (opcional)</Label>
            <Input
              id="bodyFat"
              type="number"
              step="0.1"
              placeholder="15.0"
              value={bodyFat}
              onChange={(e) => setBodyFat(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Foto de progreso (opcional)</Label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted transition-colors">
                <Camera className="h-4 w-4" />
                <span className="text-sm">{uploading ? 'Subiendo...' : 'Subir foto'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                />
              </label>
              {frontPhotoUrl && (
                <img 
                  src={frontPhotoUrl} 
                  alt="Preview" 
                  className="h-12 w-12 object-cover rounded"
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="¿Cómo te sientes hoy?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!weight || isLoading}
          >
            {isLoading ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
