import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import { OfflineProvider } from "./providers/OfflineProvider";
import { useAutoTheme } from "./hooks/useAutoTheme";
import { TimeframeProvider } from "./contexts/TimeframeContext";
import Index from "./pages/Index";
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
import Alimentacion from "./pages/Alimentacion";
import Gym from "./pages/Gym";
import Chess from "./pages/Chess";
import ShoppingList from "./pages/ShoppingList";
import PlanIdentidad from "./pages/PlanIdentidad";
import MorningPrep from "./pages/MorningPrep";
import PuntoPartida from "./pages/PuntoPartida";

const queryClient = new QueryClient();

function AppContent() {
  useAutoTheme();

  return (
    <div className="lg:ml-56 pt-12 lg:pt-0 min-h-screen">
      <Navigation />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/control-room" element={<ControlRoom />} />
        <Route path="/habits" element={<Habits />} />
        <Route path="/routine" element={<DailyRoutine />} />
        <Route path="/daily-routine" element={<DailyRoutine />} />
        <Route path="/activation-routine" element={<ActivationRoutine />} />
        <Route path="/deactivation-routine" element={<DeactivationRoutine />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/daily" element={<DailyView />} />
        <Route path="/weekly" element={<WeeklyView />} />
        <Route path="/monthly" element={<MonthlyView />} />
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
        <Route path="/12-week-year" element={<TwelveWeekYear />} />
        <Route path="/3-meses" element={<TwelveWeekYear />} />
        <Route path="/weeks" element={<Weeks />} />
        <Route path="/goal-alignment" element={<GoalAlignment />} />
        <Route path="/vida-daniel" element={<VidaDanielEstadisticas />} />
        <Route path="/self-review" element={<DailySelfReview />} />
        <Route path="/life-alignment" element={<LifeAlignment />} />
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
        <Route path="/shopping-list" element={<ShoppingList />} />
        <Route path="/plan-identidad" element={<PlanIdentidad />} />
        <Route path="/morning-prep" element={<MorningPrep />} />
        <Route path="/punto-partida" element={<PuntoPartida />} />
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
        <BrowserRouter>
          <TimeframeProvider>
            <AppContent />
          </TimeframeProvider>
        </BrowserRouter>
      </OfflineProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
