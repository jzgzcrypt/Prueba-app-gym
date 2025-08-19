import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProgrammingFlow } from '@/components/ProgrammingFlow';
import { ObservationModal } from '@/components/ObservationModal';
import { useToast } from '@/hooks/useToast';

// Mock useToast
jest.mock('@/hooks/useToast');
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

describe('ProgrammingFlow', () => {
  const mockShowToast = jest.fn();
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    mockUseToast.mockReturnValue({ showToast: mockShowToast });
  });

  it('renders programming flow with initial step', () => {
    render(<ProgrammingFlow onComplete={mockOnComplete} />);
    
    expect(screen.getByText('📋 Flujo de Programación')).toBeInTheDocument();
    expect(screen.getByText('📝 Información de la Programación')).toBeInTheDocument();
    expect(screen.getByText('Paso 1 de 5')).toBeInTheDocument();
  });

  it('shows form fields for programming request', () => {
    render(<ProgrammingFlow onComplete={mockOnComplete} />);
    
    expect(screen.getByLabelText(/Título/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Descripción/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Solicitante/)).toBeInTheDocument();
  });

  it('validates required fields before proceeding', async () => {
    render(<ProgrammingFlow onComplete={mockOnComplete} />);
    
    const continueButton = screen.getByText('Continuar →');
    fireEvent.click(continueButton);
    
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        'Por favor completa todos los campos obligatorios',
        'error'
      );
    });
  });

  it('proceeds to review step with valid data', async () => {
    render(<ProgrammingFlow onComplete={mockOnComplete} />);
    
    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Título/), {
      target: { value: 'Test Programming' }
    });
    fireEvent.change(screen.getByLabelText(/Descripción/), {
      target: { value: 'This is a test programming request with enough characters to pass validation' }
    });
    fireEvent.change(screen.getByLabelText(/Solicitante/), {
      target: { value: 'John Doe' }
    });
    
    const continueButton = screen.getByText('Continuar →');
    fireEvent.click(continueButton);
    
    await waitFor(() => {
      expect(screen.getByText('👀 Revisión de la Solicitud')).toBeInTheDocument();
      expect(screen.getByText('Paso 2 de 5')).toBeInTheDocument();
    });
  });

  it('shows observations when description is too short', async () => {
    render(<ProgrammingFlow onComplete={mockOnComplete} />);
    
    // Fill fields with short description
    fireEvent.change(screen.getByLabelText(/Título/), {
      target: { value: 'Test Programming' }
    });
    fireEvent.change(screen.getByLabelText(/Descripción/), {
      target: { value: 'Short' }
    });
    fireEvent.change(screen.getByLabelText(/Solicitante/), {
      target: { value: 'John Doe' }
    });
    
    const continueButton = screen.getByText('Continuar →');
    fireEvent.click(continueButton);
    
    await waitFor(() => {
      expect(screen.getByText('👀 Revisión de la Solicitud')).toBeInTheDocument();
      expect(screen.getByText(/Observaciones Encontradas/)).toBeInTheDocument();
    });
  });

  it('allows navigation back to input step', async () => {
    render(<ProgrammingFlow onComplete={mockOnComplete} />);
    
    // Fill and proceed to review
    fireEvent.change(screen.getByLabelText(/Título/), {
      target: { value: 'Test Programming' }
    });
    fireEvent.change(screen.getByLabelText(/Descripción/), {
      target: { value: 'This is a test programming request with enough characters to pass validation' }
    });
    fireEvent.change(screen.getByLabelText(/Solicitante/), {
      target: { value: 'John Doe' }
    });
    
    fireEvent.click(screen.getByText('Continuar →'));
    
    await waitFor(() => {
      expect(screen.getByText('👀 Revisión de la Solicitud')).toBeInTheDocument();
    });
    
    // Go back
    fireEvent.click(screen.getByText('← Volver'));
    
    await waitFor(() => {
      expect(screen.getByText('📝 Información de la Programación')).toBeInTheDocument();
    });
  });
});

describe('ObservationModal', () => {
  const mockShowToast = jest.fn();
  const mockOnClose = jest.fn();
  const mockOnResolveObservation = jest.fn();
  const mockOnAssignTask = jest.fn();
  const mockOnCompleteTask = jest.fn();

  const mockObservations = [
    {
      id: 'obs-1',
      type: 'error' as const,
      message: 'El título es obligatorio',
      field: 'title',
      requiresAction: true,
      createdAt: new Date()
    },
    {
      id: 'obs-2',
      type: 'warning' as const,
      message: 'La descripción es muy corta',
      field: 'description',
      requiresAction: true,
      task: {
        id: 'task-1',
        title: 'Ampliar descripción',
        description: 'Completar la descripción con más detalles',
        status: 'pending' as const,
        priority: 'medium' as const,
        createdAt: new Date()
      },
      createdAt: new Date()
    }
  ];

  beforeEach(() => {
    mockUseToast.mockReturnValue({ showToast: mockShowToast });
  });

  it('renders observation modal with actionable observations', () => {
    render(
      <ObservationModal
        isOpen={true}
        onClose={mockOnClose}
        observations={mockObservations}
        onResolveObservation={mockOnResolveObservation}
        onAssignTask={mockOnAssignTask}
        onCompleteTask={mockOnCompleteTask}
      />
    );
    
    expect(screen.getByText('📋 Observaciones Pendientes')).toBeInTheDocument();
    expect(screen.getByText('El título es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('La descripción es muy corta')).toBeInTheDocument();
  });

  it('shows success message when no actionable observations', () => {
    const nonActionableObservations = [
      {
        id: 'obs-1',
        type: 'info' as const,
        message: 'Información general',
        requiresAction: false,
        createdAt: new Date()
      }
    ];

    render(
      <ObservationModal
        isOpen={true}
        onClose={mockOnClose}
        observations={nonActionableObservations}
        onResolveObservation={mockOnResolveObservation}
        onAssignTask={mockOnAssignTask}
        onCompleteTask={mockOnCompleteTask}
      />
    );
    
    expect(screen.getByText('✅ No hay observaciones pendientes de acción')).toBeInTheDocument();
  });

  it('allows resolving observations', async () => {
    render(
      <ObservationModal
        isOpen={true}
        onClose={mockOnClose}
        observations={mockObservations}
        onResolveObservation={mockOnResolveObservation}
        onAssignTask={mockOnAssignTask}
        onCompleteTask={mockOnCompleteTask}
      />
    );
    
    const resolveButton = screen.getAllByText('🔧 Resolver Observación')[0];
    fireEvent.click(resolveButton);
    
    await waitFor(() => {
      expect(screen.getByText('Resolver Observación')).toBeInTheDocument();
    });
    
    const textarea = screen.getByPlaceholderText('Describe cómo resolviste esta observación...');
    fireEvent.change(textarea, { target: { value: 'Observación resuelta' } });
    
    const confirmButton = screen.getByText('Resolver');
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockOnResolveObservation).toHaveBeenCalledWith('obs-1');
    });
  });

  it('allows assigning tasks', async () => {
    render(
      <ObservationModal
        isOpen={true}
        onClose={mockOnClose}
        observations={mockObservations}
        onResolveObservation={mockOnResolveObservation}
        onAssignTask={mockOnAssignTask}
        onCompleteTask={mockOnCompleteTask}
      />
    );
    
    const assignInput = screen.getByPlaceholderText('Asignar a...');
    fireEvent.change(assignInput, { target: { value: 'John Doe' } });
    
    const assignButton = screen.getByText('Asignar');
    fireEvent.click(assignButton);
    
    await waitFor(() => {
      expect(mockOnAssignTask).toHaveBeenCalledWith('task-1', 'John Doe');
    });
  });

  it('validates required fields when resolving observations', async () => {
    render(
      <ObservationModal
        isOpen={true}
        onClose={mockOnClose}
        observations={mockObservations}
        onResolveObservation={mockOnResolveObservation}
        onAssignTask={mockOnAssignTask}
        onCompleteTask={mockOnCompleteTask}
      />
    );
    
    const resolveButton = screen.getAllByText('🔧 Resolver Observación')[0];
    fireEvent.click(resolveButton);
    
    await waitFor(() => {
      expect(screen.getByText('Resolver Observación')).toBeInTheDocument();
    });
    
    const confirmButton = screen.getByText('Resolver');
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        'Por favor ingresa una resolución',
        'error'
      );
    });
  });

  it('closes modal when clicking close button', () => {
    render(
      <ObservationModal
        isOpen={true}
        onClose={mockOnClose}
        observations={mockObservations}
        onResolveObservation={mockOnResolveObservation}
        onAssignTask={mockOnAssignTask}
        onCompleteTask={mockOnCompleteTask}
      />
    );
    
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });
});