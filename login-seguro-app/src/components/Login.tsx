import React, { useState, useEffect } from 'react';
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
  Text,
  Code,
  Progress,
} from '@chakra-ui/react';
import { supabase } from '../lib/supabaseClient';

const LOCK_TIME = 15 * 60; // 15 minutos en segundos
const MAX_ATTEMPTS = 3;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(() => {
    const savedAttempts = localStorage.getItem('loginAttempts');
    return savedAttempts ? parseInt(savedAttempts) : 0;
  });
  const [timeRemaining, setTimeRemaining] = useState(() => {
    const lockUntil = localStorage.getItem('lockUntil');
    if (lockUntil) {
      const remaining = Math.max(0, parseInt(lockUntil) - Date.now());
      return Math.floor(remaining / 1000);
    }
    return 0;
  });
  
  const navigate = useNavigate();
  const toast = useToast();

  const TEST_CREDENTIALS = {
    email: 'test@test.com',
    password: 'Test123!'
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            setAttempts(0);
            localStorage.removeItem('loginAttempts');
            localStorage.removeItem('lockUntil');
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timeRemaining]);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/profile');
      }
    };
    checkSession();
  }, [navigate]);

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

  const handleLockout = () => {
    const lockUntil = Date.now() + (LOCK_TIME * 1000);
    localStorage.setItem('lockUntil', lockUntil.toString());
    setTimeRemaining(LOCK_TIME);
    toast({
      title: 'Cuenta bloqueada',
      description: `Demasiados intentos fallidos. Por favor espere 15 minutos.`,
      status: 'error',
      duration: 5000,
      isClosable: false,
    });
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
      // Verificar y cerrar sesiones existentes
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      
      if (existingSession) {
        await supabase.auth.signOut({ scope: 'global' });
        toast({
          title: 'Sesión previa detectada',
          description: 'Se ha cerrado la sesión en todos los dispositivos por seguridad',
          status: 'warning',
          duration: 3000,
        });
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        setAttempts(0);
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('lockUntil');
        
        // Almacenar el token de la sesión actual
        localStorage.setItem('currentSessionToken', data.session?.access_token || '');
        
        toast({
          title: 'Inicio de sesión exitoso',
          status: 'success',
          duration: 2000,
        });
        
        navigate('/profile');
      }
    } catch (error: any) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      localStorage.setItem('loginAttempts', newAttempts.toString());
      
      if (newAttempts >= MAX_ATTEMPTS) {
        handleLockout();
      } else {
        toast({
          title: 'Error de autenticación',
          description: `Credenciales inválidas. Intentos restantes: ${MAX_ATTEMPTS - newAttempts}`,
          status: 'error',
          duration: 3000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const useTestCredentials = () => {
    setEmail(TEST_CREDENTIALS.email);
    setPassword(TEST_CREDENTIALS.password);
  };

  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Container maxW="container.sm" py={10}>
      <VStack spacing={8}>
        <Heading>Login Seguro</Heading>
        
        {timeRemaining > 0 && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>Cuenta bloqueada</AlertTitle>
              <AlertDescription>
                <Text mb={2}>
                  Por favor espere {formatTimeRemaining(timeRemaining)} minutos
                </Text>
                <Progress 
                  value={(timeRemaining / LOCK_TIME) * 100} 
                  size="sm" 
                  colorScheme="red" 
                  borderRadius="md"
                />
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
                  placeholder={TEST_CREDENTIALS.email}
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
                  placeholder={TEST_CREDENTIALS.password}
                />
              </FormControl>

              {attempts > 0 && attempts < MAX_ATTEMPTS && (
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  <Box flex="1">
                    <AlertTitle>Advertencia</AlertTitle>
                    <AlertDescription>
                      Intentos fallidos: {attempts}/{MAX_ATTEMPTS}
                      <Progress 
                        value={(attempts / MAX_ATTEMPTS) * 100} 
                        size="xs" 
                        colorScheme="orange" 
                        mt={2} 
                      />
                    </AlertDescription>
                  </Box>
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

              <Box 
                p={4} 
                bg="gray.50" 
                borderRadius="md" 
                w="full"
              >
                <Text fontSize="sm" color="gray.600" mb={2}>
                  Credenciales de prueba:
                </Text>
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm">
                    <strong>Email:</strong> <Code>{TEST_CREDENTIALS.email}</Code>
                  </Text>
                  <Text fontSize="sm">
                    <strong>Contraseña:</strong> <Code>{TEST_CREDENTIALS.password}</Code>
                  </Text>
                </VStack>
                <Button
                  size="sm"
                  variant="outline"
                  mt={2}
                  onClick={useTestCredentials}
                  isDisabled={timeRemaining > 0}
                >
                  Usar credenciales de prueba
                </Button>
              </Box>
            </VStack>
          </form>
        </Box>
      </VStack>
    </Container>
  );
}