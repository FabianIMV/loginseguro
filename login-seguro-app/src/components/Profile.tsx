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
  Code,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@chakra-ui/react';
import { supabase } from '../lib/supabaseClient';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [showSessionEndedModal, setShowSessionEndedModal] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  // Verificación periódica de la validez de la sesión
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!currentSession) {
          // Si no hay sesión, redirigir al login
          handleSessionEnd();
          return;
        }

        // Verificar si el token almacenado coincide con el token actual
        const storedToken = localStorage.getItem('currentSessionToken');
        if (storedToken && storedToken !== currentSession.access_token) {
          // Si los tokens no coinciden, significa que se inició sesión en otro dispositivo
          setShowSessionEndedModal(true);
          await handleSessionEnd();
        }
      } catch (error) {
        console.error('Error verificando sesión:', error);
      }
    }, 3000); // Verificar cada 3 segundos

    return () => clearInterval(interval);
  }, []);

  const handleSessionEnd = async () => {
    try {
      // Limpiar el token almacenado
      localStorage.removeItem('currentSessionToken');
      
      // Cerrar la sesión en Supabase
      await supabase.auth.signOut();
      
      // Mostrar modal
      setShowSessionEndedModal(true);
      
      // Después de 5 segundos, redirigir al login
      setTimeout(() => {
        navigate('/');
      }, 5000);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
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
            if (session) {
              localStorage.setItem('currentSessionToken', session.access_token);
            }
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
    <>
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

      {/* Modal para mostrar cuando la sesión es terminada por un nuevo inicio de sesión */}
      <Modal isOpen={showSessionEndedModal} onClose={() => {}} closeOnOverlayClick={false}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Sesión Finalizada</ModalHeader>
          <ModalBody>
            <Alert status="warning" mb={4}>
              <AlertIcon />
              <Text>
                Se ha iniciado sesión en otro dispositivo. Por seguridad, esta sesión ha sido cerrada.
              </Text>
            </Alert>
            <Text>Serás redirigido a la página de inicio de sesión en 5 segundos...</Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={() => navigate('/')}>
              Ir al login ahora
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}