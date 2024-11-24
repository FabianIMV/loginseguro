import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthChangeEvent } from '@supabase/supabase-js';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Alert,
  AlertIcon,
  useToast,
  Table,
  Tbody,
  Tr,
  Td,
  Badge,
  Code
} from '@chakra-ui/react';
import { supabase } from '../lib/supabaseClient';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const navigate = useNavigate();
  const toast = useToast();

  // Función para verificar sesión única
  const verifyUniqueSession = async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) return;
      
      // Verificar si hay otras sesiones activas para este usuario
      const { data: sessions, error } = await supabase
        .from('auth.sessions')
        .select('*')
        .eq('user_id', currentSession.user.id);
        
      if (error) throw error;
      
      if (sessions && sessions.length > 1) {
        // Si hay más de una sesión, cerrar todas y forzar nuevo login
        await supabase.auth.signOut({ scope: 'global' });
        toast({
          title: 'Sesión múltiple detectada',
          description: 'Se han detectado múltiples sesiones activas. Por seguridad, se han cerrado todas las sesiones.',
          status: 'error',
          duration: 5000,
          isClosable: false,
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Error verificando sesión única:', error);
    }
  };

  useEffect(() => {
    checkUser();
    // Suscribirse a cambios en la sesión
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session) => {
        console.log('Auth event:', event);
        switch (event) {
          case 'SIGNED_OUT':
            navigate('/');
            break;
          case 'TOKEN_REFRESHED':
            console.log('Token refreshed');
            break;
          default:
            if (!session) {
              navigate('/');
            } else {
              setUser(session.user);
              setSessionInfo(session);
            }
        }
    });

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [navigate]);

  // Verificación periódica de sesión única
  useEffect(() => {
    const interval = setInterval(async () => {
      await verifyUniqueSession();
    }, 3000); // Verificar cada 3 segundos
    
    return () => clearInterval(interval);
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (!session) {
        navigate('/');
        return;
      }

      setUser(session.user);
      setSessionInfo(session);

      // Verificar la validez del token
      const tokenExpiry = new Date((session.expires_at || 0) * 1000);
      const now = new Date();
      if (tokenExpiry <= now) {
        throw new Error('Sesión expirada');
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: 'Error de sesión',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Limpiar el storage local
      localStorage.clear();
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Error al cerrar sesión',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'medium'
    }).format(date);
  };

  if (loading) {
    return (
      <Container maxW="container.sm" py={10}>
        <Text>Verificando sesión...</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.sm" py={10}>
      <VStack spacing={8}>
        <Heading>Perfil de Usuario</Heading>
        
        <Alert status="success" borderRadius="md">
          <AlertIcon />
          Sesión activa y segura
        </Alert>

        <Box w="100%" bg="white" p={8} borderRadius="lg" boxShadow="lg">
          <VStack spacing={4} align="stretch">
            <Heading size="md" mb={4}>Información de la Sesión</Heading>
            
            <Table variant="simple">
              <Tbody>
                <Tr>
                  <Td fontWeight="bold">Email:</Td>
                  <Td>{user?.email}</Td>
                </Tr>
                <Tr>
                  <Td fontWeight="bold">ID de Usuario:</Td>
                  <Td><Code>{user?.id}</Code></Td>
                </Tr>
                <Tr>
                  <Td fontWeight="bold">Último acceso:</Td>
                  <Td>{formatDate(new Date(user?.last_sign_in_at))}</Td>
                </Tr>
                <Tr>
                  <Td fontWeight="bold">Expira en:</Td>
                  <Td>
                    <Badge colorScheme="green">
                      {formatDate(new Date(sessionInfo?.expires_at * 1000))}
                    </Badge>
                  </Td>
                </Tr>
              </Tbody>
            </Table>

            <Button
              colorScheme="red"
              onClick={handleSignOut}
              mt={4}
            >
              Cerrar Sesión
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}