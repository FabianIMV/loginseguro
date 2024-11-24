import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import Login from '../components/Login';
import '@testing-library/jest-dom';

describe('Login Security Tests', () => {
  // Test de Fuerza Bruta
  test('should block after 3 failed attempts', async () => {
    render(<Login />);
    
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /ingresar/i });

    // Primer intento
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong1' } });
    fireEvent.click(submitButton);

    // Segundo intento
    fireEvent.change(passwordInput, { target: { value: 'wrong2' } });
    fireEvent.click(submitButton);

    // Tercer intento
    fireEvent.change(passwordInput, { target: { value: 'wrong3' } });
    fireEvent.click(submitButton);

    // Verificar que aparece el mensaje de bloqueo
    await waitFor(() => {
      expect(screen.getByText(/demasiados intentos fallidos/i)).toBeInTheDocument();
    });

    // Verificar que el botón está deshabilitado
    expect(submitButton).toBeDisabled();
  });

  // Test de SQL Injection
  test('should prevent SQL injection attempts', async () => {
    render(<Login />);
    
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /ingresar/i });

    // Intentar SQL Injection
    fireEvent.change(emailInput, { 
      target: { value: "' OR '1'='1" } 
    });
    fireEvent.change(passwordInput, { 
      target: { value: "' OR '1'='1" } 
    });
    fireEvent.click(submitButton);

    // Verificar que aparece mensaje de error
    await waitFor(() => {
      expect(screen.getByText(/entrada inválida detectada/i)).toBeInTheDocument();
    });
  });

  // Test de Encriptación de Contraseña
  test('password should not be visible in form data', () => {
    render(<Login />);
    
    const passwordInput = screen.getByLabelText(/contraseña/i);
    
    // Verificar que el tipo de input es "password"
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Verificar que no hay contraseñas visibles en el DOM
    const pageContent = document.body.textContent;
    expect(pageContent).not.toContain('myPassword123');
  });
});