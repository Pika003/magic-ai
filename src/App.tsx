
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { NotificationBar } from "./components/NotificationBar";
import Index from "./pages/Index";
import { AuthPage } from "./components/auth/AuthPage";
import { ProfilePage } from "./components/profile/ProfilePage";
import { CorrectSentence } from "./components/CorrectSentence";
import { ClientUpdate } from "./components/ClientUpdate";
import { TodaysUpdate } from "./components/TodaysUpdate";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <NotificationBar />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route 
              path="/correct-sentence" 
              element={
                <ProtectedRoute>
                  <CorrectSentence />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/client-update" 
              element={
                <ProtectedRoute>
                  <ClientUpdate />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/todays-update" 
              element={
                <ProtectedRoute>
                  <TodaysUpdate />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
