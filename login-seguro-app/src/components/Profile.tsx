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
  const [currentSessionTime] = useState(new Date().toISOString()); // Guardamos el tiempo de inicio de esta sesión
  const navigate = useNavigate();
  const toast = useToast();

  // Verificación periódica de sesión
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        // Si no hay sesión, cerrar la sesión actual
        if (!currentSession) {
          setShowSessionEndedModal(true);
          await handleSessionEnd();
          return;
        }

        // Obtener la fecha de la última sesión válida para este usuario
        const { data, error } = await supabase
          .from('user_session_tracking')
          .select('last_session_at')
          .eq('user_id', currentSession.user.id)
          .single();

        if (error) {
          console.error('Error al verificar sesión:', error);
          return;
        }

        // Si hay una sesión más reciente que la actual, cerrar esta
        if (data?.last_session_at && new Date(data.last_session_at) > new Date(currentSessionTime)) {
          setShowSessionEndedModal(true);
          await handleSessionEnd();
        } else {
          // Actualizar el timestamp de la última sesión
          await supabase
            .from('user_session_tracking')
            .upsert({
              user_id: currentSession.user.id,
              last_session_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id'
            });
        }

      } catch (error) {
        console.error('Error verificando sesión:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentSessionTime]); // Agregamos currentSessionTime como dependencia

  const handleSessionEnd = async () => {
    try {
      await supabase.auth.signOut();
      setTimeout(() => {
        navigate('/');
      }, 5000);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  useEffect(() => {
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session) => {
        console.log('Auth event:', event);
        switch (event) {
          case 'SIGNED_OUT':
            navigate('/');
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

      // Actualizar el registro de la sesión al cargar el perfil
      await supabase
        .from('user_session_tracking')
        .upsert({
          user_id: session.user.id,
          last_session_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

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
                Se ha iniciado sesión en otro dispositivo. Esta sesión ha sido cerrada.
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