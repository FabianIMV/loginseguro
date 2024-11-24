import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@chakra-ui/react';
import { supabase } from '../lib/supabaseClient';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    checkUser();
    // Escuchar cambios en la sesión
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/');
      } else if (!session) {
        navigate('/');
      } else {
        setUser(session.user);
      }
    });

    return () => {
      // Limpiar el listener cuando el componente se desmonte
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [navigate]);

  const checkUser = async () => {
    try {
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();
      if (error) {
        throw error;
      }
      if (!currentUser) {
        navigate('/');
        return;
      }
      setUser(currentUser);
    } catch (error: any) {
      toast({
        title: 'Error',
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

  if (loading) {
    return (
      <Container maxW="container.sm" py={10}>
        <Text>Cargando...</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.sm" py={10}>
      <VStack spacing={8}>
        <Heading>Perfil de Usuario</Heading>
        <Box w="100%" bg="white" p={8} borderRadius="lg" boxShadow="lg">
          <VStack spacing={4} align="stretch">
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              Sesión activa y segura
            </Alert>
            
            <Text>
              <strong>Email:</strong> {user?.email}
            </Text>
            <Text>
              <strong>ID:</strong> {user?.id}
            </Text>
            <Text>
              <strong>Último inicio de sesión:</strong>{' '}
              {new Date(user?.last_sign_in_at).toLocaleString()}
            </Text>

            <Button
              colorScheme="red"
              onClick={handleSignOut}
            >
              Cerrar Sesión
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}