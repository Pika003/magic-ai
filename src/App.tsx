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
import PaymentPage from "./pages/PaymentPage";
import { Layout } from "@/components/Layout";
import { useUsageTracking } from "@/hooks/useUsageTracking";

const queryClient = new QueryClient();

// PaidUserRoute: Only allows paid users through, otherwise redirects to /payment
const PaidUserRoute = ({ children }: { children: React.ReactNode }) => {
  const { isPaidUser, loading } = useUsageTracking();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  if (!isPaidUser) {
    // Optionally, you can show a message instead of redirect
    window.location.href = "/payment";
    return null;
  }
  return <>{children}</>;
};

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
            <Route 
              path="/payment" 
              element={
                <ProtectedRoute>
                  <PaymentPage />
                </ProtectedRoute>
              } 
            />
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
                  <PaidUserRoute>
                    <Layout>
                      <VersionControlPage />
                    </Layout>
                  </PaidUserRoute>
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
