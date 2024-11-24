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
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';

// Credenciales de prueba (en un caso real, esto estaría en el backend)
const TEST_CREDENTIALS = {
  email: 'test@test.com',
  password: 'Test123!' 
};

const LOCK_TIME = 15 * 60; // 15 minutos en segundos

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const toast = useToast();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

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
        description: `Por favor espere ${formatTime(timeRemaining)} antes de intentar nuevamente.`,
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
      // Simulamos una pequeña demora para la verificación
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (email === TEST_CREDENTIALS.email && password === TEST_CREDENTIALS.password) {
        toast({
          title: 'Éxito',
          description: 'Inicio de sesión exitoso',
          status: 'success',
          duration: 3000,
        });
        setAttempts(0);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          setTimeRemaining(LOCK_TIME);
          setLockoutTime(Date.now());
          toast({
            title: 'Cuenta bloqueada',
            description: 'Demasiados intentos fallidos. La cuenta ha sido bloqueada por 15 minutos.',
            status: 'error',
            duration: 5000,
            isClosable: false,
          });
        } else {
          toast({
            title: 'Error',
            description: `Credenciales inválidas. Intentos restantes: ${3 - newAttempts}`,
            status: 'error',
            duration: 3000,
          });
        }
      }
    } catch (error: any) {
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
                Demasiados intentos fallidos. Por favor espere {formatTime(timeRemaining)} para intentar nuevamente.
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
                  placeholder="test@test.com"
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
                  placeholder="Test123!"
                  isDisabled={timeRemaining > 0}
                />
              </FormControl>

              {attempts > 0 && attempts < 3 && (
                <Alert status="warning" borderRadius="md">
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

              <Text fontSize="sm" color="gray.600">
                Credenciales de prueba:
                <br />
                Email: test@test.com
                <br />
                Contraseña: Test123!
              </Text>
            </VStack>
          </form>
        </Box>
      </VStack>
    </Container>
  );
}