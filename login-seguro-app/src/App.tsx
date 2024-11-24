import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Profile from './components/Profile';
import { supabase } from './lib/supabaseClient';
import { Spinner, Center } from '@chakra-ui/react';

// Componente para rutas protegidas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    } catch (error) {
      console.error('Error checking session:', error);
      setIsAuthenticated(false);
    }
  };

  // Mientras verifica la autenticación
  if (isAuthenticated === null) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ChakraProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          {/* Ruta de fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ChakraProvider>
  );
}

export default App;