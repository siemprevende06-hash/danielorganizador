import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Calendar, Clock, Save } from 'lucide-react';

interface UniversitySettingsProps {
  currentYear: number;
  currentSemester: number;
  academicSchedule: any[];
  onSave: (settings: {
    current_year?: number;
    current_semester?: number;
    academic_schedule?: any[];
  }) => Promise<boolean>;
}

export function UniversitySettings({
  currentYear,
  currentSemester,
  academicSchedule,
  onSave
}: UniversitySettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [year, setYear] = useState(currentYear.toString());
  const [semester, setSemester] = useState(currentSemester.toString());
  const [scheduleText, setScheduleText] = useState(
    academicSchedule.length > 0 
      ? JSON.stringify(academicSchedule, null, 2) 
      : `[
  { "day": "Lunes", "start": "08:00", "end": "10:00", "subject": "" },
  { "day": "Martes", "start": "08:00", "end": "10:00", "subject": "" }
]`
  );

  const handleSave = async () => {
    let parsedSchedule = [];
    try {
      parsedSchedule = JSON.parse(scheduleText);
    } catch (e) {
      parsedSchedule = academicSchedule;
    }

    const success = await onSave({
      current_year: parseInt(year) || 1,
      current_semester: parseInt(semester) || 1,
      academic_schedule: parsedSchedule
    });

    if (success) {
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configuración
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración Universidad
          </DialogTitle>
          <DialogDescription>
            Configura tu año, semestre y horario académico
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Año
              </label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1° Año</SelectItem>
                  <SelectItem value="2">2° Año</SelectItem>
                  <SelectItem value="3">3° Año</SelectItem>
                  <SelectItem value="4">4° Año</SelectItem>
                  <SelectItem value="5">5° Año</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Semestre
              </label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1° Semestre</SelectItem>
                  <SelectItem value="2">2° Semestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">
              Horario Académico (JSON)
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Define tu horario de clases en formato JSON
            </p>
            <Textarea 
              value={scheduleText}
              onChange={(e) => setScheduleText(e.target.value)}
              rows={8}
              className="font-mono text-xs"
              placeholder='[{"day": "Lunes", "start": "08:00", "end": "10:00", "subject": "Cálculo I"}]'
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
