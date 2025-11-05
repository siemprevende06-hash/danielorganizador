import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Upload } from 'lucide-react';

interface VisionCard {
  id: string;
  image: string | null;
  checked: boolean;
}

const VISION_BOARD_KEY = 'visionBoardCards';

export const VisionBoardGrid = () => {
  const [cards, setCards] = useState<VisionCard[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(VISION_BOARD_KEY);
    if (stored) {
      setCards(JSON.parse(stored));
    } else {
      // Initialize 18 cards (3 rows x 6 columns)
      const initialCards = Array.from({ length: 18 }, (_, i) => ({
        id: `vision-card-${i}`,
        image: null,
        checked: false,
      }));
      setCards(initialCards);
      localStorage.setItem(VISION_BOARD_KEY, JSON.stringify(initialCards));
    }
  }, []);

  useEffect(() => {
    if (cards.length > 0) {
      localStorage.setItem(VISION_BOARD_KEY, JSON.stringify(cards));
    }
  }, [cards]);

  const handleImageUpload = (cardId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setCards(prev =>
        prev.map(card =>
          card.id === cardId ? { ...card, image: imageData } : card
        )
      );
    };
    reader.readAsDataURL(file);
  };

  const handleCheckChange = (cardId: string, checked: boolean) => {
    setCards(prev =>
      prev.map(card =>
        card.id === cardId ? { ...card, checked } : card
      )
    );
  };

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  return (
    <div className="grid grid-cols-6 gap-4">
      {cards.map((card) => (
        <Card
          key={card.id}
          className={cn(
            "relative aspect-square overflow-hidden transition-all cursor-pointer hover:shadow-lg",
            card.checked && "border-2 border-green-500 ring-2 ring-green-500/20"
          )}
          onClick={() => {
            if (!card.image) {
              fileInputRefs.current[card.id]?.click();
            }
          }}
        >
          <input
            ref={(el) => (fileInputRefs.current[card.id] = el)}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleImageUpload(card.id, file);
              }
            }}
          />
          
          {card.image ? (
            <>
              <img
                src={card.image}
                alt="Vision"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded p-1">
                <Checkbox
                  checked={card.checked}
                  onCheckedChange={(checked) =>
                    handleCheckChange(card.id, checked as boolean)
                  }
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
              <Upload className="h-8 w-8 mb-2" />
              <span className="text-xs">Subir imagen</span>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};
