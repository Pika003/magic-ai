import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { PaidStatusProvider } from "./contexts/PaidStatusContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import { AuthPage } from "./components/auth/AuthPage";
import { ProfilePage } from "./components/profile/ProfilePage";
import VersionControlPage from "./pages/VersionControlPage";
import RepoDetailsPage from "./pages/RepoDetailsPage";
import ActionMarketplacePage from "./pages/ActionMarketplacePage";
import NotFound from "./pages/NotFound";
import { Layout } from "@/components/Layout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PaidStatusProvider>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />

              {/* Profile */}
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

              {/* Version Control */}
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
              <Route
                path="/version-control/github/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <RepoDetailsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/version-control/gitlab/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <RepoDetailsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Action Marketplace */}
              <Route
                path="/action-marketplace"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ActionMarketplacePage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </PaidStatusProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
