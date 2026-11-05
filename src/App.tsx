import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { PaidStatusProvider } from "./contexts/PaidStatusContext";
import { ThemeProvider } from "./components/theme-provider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "@/components/Layout";

// Active Pages
import Index from "./pages/Index";
import { AuthPage } from "./components/auth/AuthPage";
import { ProfilePage } from "./components/profile/ProfilePage";
import VersionControlPage from "./pages/VersionControlPage";
import RepoDetailsPage from "./pages/RepoDetailsPage";
import ActionMarketplacePage from "./pages/ActionMarketplacePage";
import PaymentPage from "./pages/PaymentPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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

                {/* Core Feature 1: Version Control & Repos */}
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

                {/* Core Feature 2: Action Marketplace */}
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

                {/* Payment & Pro Plan */}
                <Route
                  path="/payment"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <PaymentPage />
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
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
