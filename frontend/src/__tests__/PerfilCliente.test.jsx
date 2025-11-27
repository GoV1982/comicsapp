import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PerfilCliente from '../pages/PerfilCliente';
import * as api from '../services/api';

jest.mock('../services/api');

describe('PerfilCliente Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the profile form and submits successfully', async () => {
    api.perfilAPI.getPerfil.mockResolvedValue({
      success: true,
      data: {
        nombre: 'Test User',
        email: 'test@example.com',
        telefono: '123456789',
        whatsapp: '987654321',
        direccion: '123 Test St',
        notas: 'Some notes',
      },
    });

    api.perfilAPI.updatePerfil.mockResolvedValue({
      success: true,
      message: 'Perfil actualizado correctamente',
    });

    render(<PerfilCliente />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    });

    const nombreInput = screen.getByLabelText(/nombre completo/i);
    fireEvent.change(nombreInput, { target: { value: 'Updated User' } });

    const submitButton = screen.getByRole('button', { name: /guardar cambios/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.perfilAPI.updatePerfil).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: 'Updated User' })
      );
      expect(screen.getByText('Perfil actualizado correctamente')).toBeInTheDocument();
    });
  });

  test('shows validation error when confirm password does not match', async () => {
    render(<PerfilCliente />);

    const newPassword = screen.getByLabelText('Nueva contraseña *');
    const confirmPassword = screen.getByLabelText('Confirmar nueva contraseña *');
    const submitButton = screen.getByRole('button', { name: /cambiar contraseña/i });

    fireEvent.change(newPassword, { target: { value: 'password1' } });
    fireEvent.change(confirmPassword, { target: { value: 'different' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
    });
  });
});
