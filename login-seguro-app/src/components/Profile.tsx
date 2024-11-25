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

  // Verificación constante de sesión
  useEffect(() => {
    let isComponentMounted = true;

    // En el useEffect de verificación de sesión
    const checkSessionValidity = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !isComponentMounted) return;

        // Verificar si nuestra sesión sigue siendo la activa
        const { data: activeSession } = await supabase
          .from('user_session_tracking')
          .select('*')
          .eq('email', session.user.email)
          .eq('is_active', true)
          .single();

        // Si no hay sesión activa o el ID de sesión no coincide, cerrar
        if (!activeSession || activeSession.session_id !== session.access_token) {
          console.log('Sesión no válida o reemplazada');
          setShowSessionEndedModal(true);
          await handleSessionEnd();
          return;
        }

        // Actualizar el timestamp de la sesión activa
        await supabase
          .from('user_session_tracking')
          .update({ last_session_at: new Date().toISOString() })
          .eq('session_id', session.access_token);

      } catch (error) {
        console.error('Error checking session:', error);
      }
    };

    // Modificar el handleSessionEnd
    const handleSessionEnd = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Marcar nuestra sesión como inactiva
          await supabase
            .from('user_session_tracking')
            .update({ is_active: false })
            .eq('session_id', session.access_token);

          // Cerrar la sesión
          await supabase.auth.signOut();
        }

        navigate('/');
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        navigate('/');
      }
    };

    // Verificar inmediatamente y luego cada segundo
    checkSessionValidity();
    const interval = setInterval(checkSessionValidity, 1000);

    // Suscribirse a cambios en la tabla de tracking
    const subscription = supabase
      .channel('session_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'user_session_tracking' },
        async (payload) => {
          console.log('Cambio detectado en sesiones:', payload);
          await checkSessionValidity();
        })
      .subscribe();

    return () => {
      isComponentMounted = false;
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, []);

  // Auth state listener
  useEffect(() => {
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/');
      } else {
        setUser(session.user);
        setSessionInfo(session);
      }
    });

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [navigate]);

  const handleSessionEnd = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const checkUser = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        navigate('/');
        return;
      }

      setUser(session.user);
      setSessionInfo(session);

      const tokenExpiry = new Date((session.expires_at || 0) * 1000);
      if (tokenExpiry <= new Date()) {
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
      await supabase.auth.signOut();
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

      <Modal isOpen={showSessionEndedModal} onClose={() => { }} closeOnOverlayClick={false}>
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
            <Text>Redirigiendo a la página de inicio de sesión...</Text>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}