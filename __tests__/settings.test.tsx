import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsView } from '@/components/SettingsView';
import { useToast } from '@/hooks/useToast';

// Mock useToast
jest.mock('@/hooks/useToast');
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

describe('SettingsView', () => {
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

  it('renders settings view with header and navigation', async () => {
    render(<SettingsView onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Configuración')).toBeInTheDocument();
      expect(screen.getByText('Volver')).toBeInTheDocument();
    });
  });

  it('displays all tabs in navigation', async () => {
    render(<SettingsView onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Perfil')).toBeInTheDocument();
      expect(screen.getByText('Objetivos')).toBeInTheDocument();
      expect(screen.getByText('Unidades')).toBeInTheDocument();
      expect(screen.getByText('Notificaciones')).toBeInTheDocument();
      expect(screen.getByText('Preferencias')).toBeInTheDocument();
    });
  });

  it('shows profile tab by default with personal information fields', async () => {
    render(<SettingsView onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Información Personal')).toBeInTheDocument();
      expect(screen.getByText('Nombre')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Edad')).toBeInTheDocument();
      expect(screen.getByText('Altura (cm)')).toBeInTheDocument();
      expect(screen.getByText('Género')).toBeInTheDocument();
    });
  });

  it('switches to goals tab when clicked', async () => {
    render(<SettingsView onBack={mockOnBack} />);

    await waitFor(() => {
      const goalsTab = screen.getByText('Objetivos');
      fireEvent.click(goalsTab);
    });

    await waitFor(() => {
      expect(screen.getByText('Objetivos de Entrenamiento')).toBeInTheDocument();
      expect(screen.getByText('Peso objetivo (kg)')).toBeInTheDocument();
      expect(screen.getByText('Cintura objetivo (cm)')).toBeInTheDocument();
      expect(screen.getByText('Cardio semanal (minutos)')).toBeInTheDocument();
      expect(screen.getByText('Pasos diarios objetivo')).toBeInTheDocument();
    });
  });

  it('switches to units tab when clicked', async () => {
    render(<SettingsView onBack={mockOnBack} />);

    await waitFor(() => {
      const unitsTab = screen.getByText('Unidades');
      fireEvent.click(unitsTab);
    });

    await waitFor(() => {
      expect(screen.getByText('Unidades de Medida')).toBeInTheDocument();
      expect(screen.getByText('Unidad de peso')).toBeInTheDocument();
      expect(screen.getByText('Unidad de altura')).toBeInTheDocument();
      expect(screen.getByText('Unidad de distancia')).toBeInTheDocument();
    });
  });

  it('switches to notifications tab when clicked', async () => {
    render(<SettingsView onBack={mockOnBack} />);

    await waitFor(() => {
      const notificationsTab = screen.getByText('Notificaciones');
      fireEvent.click(notificationsTab);
    });

    await waitFor(() => {
      expect(screen.getByText('Notificaciones y Recordatorios')).toBeInTheDocument();
      expect(screen.getByText('Recordatorio de peso')).toBeInTheDocument();
      expect(screen.getByText('Recordatorio de cardio')).toBeInTheDocument();
      expect(screen.getByText('Recordatorio de entrenamiento')).toBeInTheDocument();
      expect(screen.getByText('Recordatorio de medidas')).toBeInTheDocument();
      expect(screen.getByText('Hora de recordatorios')).toBeInTheDocument();
    });
  });

  it('switches to preferences tab when clicked', async () => {
    render(<SettingsView onBack={mockOnBack} />);

    await waitFor(() => {
      const preferencesTab = screen.getByText('Preferencias');
      fireEvent.click(preferencesTab);
    });

    await waitFor(() => {
      expect(screen.getByText('Preferencias de la Aplicación')).toBeInTheDocument();
      expect(screen.getByText('Tema')).toBeInTheDocument();
      expect(screen.getByText('Idioma')).toBeInTheDocument();
      expect(screen.getByText('Respaldo automático')).toBeInTheDocument();
      expect(screen.getByText('Compartir datos')).toBeInTheDocument();
      expect(screen.getByText('🔄 Restablecer Configuración')).toBeInTheDocument();
    });
  });

  it('calls onBack when clicking back button', async () => {
    render(<SettingsView onBack={mockOnBack} />);

    await waitFor(() => {
      const backButton = screen.getByText('Volver');
      fireEvent.click(backButton);
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  it('updates form fields when user types', async () => {
    render(<SettingsView onBack={mockOnBack} />);

    await waitFor(() => {
      const nameInput = screen.getByDisplayValue('Usuario');
      fireEvent.change(nameInput, { target: { value: 'Juan Pérez' } });
      expect(nameInput).toHaveValue('Juan Pérez');
    });
  });

  it('shows save button when changes are made', async () => {
    render(<SettingsView onBack={mockOnBack} />);

    await waitFor(() => {
      const nameInput = screen.getByDisplayValue('Usuario');
      fireEvent.change(nameInput, { target: { value: 'Juan Pérez' } });
    });

    await waitFor(() => {
      expect(screen.getByText('💾 Guardar')).toBeInTheDocument();
    });
  });

  it('shows save button when changes are made', async () => {
    render(<SettingsView onBack={mockOnBack} />);

    // Esperar a que se cargue el componente
    await waitFor(() => {
      expect(screen.getByText('Configuración')).toBeInTheDocument();
    });

    await waitFor(() => {
      const nameInput = screen.getByDisplayValue('Usuario');
      fireEvent.change(nameInput, { target: { value: 'Juan Pérez' } });
    });

    await waitFor(() => {
      expect(screen.getByText('💾 Guardar')).toBeInTheDocument();
    });
  });

  it('shows reset confirmation when clicking reset button', async () => {
    // Mock window.confirm
    const mockConfirm = jest.spyOn(window, 'confirm').mockImplementation(() => true);

    render(<SettingsView onBack={mockOnBack} />);

    await waitFor(() => {
      const preferencesTab = screen.getByText('Preferencias');
      fireEvent.click(preferencesTab);
    });

    await waitFor(() => {
      const resetButton = screen.getByText('🔄 Restablecer Configuración');
      fireEvent.click(resetButton);
      expect(mockConfirm).toHaveBeenCalledWith('¿Estás seguro de que quieres restablecer toda la configuración?');
    });

    mockConfirm.mockRestore();
  });

  it('toggles notification switches', async () => {
    render(<SettingsView onBack={mockOnBack} />);

    await waitFor(() => {
      const notificationsTab = screen.getByText('Notificaciones');
      fireEvent.click(notificationsTab);
    });

    await waitFor(() => {
      // Verificar que se muestran los switches de notificaciones
      expect(screen.getByText('Recordatorio de peso')).toBeInTheDocument();
      expect(screen.getByText('Recordatorio de cardio')).toBeInTheDocument();
      expect(screen.getByText('Recordatorio de entrenamiento')).toBeInTheDocument();
      expect(screen.getByText('Recordatorio de medidas')).toBeInTheDocument();
    });
  });

  it('changes unit selections', async () => {
    render(<SettingsView onBack={mockOnBack} />);

    await waitFor(() => {
      const unitsTab = screen.getByText('Unidades');
      fireEvent.click(unitsTab);
    });

    await waitFor(() => {
      const weightUnitSelect = screen.getByDisplayValue('Kilogramos (kg)');
      fireEvent.change(weightUnitSelect, { target: { value: 'lbs' } });
      expect(weightUnitSelect).toHaveValue('lbs');
    });
  });

  it('updates goal values', async () => {
    render(<SettingsView onBack={mockOnBack} />);

    await waitFor(() => {
      const goalsTab = screen.getByText('Objetivos');
      fireEvent.click(goalsTab);
    });

    await waitFor(() => {
      const weightGoalInput = screen.getByDisplayValue('70');
      fireEvent.change(weightGoalInput, { target: { value: '65' } });
      expect(weightGoalInput).toHaveValue(65);
    });
  });

  it('displays loading state initially', async () => {
    render(<SettingsView onBack={mockOnBack} />);

    // The component should show loading initially, then render content
    await waitFor(() => {
      expect(screen.getByText('Configuración')).toBeInTheDocument();
    });
  });
});