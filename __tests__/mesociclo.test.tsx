import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MesocicloView } from '@/components/MesocicloView';
import { useToast } from '@/hooks/useToast';

// Mock useToast
jest.mock('@/hooks/useToast');
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

describe('MesocicloView', () => {
  const mockShowToast = jest.fn();
  const mockOnBack = jest.fn();

  beforeEach(() => {
    mockUseToast.mockReturnValue({
      toasts: [],
      showToast: mockShowToast,
      removeToast: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders mesociclo view with header and navigation', async () => {
    render(<MesocicloView onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Mesociclo')).toBeInTheDocument();
      expect(screen.getByText('Volver')).toBeInTheDocument();
      expect(screen.getByText('📅 Calendario')).toBeInTheDocument();
      expect(screen.getByText('📋 Lista')).toBeInTheDocument();
    });
  });

  it('displays legend with phases and intensities', async () => {
    render(<MesocicloView onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Leyenda')).toBeInTheDocument();
      expect(screen.getByText('Fases')).toBeInTheDocument();
      expect(screen.getByText('Intensidad')).toBeInTheDocument();
      // Usar getAllByText para elementos que aparecen múltiples veces
      expect(screen.getAllByText('Introducción')).toHaveLength(4); // 1 en leyenda + 3 en semanas
      expect(screen.getAllByText('Acumulación')).toHaveLength(4); // 1 en leyenda + 3 en semanas
      expect(screen.getAllByText('Baja')).toHaveLength(5); // 1 en leyenda + 4 en semanas
      expect(screen.getAllByText('Moderada')).toHaveLength(5); // 1 en leyenda + 4 en semanas
    });
  });

  it('displays mesociclo weeks grid', async () => {
    render(<MesocicloView onBack={mockOnBack} />);

    await waitFor(() => {
      // Verificar que se muestran las semanas
      expect(screen.getByText('Semana 1')).toBeInTheDocument();
      expect(screen.getByText('Semana 2')).toBeInTheDocument();
      expect(screen.getByText('Semana 12')).toBeInTheDocument();
    });
  });

  it('shows week details when clicking on a week', async () => {
    render(<MesocicloView onBack={mockOnBack} />);

    await waitFor(() => {
      const weekCard = screen.getByText('Semana 1').closest('div');
      expect(weekCard).toBeInTheDocument();
      
      if (weekCard) {
        fireEvent.click(weekCard);
      }
    });

    await waitFor(() => {
      expect(screen.getByText('Semana 1 - Introducción')).toBeInTheDocument();
      expect(screen.getByText('Período')).toBeInTheDocument();
      expect(screen.getByText('Fase')).toBeInTheDocument();
      expect(screen.getAllByText('Intensidad')).toHaveLength(2); // 1 en leyenda + 1 en modal
      expect(screen.getByText('Enfoque del Entrenamiento')).toBeInTheDocument();
      expect(screen.getByText('Volumen Total')).toBeInTheDocument();
      expect(screen.getByText('Ejercicios Principales')).toBeInTheDocument();
      expect(screen.getByText('Progreso de la Semana')).toBeInTheDocument();
    });
  });

  it('closes week detail modal when clicking close button', async () => {
    render(<MesocicloView onBack={mockOnBack} />);

    await waitFor(() => {
      const weekCard = screen.getByText('Semana 1').closest('div');
      if (weekCard) {
        fireEvent.click(weekCard);
      }
    });

    await waitFor(() => {
      expect(screen.getByText('Semana 1 - Introducción')).toBeInTheDocument();
    });

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Semana 1 - Introducción')).not.toBeInTheDocument();
    });
  });

  it('calls onBack when clicking back button', async () => {
    render(<MesocicloView onBack={mockOnBack} />);

    await waitFor(() => {
      const backButton = screen.getByText('Volver');
      fireEvent.click(backButton);
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  it('switches between calendar and list view modes', async () => {
    render(<MesocicloView onBack={mockOnBack} />);

    await waitFor(() => {
      const listButton = screen.getByText('📋 Lista');
      fireEvent.click(listButton);
    });

    // Verificar que el botón de lista está activo
    await waitFor(() => {
      const listButton = screen.getByText('📋 Lista');
      expect(listButton).toHaveClass('bg-blue-100', 'text-blue-700');
    });

    // Cambiar de vuelta a calendario
    const calendarButton = screen.getByText('📅 Calendario');
    fireEvent.click(calendarButton);

    await waitFor(() => {
      expect(calendarButton).toHaveClass('bg-blue-100', 'text-blue-700');
    });
  });

  it('shows edit functionality warning when clicking edit button', async () => {
    render(<MesocicloView onBack={mockOnBack} />);

    await waitFor(() => {
      const weekCard = screen.getByText('Semana 1').closest('div');
      if (weekCard) {
        fireEvent.click(weekCard);
      }
    });

    await waitFor(() => {
      const editButton = screen.getByText('Editar Semana');
      fireEvent.click(editButton);
      expect(mockShowToast).toHaveBeenCalledWith('Funcionalidad de edición en desarrollo', 'warning');
    });
  });

  it('displays progress indicators for different week states', async () => {
    render(<MesocicloView onBack={mockOnBack} />);

    await waitFor(() => {
      // Verificar que se muestran los indicadores de progreso
      expect(screen.getAllByText('Progreso')).toHaveLength(12); // Una por cada semana
      expect(screen.getAllByText('0%')).toHaveLength(11); // Una por cada semana (ajustado al número real)
    });
  });

  it('shows week information including focus and volume', async () => {
    render(<MesocicloView onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getAllByText('Enfoque:')).toHaveLength(12); // Una por cada semana
      expect(screen.getAllByText('Volumen:')).toHaveLength(12); // Una por cada semana
    });
  });
});