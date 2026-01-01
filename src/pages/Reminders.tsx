import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Trash2, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useReminders } from '@/hooks/useReminders';

export default function RemindersPage() {
  const { reminders, isLoading, addReminder, toggleReminder, deleteReminder } = useReminders();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateTime, setDateTime] = useState('');
  const { toast } = useToast();

  const handleCreateReminder = async () => {
    if (!title.trim()) return;

    const result = await addReminder({ title, description, dateTime });
    if (result) {
      setTitle('');
      setDescription('');
      setDateTime('');
      setIsDialogOpen(false);
      toast({ title: 'Recordatorio creado', description: `${title} ha sido añadido.` });
    }
  };

  const handleToggleReminder = async (reminderId: string) => {
    await toggleReminder(reminderId);
  };

  const handleDeleteReminder = async (reminderId: string) => {
    await deleteReminder(reminderId);
    toast({ title: 'Recordatorio eliminado' });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-24 space-y-6">
        <header>
          <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Recordatorios
          </h1>
          <p className="text-muted-foreground">Cargando...</p>
        </header>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-24 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <header>
          <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Recordatorios
          </h1>
          <p className="text-muted-foreground">No olvides lo importante</p>
        </header>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Recordatorio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Recordatorio</DialogTitle>
              <DialogDescription>Define tu recordatorio.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Llamar al doctor" />
              </div>
              <div>
                <label className="text-sm font-medium">Descripción</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalles..." />
              </div>
              <div>
                <label className="text-sm font-medium">Fecha y hora</label>
                <Input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateReminder}>Crear Recordatorio</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {reminders.map((reminder) => (
          <Card key={reminder.id} className={reminder.completed ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Checkbox
                    checked={reminder.completed}
                    onCheckedChange={() => handleToggleReminder(reminder.id)}
                  />
                  <div className="flex-1">
                    <CardTitle className={`text-lg ${reminder.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {reminder.title}
                    </CardTitle>
                    {reminder.description && (
                      <p className="text-sm text-muted-foreground mt-1">{reminder.description}</p>
                    )}
                    {reminder.dateTime && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(reminder.dateTime).toLocaleString('es-ES')}
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteReminder(reminder.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {reminders.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No tienes recordatorios aún.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
