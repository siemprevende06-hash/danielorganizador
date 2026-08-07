import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Navigation } from "./components/Navigation";
import { OfflineProvider } from "./providers/OfflineProvider";
import { useAutoTheme } from "./hooks/useAutoTheme";
import { TimeframeProvider } from "./contexts/TimeframeContext";
import { SidebarProvider, useSidebar } from "./contexts/SidebarContext";
import Index from "./pages/Index";
import Inicio2 from "./pages/Inicio2";
import NotFound from "./pages/NotFound";
import ControlRoom from "./pages/ControlRoom";
import Habits from "./pages/Habits";
import DailyRoutine from "./pages/DailyRoutine";
import ActivationRoutine from "./pages/ActivationRoutine";
import DeactivationRoutine from "./pages/DeactivationRoutine";
import Finance from "./pages/Finance";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import DailyView from "./pages/DailyView";
import WeeklyView from "./pages/WeeklyView";
import MonthlyView from "./pages/MonthlyView";
import Goals from "./pages/Goals";
import Journaling from "./pages/Journaling";
import Entrepreneurship from "./pages/Entrepreneurship";
import EntrepreneurshipDetail from "./pages/EntrepreneurshipDetail";
import University from "./pages/University";
import Tools from "./pages/Tools";
import Reminders from "./pages/Reminders";
import DayPlanner from "./pages/DayPlanner";
import Focus from "./pages/Focus";
import RoutineDay from "./pages/RoutineDay";
import PerformanceModes from "./pages/PerformanceModes";
import Systems from "./pages/Systems";
import TwelveWeekYear from "./pages/TwelveWeekYear";
import Weeks from "./pages/Weeks";
import VidaDanielEstadisticas from "./pages/VidaDanielEstadisticas";
import DailySelfReview from "./pages/DailySelfReview";
import LifeAlignment from "./pages/LifeAlignment";
import GoalAlignment from "./pages/GoalAlignment";
import ConfidenceSteps from "./pages/ConfidenceSteps";
import ReadingLibrary from "./pages/ReadingLibrary";
import MusicDashboard from "./pages/MusicDashboard";
import LanguagesDashboard from "./pages/LanguagesDashboard";
import Purpose from "./pages/Purpose";
import SettingsPage from "./pages/SettingsPage";
import PeriodicReview from "./pages/PeriodicReview";
import SprintPage from "./pages/SprintPage";
import VisionPage from "./pages/VisionPage";
import AntiVisionPage from "./pages/AntiVisionPage";
import Alimentacion from "./pages/Alimentacion";
import Gym from "./pages/Gym";
import Chess from "./pages/Chess";
import ShoppingList from "./pages/ShoppingList";
import Grocery from "./pages/Grocery";
import PlanIdentidad from "./pages/PlanIdentidad";
import MorningPrep from "./pages/MorningPrep";
import WeekendRoutine from "./pages/WeekendRoutine";
import PuntoPartida from "./pages/PuntoPartida";
import BoxeoPage from "./pages/BoxeoPage";
import VidaSocial from "./pages/VidaSocial";
import MisNecesidades from "./pages/MisNecesidades";
import Novia from "./pages/Novia";
import AreasDeVida from "./pages/AreasDeVida";
import MapaDeVidaPage from "./pages/MapaDeVida";
import Recompensas from "./pages/Recompensas";
import Paginas from "./pages/Paginas";
import Motivos from "./pages/Motivos";
import MonthlyPlanningPage from "./pages/MonthlyPlanningPage";
import TrimestralPlanningPage from "./pages/TrimestralPlanningPage";
import WeeklyPlanningPage from "./pages/WeeklyPlanningPage";
import Realidad from "./pages/Realidad";
import HabilidadesValiosas from "./pages/HabilidadesValiosas";
import ObjetivoVision1Ano from "./pages/ObjetivoVision1Ano";
import PlanManana from "./pages/PlanManana";
import EstadisticasEsfuerzo from "./pages/EstadisticasEsfuerzo";
import VisionVsRealidad from "./pages/VisionVsRealidad";
import Identidad from "./pages/Identidad";
import DestinoALlegar from "./pages/DestinoALlegar";
import AnualView from "./pages/AnualView";

const queryClient = new QueryClient();

function AppContent() {
  useAutoTheme();
  const { collapsed } = useSidebar();

  return (
    <div className={cn("pt-12 lg:pt-0 min-h-screen transition-all duration-200", collapsed ? "lg:ml-14" : "lg:ml-56")}>
      <Navigation />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/inicio-2" element={<Inicio2 />} />
        <Route path="/control-room" element={<ControlRoom />} />
        <Route path="/habits" element={<Habits />} />
        <Route path="/routine" element={<DailyRoutine />} />
        <Route path="/daily-routine" element={<DailyRoutine />} />
        <Route path="/activation-routine" element={<ActivationRoutine />} />
        <Route path="/deactivation-routine" element={<DeactivationRoutine />} />
        <Route path="/weekend-routine" element={<WeekendRoutine />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/daily" element={<DailyView />} />
        <Route path="/weekly" element={<WeeklyView />} />
        <Route path="/monthly" element={<MonthlyView />} />
        <Route path="/monthly-planning" element={<MonthlyPlanningPage />} />
        <Route path="/trimestral-planning" element={<TrimestralPlanningPage />} />
        <Route path="/weekly-planning" element={<WeeklyPlanningPage />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/journaling" element={<Journaling />} />
        <Route path="/entrepreneurship" element={<Entrepreneurship />} />
        <Route path="/entrepreneurship/:id" element={<EntrepreneurshipDetail />} />
        <Route path="/university" element={<University />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/day-planner" element={<DayPlanner />} />
        <Route path="/focus" element={<Focus />} />
        <Route path="/routine-day" element={<RoutineDay />} />
        <Route path="/performance-modes" element={<PerformanceModes />} />
        <Route path="/systems" element={<Systems />} />
        <Route path="/sprint" element={<SprintPage />} />
        <Route path="/vision" element={<VisionPage />} />
        <Route path="/antivision" element={<AntiVisionPage />} />
        <Route path="/12-week-year" element={<TwelveWeekYear />} />
        <Route path="/3-meses" element={<TwelveWeekYear />} />
        <Route path="/anual" element={<AnualView />} />
        <Route path="/weeks" element={<Weeks />} />
        <Route path="/goal-alignment" element={<GoalAlignment />} />
        <Route path="/vida-daniel" element={<VidaDanielEstadisticas />} />
        <Route path="/self-review" element={<DailySelfReview />} />
        <Route path="/life-alignment" element={<LifeAlignment />} />
        <Route path="/areas-de-vida" element={<AreasDeVida />} />
        <Route path="/mapa-de-vida" element={<MapaDeVidaPage />} />
        <Route path="/recompensas" element={<Recompensas />} />
        <Route path="/confidence-steps" element={<ConfidenceSteps />} />
        <Route path="/reading-library" element={<ReadingLibrary />} />
        <Route path="/music-dashboard" element={<MusicDashboard />} />
        <Route path="/languages-dashboard" element={<LanguagesDashboard />} />
        <Route path="/proposito" element={<Purpose />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/periodic-review" element={<PeriodicReview />} />
        <Route path="/alimentacion" element={<Alimentacion />} />
        <Route path="/gym" element={<Gym />} />
        <Route path="/chess" element={<Chess />} />
        <Route path="/grocery" element={<Grocery />} />
        <Route path="/shopping-list" element={<ShoppingList />} />
        <Route path="/identidad" element={<Identidad />} />
        <Route path="/plan-identidad" element={<PlanIdentidad />} />
        <Route path="/morning-prep" element={<MorningPrep />} />
        <Route path="/punto-partida" element={<PuntoPartida />} />
        <Route path="/boxeo" element={<BoxeoPage />} />
        <Route path="/vida-social" element={<VidaSocial />} />
        <Route path="/mis-necesidades" element={<MisNecesidades />} />
        <Route path="/novia" element={<Novia />} />
        <Route path="/motivos" element={<Motivos />} />
        <Route path="/motivos/realidad" element={<Realidad />} />
        <Route path="/paginas" element={<Paginas />} />
        <Route path="/paginas/:id" element={<Paginas />} />
        <Route path="/habilidades-valiosas" element={<HabilidadesValiosas />} />
        <Route path="/objetivo-vision-1-ano" element={<ObjetivoVision1Ano />} />
        <Route path="/plan-manana" element={<PlanManana />} />
        <Route path="/estadisticas-esfuerzo" element={<EstadisticasEsfuerzo />} />
        <Route path="/vision-vs-realidad" element={<VisionVsRealidad />} />
        <Route path="/destino-a-llegar" element={<DestinoALlegar />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <OfflineProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <TimeframeProvider>
            <SidebarProvider>
              <AppContent />
            </SidebarProvider>
          </TimeframeProvider>
        </HashRouter>
      </OfflineProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
