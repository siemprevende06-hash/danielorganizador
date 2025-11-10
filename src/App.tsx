import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
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
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/control-room" element={<ProtectedRoute><ControlRoom /></ProtectedRoute>} />
          <Route path="/habits" element={<ProtectedRoute><Habits /></ProtectedRoute>} />
          <Route path="/routine" element={<ProtectedRoute><DailyRoutine /></ProtectedRoute>} />
          <Route path="/daily-routine" element={<ProtectedRoute><DailyRoutine /></ProtectedRoute>} />
          <Route path="/activation-routine" element={<ProtectedRoute><ActivationRoutine /></ProtectedRoute>} />
          <Route path="/deactivation-routine" element={<ProtectedRoute><DeactivationRoutine /></ProtectedRoute>} />
          <Route path="/finance" element={<ProtectedRoute><Finance /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
          <Route path="/daily" element={<ProtectedRoute><DailyView /></ProtectedRoute>} />
          <Route path="/weekly" element={<ProtectedRoute><WeeklyView /></ProtectedRoute>} />
          <Route path="/monthly" element={<ProtectedRoute><MonthlyView /></ProtectedRoute>} />
          <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
          <Route path="/journaling" element={<ProtectedRoute><Journaling /></ProtectedRoute>} />
          <Route path="/entrepreneurship" element={<ProtectedRoute><Entrepreneurship /></ProtectedRoute>} />
          <Route path="/entrepreneurship/:id" element={<ProtectedRoute><EntrepreneurshipDetail /></ProtectedRoute>} />
          <Route path="/university" element={<ProtectedRoute><University /></ProtectedRoute>} />
          <Route path="/tools" element={<ProtectedRoute><Tools /></ProtectedRoute>} />
          <Route path="/reminders" element={<ProtectedRoute><Reminders /></ProtectedRoute>} />
          <Route path="/day-planner" element={<ProtectedRoute><DayPlanner /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
