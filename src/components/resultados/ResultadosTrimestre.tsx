import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid,
} from 'recharts';
import {
  AreaRow, ResumenGeneral, CheckItem, ResultRow, StagesBar, AREA_COLORS,
} from './shared';

const hoursByArea = [
  { area: 'Universidad', hrs: 142, fill: '#3b82f6' },
  { area: 'Lectura', hrs: 58, fill: '#06b6d4' },
  { area: 'Música', hrs: 55, fill: '#ec4899' },
  { area: 'Emprendimiento', hrs: 62, fill: '#a855f7' },
  { area: 'Proyectos', hrs: 48, fill: '#f59e0b' },
  { area: 'Gym', hrs: 34, fill: '#ef4444' },
  { area: 'Ajedrez', hrs: 26, fill: '#334155' },
  { area: 'Game', hrs: 20, fill: '#f43f5e' },
];
const booksQuarter = [
  { name: 'Leídos', value: 4 },
  { name: 'En curso', value: 2 },
  { name: 'Pendientes', value: 2 },
];
const songsQuarter = [
  { name: 'Aprendidas', value: 8 },
  { name: 'En progreso', value: 3 },
];
const eloQuarter = [
  { w: 'S1', elo: 1050 }, { w: 'S2', elo: 1058 }, { w: 'S3', elo: 1064 }, { w: 'S4', elo: 1071 },
  { w: 'S5', elo: 1077 }, { w: 'S6', elo: 1082 }, { w: 'S7', elo: 1085 }, { w: 'S8', elo: 1088 },
  { w: 'S9', elo: 1090 }, { w: 'S10', elo: 1090 }, { w: 'S11', elo: 1093 }, { w: 'S12', elo: 1096 },
];
const strengthQuarter = [
  { m: 'M1', kg: 60 }, { m: 'M2', kg: 65 }, { m: 'M3', kg: 68 },
];

export function ResultadosTrimestre() {
  return (
    <div className="space-y-5">
      <ResumenGeneral
        score={92}
        subtitle="Trimestre completado · 92%"
        badges={['4 libros terminados', '8 canciones', '5 exámenes aprobados', 'Racha 12 semanas']}
        stats={[['Horas', '428h'], ['Libros', '4/8'], ['Elo', '+46'], ['Press', '+8kg']]}
      />

      {/* Tiempo del trimestre */}
      <AreaRow
        title="Tiempo del trimestre"
        color="from-indigo-500 to-violet-500"
        plan={
          <ul className="space-y-1.5">
            <CheckItem done>Universidad: min 360h</CheckItem>
            <CheckItem done>Lectura: 150h en plan</CheckItem>
            <CheckItem>Música: 165h al piano</CheckItem>
            <CheckItem done>Emprendimiento: 180h</CheckItem>
          </ul>
        }
        result={
          <>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hoursByArea} layout="vertical" margin={{ top: 0, right: 6, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.06)" />
                  <XAxis type="number" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="area" width={86} tick={{ fontSize: 8 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }}
                    formatter={(v: any, n: any) => [`${v} h`, n]} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <Bar dataKey="hrs" radius={[0, 4, 4, 0]}>
                    {hoursByArea.map(entry => <Cell key={entry.area} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-muted-foreground">428 horas invertidas · plan meta 840h</p>
          </>
        }
      />

      {/* Universidad */}
      <AreaRow
        title="Universidad"
        color={AREA_COLORS.universidad}
        plan={
          <ul className="space-y-1.5">
            <CheckItem done>Terminar Cálculo III</CheckItem>
            <CheckItem done>Aprobar Física II</CheckItem>
            <CheckItem>Inglés B1</CheckItem>
          </ul>
        }
        result={
          <div className="space-y-1">
            <ResultRow label="Cálculo III" value="Aprobado 4.5" ok />
            <ResultRow label="Física II" value="Aprobado 4.1" ok />
            <ResultRow label="Inglés B1" value="En curso 60%" pending />
            <ResultRow label="Materias regulares" value="5/5" ok />
          </div>
        }
      />

      {/* Lectura */}
      <AreaRow
        title="Lectura"
        color={AREA_COLORS.lectura}
        plan={
          <ul className="space-y-1.5">
            <CheckItem done>4 libros del plan trimestre</CheckItem>
            <CheckItem>2 extra opcionales</CheckItem>
          </ul>
        }
        result={
          <>
            <div className="flex items-center gap-4">
              <div className="w-28 h-28 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={booksQuarter} dataKey="value" innerRadius={32} outerRadius={46} paddingAngle={3} stroke="none">
                      <Cell fill="#10b981" />
                      <Cell fill="#06b6d4" />
                      <Cell fill="#e2e8f0" />
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /> 4 leídos (50%)</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-500" /> 2 en curso</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-200" /> 2 pendientes</div>
              </div>
            </div>
            <div className="space-y-1">
              <ResultRow label="Páginas acumuladas" value="2.410" ok />
              <ResultRow label="Promedio semanal" value="201 pág" />
            </div>
          </>
        }
      />

      {/* Música */}
      <AreaRow
        title="Música"
        color={AREA_COLORS.musica}
        plan={
          <ul className="space-y-1.5">
            <CheckItem done>10 canciones del plan</CheckItem>
            <CheckItem done>"Vals No. 2" completo</CheckItem>
          </ul>
        }
        result={
          <>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={songsQuarter} dataKey="value" innerRadius={27} outerRadius={40} paddingAngle={3} stroke="none">
                      <Cell fill="#ec4899" />
                      <Cell fill="#f9a8d4" />
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-pink-500" /> 8 aprendidas</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-pink-200" /> 3 en progreso</div>
              </div>
            </div>
            <div className="space-y-1">
              <ResultRow label="Mejor logro" value='"Vals No. 2" al 100%' ok />
              <ResultRow label="Mirada" value='3 canciones al 60-80%' pending />
            </div>
          </>
        }
      />

      {/* Emprendimiento */}
      <AreaRow
        title="Emprendimiento"
        color={AREA_COLORS.emprendimiento}
        plan={
          <ul className="space-y-1.5">
            <CheckItem>120 leads en trimestre</CheckItem>
            <CheckItem>10 clientes cerrados</CheckItem>
          </ul>
        }
        result={
          <div className="space-y-1">
            <ResultRow label="Leads generados" value="96/120" />
            <ResultRow label="Clientes cerrados" value="7/10" />
            <ResultRow label="Ingresos trimestre" value="$1.2k" ok />
          </div>
        }
      />

      {/* Proyectos */}
      <AreaRow
        title="Proyectos"
        color={AREA_COLORS.proyectos}
        plan={
          <ul className="space-y-1.5">
            <CheckItem done>App organizador — MVP</CheckItem>
            <CheckItem>Landing cliente A</CheckItem>
          </ul>
        }
        result={
          <div className="space-y-1">
            <ResultRow label="MVP app" value="Desplegado" ok />
            <ResultRow label="Landing cliente A" value="80%" />
            <ResultRow label="Tareas entregadas" value="34/40" />
          </div>
        }
      />

      {/* Ajedrez */}
      <AreaRow
        title="Ajedrez"
        color={AREA_COLORS.ajedrez}
        plan={
          <ul className="space-y-1.5">
            <CheckItem>90 partidas en trimestre</CheckItem>
            <CheckItem>Llegar a 1100 Elo</CheckItem>
          </ul>
        }
        result={
          <>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Elo inicio → fin</span>
              <span className="font-semibold text-sm">1050 → 1096 <span className="text-emerald-500 text-xs">▲ +46</span></span>
            </div>
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={eloQuarter} margin={{ top: 5, right: 0, left: -28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="w" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} interval={1} />
                  <YAxis domain={[1040, 1110]} tick={{ fontSize: 8 }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }}
                    formatter={(v: any) => [`${v}`, 'Elo']} />
                  <Line type="monotone" dataKey="elo" stroke="#0f172a" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1">
              <ResultRow label="Partidas jugadas" value="78/90" />
              <ResultRow label="Winrate" value="62%" ok />
            </div>
          </>
        }
      />

      {/* Gym */}
      <AreaRow
        title="Gym"
        color={AREA_COLORS.gym}
        plan={
          <ul className="space-y-1.5">
            <CheckItem>36 entrenamientos</CheckItem>
            <CheckItem>Press banca → 70kg</CheckItem>
          </ul>
        }
        result={
          <>
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={strengthQuarter} margin={{ top: 5, right: 0, left: -28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="m" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[55, 75]} tick={{ fontSize: 8 }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }}
                    formatter={(v: any) => [`${v} kg`, 'Peso']} />
                  <Line type="monotone" dataKey="kg" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1">
              <ResultRow label="Entrenamientos" value="31/36" />
              <ResultRow label="Press banca" value="68 kg (meta 70)" pending />
              <ResultRow label="Consistencia" value="86%" ok />
            </div>
          </>
        }
      />

      {/* Game */}
      <AreaRow
        title="Game"
        color={AREA_COLORS.game}
        plan={
          <ul className="space-y-1.5">
            <CheckItem>10 citas en trimestre</CheckItem>
            <CheckItem>Relación estable</CheckItem>
          </ul>
        }
        result={
          <>
            <div className="space-y-1">
              <ResultRow label="Citas" value="12" ok />
              <ResultRow label="Número cerrados" value="4" />
              <ResultRow label="Relación" value="Estable desde S9" ok />
            </div>
            <StagesBar stages={['Conocí', 'Salí', 'Besé', 'Intimidad']} current={3} />
          </>
        }
      />
    </div>
  );
}