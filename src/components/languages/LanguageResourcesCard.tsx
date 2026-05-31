import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

export function LanguageResourcesCard() {
  const resources = [
    { name: 'Duolingo', url: 'https://www.duolingo.com/', icon: '🟢' },
    { name: 'Anki Flashcards', url: 'https://apps.ankiweb.net/', icon: '📚' },
    { name: 'YouTube Immersion', url: 'https://www.youtube.com/', icon: '🎬' },
    { name: 'ChatGPT Speaking', url: 'https://chat.openai.com/', icon: '🤖' },
    { name: 'Netflix + Subtítulos', url: 'https://www.netflix.com/', icon: '🎥' },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg">🔗 Recursos Rápidos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {resources.map(resource => (
          <button
            key={resource.name}
            onClick={() => window.open(resource.url, '_blank')}
            className="w-full flex items-center gap-3 p-2 sm:p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
          >
            <span className="text-base sm:text-lg">{resource.icon}</span>
            <span className="text-xs sm:text-sm font-medium">{resource.name}</span>
            <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
