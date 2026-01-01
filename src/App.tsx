import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "./components/Navigation";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          <Route path="/12-week-year" element={<TwelveWeekYear />} />
          <Route path="/weeks" element={<Weeks />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
