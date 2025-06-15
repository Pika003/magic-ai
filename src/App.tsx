
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
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
-import { useUsageTracking } from "@/hooks/useUsageTracking";
-import React from "react";
-import { useLocation, useNavigate } from "react-router-dom";
+import React from "react";
+import { PaidStatusProvider, usePaidStatus } from "./contexts/PaidStatusContext";

// PaidUserRoute: Now connected to PaidStatusContext and never stales
const PaidUserRoute = ({ children }: { children: React.ReactNode }) => {
-  const { isPaidUser, loading, refreshPaidStatus } = useUsageTracking();
-  const [checking, setChecking] = React.useState(false);
-  const [, setRefresh] = React.useState(0);
-  const location = useLocation();
-  const navigate = useNavigate();
-
-  // Listen for unlock event everywhere
-  React.useEffect(() => {
-    const onPaidUnlock = () => setRefresh(n => n + 1);
-    window.addEventListener("sentence-ai-paid-unlock", onPaidUnlock);
-    return () => window.removeEventListener("sentence-ai-paid-unlock", onPaidUnlock);
-  }, []);
-
-  // Check explicitly for `payment=success` in the query string
-  React.useEffect(() => {
-    const params = new URLSearchParams(location.search);
-    if (params.get("payment") === "success") {
-      setChecking(true);
-      refreshPaidStatus()
-        .then(() => setChecking(false))
-        .catch(() => setChecking(false));
-    }
-  }, [location.search, refreshPaidStatus]);
-
-  if (loading || checking) {
-    return (
-      <div className="min-h-screen flex items-center justify-center">
-        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
-      </div>
-    );
-  }
-  if (!isPaidUser) {
-    // Only redirect if not coming back from payment success (let payment page handle UI)
-    const params = new URLSearchParams(location.search);
-    if (params.get("payment") !== "success") {
-      window.location.href = "/payment";
-    }
-    return null;
-  }
-  return <>{children}</>;
+  const { isPaidUser, loading, refreshPaidStatus } = usePaidStatus();
+  const [checking, setChecking] = React.useState(false);
+  const location = useLocation();
+  // Immediately checks paid status after payment
+  React.useEffect(() => {
+    const params = new URLSearchParams(location.search);
+    if (params.get("payment") === "success") {
+      setChecking(true);
+      refreshPaidStatus().then(() => setChecking(false)).catch(() => setChecking(false));
+    }
+  }, [location.search, refreshPaidStatus]);
+  if (loading || checking) {
+    return (
+      <div className="min-h-screen flex items-center justify-center">
+        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
+      </div>
+    );
+  }
+  if (!isPaidUser) {
+    const params = new URLSearchParams(location.search);
+    if (params.get("payment") !== "success") {
+      window.location.href = "/payment";
+    }
+    return null;
+  }
+  return <>{children}</>;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
+         <PaidStatusProvider>
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
+         </PaidStatusProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);
export default App;
