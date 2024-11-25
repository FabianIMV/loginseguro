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
} from '@chakra-ui/react';
import { supabase } from '../lib/supabaseClient';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [showSessionEndedModal, setShowSessionEndedModal] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const forceLogout = async () => {
    try {
      // Desactivar la sesión actual en la base de datos
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase
          .from('user_session_tracking')
          .update({ is_active: false })
          .eq('session_id', session.access_token);
      }

      // Forzar cierre de sesión
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      
      // Mostrar modal y redirigir
      setShowSessionEndedModal(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      console.error('Error en forceLogout:', error);
      window.location.href = '/';
    }
  };

  useEffect(() => {
    let mounted = true;
    let checkInterval: NodeJS.Timeout;

    const checkSession = async () => {
      if (!mounted) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          await forceLogout();
          return;
        }

        const { data: activeSession } = await supabase
          .from('user_session_tracking')
          .select('*')
          .eq('email', session.user.email)
          .eq('is_active', true)
          .single();

        if (!activeSession || activeSession.session_id !== session.access_token) {
          clearInterval(checkInterval);
          await forceLogout();
          return;
        }
      } catch (error) {
        console.error('Error en checkSession:', error);
        await forceLogout();
      }
    };

    // Iniciar verificación
    checkSession();
    checkInterval = setInterval(checkSession, 1000);

    return () => {
      mounted = false;
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
          await forceLogout();
          return;
        }

        setUser(session.user);
        setSessionInfo(session);
        setLoading(false);
      } catch (error) {
        console.error('Error en checkUser:', error);
        await forceLogout();
      }
    };

    checkUser();
  }, []);

  const handleSignOut = async () => {
    await forceLogout();
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

      <Modal 
        isOpen={showSessionEndedModal} 
        onClose={() => {}}
        closeOnOverlayClick={false}
        closeOnEsc={false}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Sesión Finalizada</ModalHeader>
          <ModalBody pb={6}>
            <Alert status="warning" mb={4}>
              <AlertIcon />
              <Text>
                Se ha iniciado sesión en otro dispositivo.
                Esta sesión ha sido cerrada.
              </Text>
            </Alert>
            <Text>Redirigiendo a la página de inicio de sesión...</Text>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}