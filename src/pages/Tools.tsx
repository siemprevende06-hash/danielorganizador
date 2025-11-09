import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

interface VisionCard {
  id: string;
  image?: string;
  checked: boolean;
}

export default function ToolsPage() {
  const [visionCards, setVisionCards] = useState<VisionCard[]>([]);

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

  const handleImageUpload = (cardId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setVisionCards(prev =>
        prev.map(card =>
          card.id === cardId
            ? { ...card, image: reader.result as string }
            : card
        )
      );
    };
    reader.readAsDataURL(file);
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
          <CardTitle>Mi Mujer Ideal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            {visionCards.map((card) => (
              <div key={card.id} className="relative">
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
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </label>
                <input
                  id={`upload-${card.id}`}
                  type="file"
                  accept="image/*,image/gif"
                  className="hidden"
                  onChange={(e) => handleImageUpload(card.id, e)}
                />
                <button
                  onClick={() => handleToggleCheck(card.id)}
                  className={`absolute -top-2 -right-2 rounded-full p-1 ${
                    card.checked
                      ? 'bg-green-500 text-white'
                      : 'bg-background border-2 border-border'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
