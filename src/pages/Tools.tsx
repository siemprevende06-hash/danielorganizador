import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, Image as ImageIcon, CheckCircle2, Trash2, Film } from 'lucide-react';
import { useImageUpload } from '@/hooks/useImageUpload';

interface VisionCard {
  id: string;
  image?: string;
  checked: boolean;
}

export default function ToolsPage() {
  const [visionCards, setVisionCards] = useState<VisionCard[]>([]);
  const { uploadImage, uploading } = useImageUpload();

  useEffect(() => {
    const stored = localStorage.getItem('idealPartnerVision');
    if (stored) {
      setVisionCards(JSON.parse(stored));
    } else {
      const initialCards = Array.from({ length: 24 }, (_, i) => ({
        id: `card-${i}`,
        checked: false,
      }));
      setVisionCards(initialCards);
    }
  }, []);

  useEffect(() => {
    if (visionCards.length > 0) {
      localStorage.setItem('idealPartnerVision', JSON.stringify(visionCards));
    }
  }, [visionCards]);

  const handleFileUpload = async (cardId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const imageUrl = await uploadImage(file, 'ideal-partner');
    
    if (imageUrl) {
      setVisionCards(prev =>
        prev.map(card =>
          card.id === cardId
            ? { ...card, image: imageUrl }
            : card
        )
      );
    }
  };

  const handleRemoveImage = (cardId: string) => {
    setVisionCards(prev =>
      prev.map(card =>
        card.id === cardId
          ? { ...card, image: undefined }
          : card
      )
    );
  };

  const handleToggleCheck = (cardId: string) => {
    setVisionCards(prev =>
      prev.map(card =>
        card.id === cardId
          ? { ...card, checked: !card.checked }
          : card
      )
    );
  };

  const isGif = (url?: string) => url?.toLowerCase().endsWith('.gif');

  return (
    <div className="container mx-auto px-4 py-24 space-y-6">
      <header>
        <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
          <Wrench className="h-8 w-8" />
          Herramientas
        </h1>
        <p className="text-muted-foreground">Visualiza y manifiesta tus deseos</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Mi Mujer Ideal</span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-normal">
              <ImageIcon className="h-3.5 w-3.5" />
              <span>Imágenes</span>
              <Film className="h-3.5 w-3.5 ml-1" />
              <span>GIFs</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4">
            {uploading && (
              <div className="col-span-full text-center py-4 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                Subiendo archivo...
              </div>
            )}
            {visionCards.map((card) => (
              <div key={card.id} className="relative group">
                <label
                  htmlFor={`upload-${card.id}`}
                  className={`block aspect-square rounded-lg border-2 cursor-pointer transition-all overflow-hidden ${
                    card.checked
                      ? 'border-green-500 ring-2 ring-green-500'
                      : 'border-border hover:border-primary'
                  } ${!card.image ? 'bg-accent' : 'bg-muted'}`}
                >
                  {card.image ? (
                    <img
                      src={card.image}
                      alt={`Vision ${card.id}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">IMG / GIF</span>
                    </div>
                  )}
                </label>
                <input
                  id={`upload-${card.id}`}
                  type="file"
                  accept="image/*,.gif"
                  className="hidden"
                  onChange={(e) => handleFileUpload(card.id, e)}
                />

                {/* Check button */}
                <button
                  onClick={() => handleToggleCheck(card.id)}
                  className={`absolute -top-2 -right-2 rounded-full p-1 z-10 ${
                    card.checked
                      ? 'bg-green-500 text-white'
                      : 'bg-background border-2 border-border'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </button>

                {/* Remove button - visible on hover */}
                {card.image && (
                  <button
                    onClick={() => handleRemoveImage(card.id)}
                    className="absolute -bottom-1 -left-1 rounded-full p-1 bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}

                {/* GIF indicator */}
                {isGif(card.image) && (
                  <span className="absolute bottom-1 right-1 bg-background/80 text-[9px] font-bold px-1 rounded text-muted-foreground">
                    GIF
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
