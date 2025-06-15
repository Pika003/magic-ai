
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import { AuthPage } from "./components/auth/AuthPage";
import { ProfilePage } from "./components/profile/ProfilePage";
import { CorrectSentence } from "./components/CorrectSentence";
import { ClientUpdate } from "./components/ClientUpdate";
import { TodaysUpdate } from "./components/TodaysUpdate";
import NotFound from "./pages/NotFound";
import { ProjectsPage } from "./pages/ProjectsPage";
import VersionControlPage from "./pages/VersionControlPage";
import { Layout } from "@/components/Layout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            {/* Protected pages are now always rendered WITH the Layout, so the header/sidebar show */}
            <Route 
              path="/correct-sentence" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <CorrectSentence />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/client-update" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <ClientUpdate />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/todays-update" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <TodaysUpdate />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProfilePage />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/projects" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProjectsPage />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/version-control"
              element={
                <ProtectedRoute>
                  <Layout>
                    <VersionControlPage />
                  </Layout>
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

