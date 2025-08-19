import { render, screen, fireEvent } from '@testing-library/react';
import { Dashboard } from '@/components/Dashboard';

// Mock del hook useToast
const mockShowToast = jest.fn();
jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

// Mock de las acciones del servidor
jest.mock('@/app/actions', () => ({
  addWeightAction: jest.fn(() => Promise.resolve({ success: true })),
  addCardioAction: jest.fn(() => Promise.resolve({ success: true })),
  addNeatAction: jest.fn(() => Promise.resolve({ success: true })),
  addSeguimientoAction: jest.fn(() => Promise.resolve({ success: true })),
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard with all main sections', () => {
    render(<Dashboard showToast={mockShowToast} />);
    
    expect(screen.getByText('Dashboard Principal')).toBeInTheDocument();
    expect(screen.getByText('Registro de Peso')).toBeInTheDocument();
    expect(screen.getByText('Seguimiento de Cardio')).toBeInTheDocument();
    expect(screen.getByText('Registro de NEAT')).toBeInTheDocument();
    expect(screen.getByText('Entrenamiento')).toBeInTheDocument();
  });

  it('shows progress overview with all metrics', () => {
    render(<Dashboard showToast={mockShowToast} />);
    
    expect(screen.getByText('📊 Progreso del Día')).toBeInTheDocument();
    expect(screen.getByText('Peso')).toBeInTheDocument();
    expect(screen.getByText('Cardio')).toBeInTheDocument();
    expect(screen.getByText('NEAT')).toBeInTheDocument();
    expect(screen.getByText('Entreno')).toBeInTheDocument();
    expect(screen.getByText('Medidas')).toBeInTheDocument();
  });

  it('opens weight modal when weight card is clicked', () => {
    render(<Dashboard showToast={mockShowToast} />);
    
    const weightCard = screen.getByText('Registro de Peso').closest('div');
    fireEvent.click(weightCard!);
    
    expect(screen.getByText('⚖️ Registro de Peso')).toBeInTheDocument();
  });

  it('opens cardio modal when cardio card is clicked', () => {
    render(<Dashboard showToast={mockShowToast} />);
    
    const cardioCard = screen.getByText('Seguimiento de Cardio').closest('div');
    fireEvent.click(cardioCard!);
    
    expect(screen.getByText('🏃 Seguimiento de Cardio')).toBeInTheDocument();
  });

  it('opens NEAT modal when NEAT card is clicked', () => {
    render(<Dashboard showToast={mockShowToast} />);
    
    const neatCard = screen.getByText('Registro de NEAT').closest('div');
    fireEvent.click(neatCard!);
    
    expect(screen.getByText('🚶 Registro de NEAT')).toBeInTheDocument();
  });

  it('opens workout modal when workout card is clicked', () => {
    render(<Dashboard showToast={mockShowToast} />);
    
    const workoutCard = screen.getByText('Entrenamiento').closest('div');
    fireEvent.click(workoutCard!);
    
    expect(screen.getByText('🏋️ Entrenamiento')).toBeInTheDocument();
  });

  it('shows current date in header', () => {
    render(<Dashboard showToast={mockShowToast} />);
    
    const today = new Date().toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    expect(screen.getByText(today)).toBeInTheDocument();
  });
});