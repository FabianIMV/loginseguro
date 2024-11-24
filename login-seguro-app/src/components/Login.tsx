import React, { useState } from 'react';
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
} from '@chakra-ui/react';

// Credenciales de prueba (en un caso real, esto estaría en el backend)
const TEST_CREDENTIALS = {
  email: 'test@test.com',
  password: 'Test123!' // Contraseña segura de prueba
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const toast = useToast();

  const validateInput = (input: string) => {
    // Prevenir SQL Injection
    const dangerousPatterns = [
      /SELECT.*FROM/i,
      /INSERT.*INTO/i,
      /UPDATE.*SET/i,
      /DELETE.*FROM/i,
      /<script>/i,
      /'/,  // Prevenir comillas simples
      /;/,  // Prevenir punto y coma
      /--/  // Prevenir comentarios SQL
    ];
    return !dangerousPatterns.some(pattern => pattern.test(input));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar entrada para prevenir SQL Injection
    if (!validateInput(email) || !validateInput(password)) {
      toast({
        title: 'Error',
        description: 'Entrada inválida detectada',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    // Verificar intentos fallidos
    if (attempts >= 3) {
      toast({
        title: 'Error',
        description: 'Demasiados intentos fallidos. Por favor, espere 15 minutos.',
        status: 'error',
        duration: 5000,
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simular validación de credenciales
      if (email === TEST_CREDENTIALS.email && password === TEST_CREDENTIALS.password) {
        toast({
          title: 'Éxito',
          description: 'Inicio de sesión exitoso',
          status: 'success',
          duration: 3000,
        });
        // Aquí podrías redirigir al usuario o actualizar el estado
      } else {
        setAttempts(prev => prev + 1);
        throw new Error('Credenciales inválidas');
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
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                width="full"
                isLoading={isLoading}
                isDisabled={attempts >= 3}
              >
                Ingresar
              </Button>

              {attempts > 0 && (
                <Text color="red.500" fontSize="sm">
                  Intentos fallidos: {attempts}/3
                </Text>
              )}

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