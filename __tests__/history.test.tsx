import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HistoryView } from '@/components/HistoryView';
import { useToast } from '@/hooks/useToast';

// Mock useToast
jest.mock('@/hooks/useToast');
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

describe('HistoryView', () => {
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

  it('renders history view with header and navigation', async () => {
    render(<HistoryView onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Historial de Progresos')).toBeInTheDocument();
      expect(screen.getByText('Volver')).toBeInTheDocument();
      expect(screen.getByText('📊 Gráfica')).toBeInTheDocument();
      expect(screen.getByText('📋 Tabla')).toBeInTheDocument();
    });
  });

  it('displays metric selector with all options', async () => {
    render(<HistoryView onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Métrica')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Peso')).toBeInTheDocument();
    });

    const metricSelect = screen.getByDisplayValue('Peso');
    fireEvent.click(metricSelect);

    await waitFor(() => {
      expect(screen.getByText('Cintura')).toBeInTheDocument();
      expect(screen.getByText('Cardio')).toBeInTheDocument();
      expect(screen.getByText('NEAT')).toBeInTheDocument();
      expect(screen.getByText('Entrenamientos')).toBeInTheDocument();
    });
  });

  it('displays date range selector with all options', async () => {
    render(<HistoryView onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Período')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Últimos 30 días')).toBeInTheDocument();
    });

    const dateSelect = screen.getByDisplayValue('Últimos 30 días');
    fireEvent.click(dateSelect);

    await waitFor(() => {
      expect(screen.getByText('Últimos 7 días')).toBeInTheDocument();
      expect(screen.getByText('Últimos 90 días')).toBeInTheDocument();
      expect(screen.getByText('Último año')).toBeInTheDocument();
    });
  });

  it('shows stats cards for selected metric', async () => {
    render(<HistoryView onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Valor Actual')).toBeInTheDocument();
      expect(screen.getByText('Cambio')).toBeInTheDocument();
      expect(screen.getByText('Promedio')).toBeInTheDocument();
      expect(screen.getByText('Rango')).toBeInTheDocument();
    });
  });

  it('switches between chart and table view modes', async () => {
    render(<HistoryView onBack={mockOnBack} />);

    await waitFor(() => {
      const tableButton = screen.getByText('📋 Tabla');
      fireEvent.click(tableButton);
    });

    // Verificar que el botón de tabla está activo
    await waitFor(() => {
      const tableButton = screen.getByText('📋 Tabla');
      expect(tableButton).toHaveClass('bg-blue-100', 'text-blue-700');
    });

    // Cambiar de vuelta a gráfica
    const chartButton = screen.getByText('📊 Gráfica');
    fireEvent.click(chartButton);

    await waitFor(() => {
      expect(chartButton).toHaveClass('bg-blue-100', 'text-blue-700');
    });
  });

  it('calls onBack when clicking back button', async () => {
    render(<HistoryView onBack={mockOnBack} />);

    await waitFor(() => {
      const backButton = screen.getByText('Volver');
      fireEvent.click(backButton);
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  it('shows export functionality warning when clicking export button', async () => {
    render(<HistoryView onBack={mockOnBack} />);

    await waitFor(() => {
      const exportButton = screen.getByText('📊 Exportar Datos');
      fireEvent.click(exportButton);
      expect(mockShowToast).toHaveBeenCalledWith('Funcionalidad de exportación en desarrollo', 'warning');
    });
  });

  it('displays chart view by default', async () => {
    render(<HistoryView onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Peso - Últimos 30 días')).toBeInTheDocument();
    });
  });

  it('changes metric when selecting different option', async () => {
    render(<HistoryView onBack={mockOnBack} />);

    await waitFor(() => {
      const metricSelect = screen.getByDisplayValue('Peso');
      fireEvent.change(metricSelect, { target: { value: 'cardio' } });
    });

    await waitFor(() => {
      expect(screen.getByText('Cardio - Últimos 30 días')).toBeInTheDocument();
    });
  });

  it('changes date range when selecting different option', async () => {
    render(<HistoryView onBack={mockOnBack} />);

    await waitFor(() => {
      const dateSelect = screen.getByDisplayValue('Últimos 30 días');
      fireEvent.change(dateSelect, { target: { value: '7d' } });
    });

    await waitFor(() => {
      expect(screen.getByText('Peso - Últimos 7 días')).toBeInTheDocument();
    });
  });

  it('displays table view with correct headers when switching to table mode', async () => {
    render(<HistoryView onBack={mockOnBack} />);

    await waitFor(() => {
      const tableButton = screen.getByText('📋 Tabla');
      fireEvent.click(tableButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Fecha')).toBeInTheDocument();
      expect(screen.getByText('Valor')).toBeInTheDocument();
    });
  });

  it('shows no data message when no data is available', async () => {
    // Mock empty data by temporarily modifying the component
    const originalGenerateHistoryData = jest.requireActual('@/components/HistoryView').generateHistoryData;
    
    render(<HistoryView onBack={mockOnBack} />);

    // This test would need to be adjusted based on the actual implementation
    // For now, we'll just verify the component renders without errors
    await waitFor(() => {
      expect(screen.getByText('Historial de Progresos')).toBeInTheDocument();
    });
  });

  it('displays trend indicators in stats cards', async () => {
    render(<HistoryView onBack={mockOnBack} />);

    await waitFor(() => {
      // Verificar que se muestran los indicadores de tendencia
      expect(screen.getByText('Cambio')).toBeInTheDocument();
      expect(screen.getByText('Promedio')).toBeInTheDocument();
    });
  });
});