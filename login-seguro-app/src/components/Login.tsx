import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { supabase } from '../lib/supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const toast = useToast();

  // Verificar estado de bloqueo al cargar
  useEffect(() => {
    checkLockoutStatus();
  }, []);

  const checkLockoutStatus = async () => {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('lockout_until, failed_attempts')
        .eq('email', email)
        .single();

      if (user?.lockout_until) {
        const lockoutTime = new Date(user.lockout_until);
        const now = new Date();
        if (lockoutTime > now) {
          setTimeRemaining(Math.floor((lockoutTime.getTime() - now.getTime()) / 1000));
          setAttempts(3); // Max attempts
        }
      }
    } catch (error) {
      console.error('Error checking lockout status:', error);
    }
  };

  const handleFailedAttempt = async () => {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('failed_attempts')
        .eq('email', email)
        .single();

      const newAttempts = (user?.failed_attempts || 0) + 1;

      if (newAttempts >= 3) {
        // Bloquear por 15 minutos
        const lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
        await supabase
          .from('users')
          .update({
            failed_attempts: newAttempts,
            lockout_until: lockoutUntil.toISOString()
          })
          .eq('email', email);

        setTimeRemaining(15 * 60);
      } else {
        await supabase
          .from('users')
          .update({ failed_attempts: newAttempts })
          .eq('email', email);
      }

      setAttempts(newAttempts);
    } catch (error) {
      console.error('Error updating failed attempts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (timeRemaining > 0) {
      toast({
        title: 'Cuenta bloqueada',
        description: `Por favor espere ${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')} minutos`,
        status: 'error',
        duration: 5000,
      });
      return;
    }

    setIsLoading(true);
    try {
      // Intentar login con Supabase
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (user) {
        // Reset failed attempts on successful login
        await supabase
          .from('users')
          .update({
            failed_attempts: 0,
            lockout_until: null
          })
          .eq('email', email);

        toast({
          title: 'Éxito',
          description: 'Inicio de sesión exitoso',
          status: 'success',
          duration: 3000,
        });
        
        // Reset local state
        setAttempts(0);
        setTimeRemaining(0);
      }
    } catch (error: any) {
      console.error('Error:', error);
      await handleFailedAttempt();
      
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.sm" py={10}>
      <VStack spacing={8}>
        <Heading>Login Seguro</Heading>
        
        {timeRemaining > 0 && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Cuenta bloqueada</AlertTitle>
              <AlertDescription>
                Por favor espere {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')} minutos
              </AlertDescription>
            </Box>
          </Alert>
        )}

        <Box w="100%" bg="white" p={8} borderRadius="lg" boxShadow="lg">
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  isDisabled={timeRemaining > 0}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Contraseña</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  isDisabled={timeRemaining > 0}
                />
              </FormControl>

              {attempts > 0 && attempts < 3 && (
                <Alert status="warning">
                  <AlertIcon />
                  <AlertDescription>
                    Intentos fallidos: {attempts}/3
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                colorScheme="blue"
                width="full"
                isLoading={isLoading}
                isDisabled={timeRemaining > 0}
              >
                Ingresar
              </Button>
            </VStack>
          </form>
        </Box>
      </VStack>
    </Container>
  );
}