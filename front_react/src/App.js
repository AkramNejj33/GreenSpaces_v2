import { useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Topbar from "./scenes/global/Topbar";
import Sidebar from "./scenes/global/Sidebar";
import Dashboard from "./scenes/dashboard";
import Team from "./scenes/team";
import Invoices from "./scenes/invoices";
import Contacts from "./scenes/contacts";
import Bar from "./scenes/bar";
import Form from "./scenes/form";
import Line from "./scenes/line";
import Pie from "./scenes/pie";
import Geography from "./scenes/geography";
import Register from "./scenes/register";
import Login from "./scenes/login";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "./theme";
import Calendar from "./scenes/calendar";
import { AuthProvider } from "./AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import ForgotPassword from "./scenes/forgot-password";
import ResetPassword from "./scenes/reset-password";
import ChangePassword from "./scenes/change-password";
import Chatbot from "./components/Chatbot";



function App() {
  const [theme, colorMode] = useMode();
  const [isSidebar, setIsSidebar] = useState(true);
  const location = useLocation();

  // Pages qui ne doivent pas afficher sidebar/topbar
  const authPages = ['/login', '/register', '/forgot-password', '/reset-password'];
  const isAuthPage = authPages.includes(location.pathname);

  return (
    <AuthProvider>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <div className="app">
            {/* Afficher sidebar seulement si ce n'est pas une page d'auth */}
            {!isAuthPage && <Sidebar isSidebar={isSidebar} />}
            
            <main className={isAuthPage ? "auth-content" : "content"}>
              {/* Afficher topbar seulement si ce n'est pas une page d'auth */}
              {!isAuthPage && <Topbar setIsSidebar={setIsSidebar} />}
              
              <Routes>
                {/* Routes publiques (sans authentification) */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                
                {/* Routes protégées (avec authentification) */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/team" element={
                  <ProtectedRoute>
                    <Team />
                  </ProtectedRoute>
                } />
                
                <Route path="/contacts" element={
                  <ProtectedRoute>
                    <Contacts />
                  </ProtectedRoute>
                } />
                
                <Route path="/invoices" element={
                  <ProtectedRoute>
                    <Invoices />
                  </ProtectedRoute>
                } />
                
                <Route path="/form" element={
                  <ProtectedRoute>
                    <Form />
                  </ProtectedRoute>
                } />
                
                <Route path="/bar" element={
                  <ProtectedRoute>
                    <Bar />
                  </ProtectedRoute>
                } />
                
                <Route path="/pie" element={
                  <ProtectedRoute>
                    <Pie />
                  </ProtectedRoute>
                } />
                
                <Route path="/line" element={
                  <ProtectedRoute>
                    <Line />
                  </ProtectedRoute>
                } />
                
                <Route path="/calendar" element={
                  <ProtectedRoute>
                    <Calendar />
                  </ProtectedRoute>
                } />
                
                <Route path="/geography" element={
                  <ProtectedRoute>
                    <Geography />
                  </ProtectedRoute>
                } />
                
                <Route path="/change-password" element={
                  <ProtectedRoute>
                    <ChangePassword />
                  </ProtectedRoute>
                } />
                
                {/* Route par défaut - rediriger vers login si pas authentifié */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </main>
            {!isAuthPage && <Chatbot />}
          </div>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </AuthProvider>
  );
}

export default App;