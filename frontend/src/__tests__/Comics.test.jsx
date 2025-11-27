import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Comics from '../pages/admin/Comics';
import * as api from '../services/api';

jest.mock('../services/api');

describe('Comics Admin Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('loads comics and opens modal for creating new comic', async () => {
    api.comicsAPI.getAllComics.mockResolvedValue({
      data: [],
      pagination: { totalPages: 1 },
    });
    render(<Comics />);
    await waitFor(() => expect(api.comicsAPI.getAllComics).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: /nuevo comic/i }));
    expect(screen.getByText(/nuevo comic/i)).toBeInTheDocument();
  });

  test('validates and submits comic edit form', async () => {
    const comic = {
      id: 1,
      titulo: 'Test Comic',
      numero_edicion: '1',
      editorial_id: 1,
      precio: 9.99,
      genero: 'Superhéroes',
      estado: 'Disponible',
      subgenero: '',
      imagen_url: '',
      descripcion: '',
    };
    api.comicsAPI.getAllComics.mockResolvedValue({
      data: [comic],
      pagination: { totalPages: 1 },
    });
    api.comicsAPI.updateComic.mockResolvedValue({ message: 'Comic actualizado exitosamente' });

    render(<Comics />);
    await waitFor(() => expect(api.comicsAPI.getAllComics).toHaveBeenCalled());

    // Open modal to edit comic
    const editButtons = screen.getAllByTitle(/editar/i);
    fireEvent.click(editButtons[0]);

    // Change title to empty to test required validation
    const titleInput = screen.getByLabelText(/título \*/i);
    fireEvent.change(titleInput, { target: { value: '' } });

    const submitButton = screen.getByRole('button', { name: /actualizar/i });
    fireEvent.click(submitButton);

    // The form submission will fail validation due to required field
    await waitFor(() => {
      expect(screen.getByText(/error al guardar el comic/i)).toBeInTheDocument();
    });
  });
});
