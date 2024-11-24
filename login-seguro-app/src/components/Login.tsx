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
    ];
    return !dangerousPatterns.some(pattern => pattern.test(input));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInput(email) || !validateInput(password)) {
      toast({
        title: 'Error',
        description: 'Entrada inválida detectada',
        status: 'error',
        duration: 3000,
      });
      return;
    }

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
      // Aquí iría la lógica de autenticación
      // Por ahora simularemos un error
      setAttempts(prev => prev + 1);
      throw new Error('Credenciales inválidas');
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
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Contraseña</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  bg="gray.50"
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
            </VStack>
          </form>
        </Box>
      </VStack>
    </Container>
  );
}