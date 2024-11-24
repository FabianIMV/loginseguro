import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const toast = useToast();

  const validateInput = (input: string) => {
    const dangerousPatterns = [
      /SELECT.*FROM/i,
      /INSERT.*INTO/i,
      /UPDATE.*SET/i,
      /DELETE.*FROM/i,
      /<script>/i,
      /'/,
      /;/,
      /--/
    ];
    return !dangerousPatterns.some(pattern => pattern.test(input));
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

    if (!validateInput(email) || !validateInput(password)) {
      toast({
        title: 'Error de Seguridad',
        description: 'Entrada inválida detectada - Se ha registrado el intento',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: 'Inicio de sesión exitoso',
          status: 'success',
          duration: 2000,
        });
        // Redirigir al perfil después de un inicio de sesión exitoso
        navigate('/profile');
      }
    } catch (error: any) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        const lockoutMinutes = 15;
        setTimeRemaining(lockoutMinutes * 60);
        const lockoutInterval = setInterval(() => {
          setTimeRemaining(prev => {
            if (prev <= 1) {
              clearInterval(lockoutInterval);
              setAttempts(0);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }

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
                  bg="gray.50"
                  isDisabled={timeRemaining > 0}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Contraseña</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  bg="gray.50"
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