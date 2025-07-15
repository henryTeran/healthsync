import { render, screen } from '../utils/testUtils';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Chargement en cours');
    
    const srText = screen.getByText('Chargement...');
    expect(srText).toHaveClass('sr-only');
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    let spinner = screen.getByRole('status').firstChild;
    expect(spinner).toHaveClass('w-4', 'h-4');

    rerender(<LoadingSpinner size="lg" />);
    spinner = screen.getByRole('status').firstChild;
    expect(spinner).toHaveClass('w-12', 'h-12');

    rerender(<LoadingSpinner size="xl" />);
    spinner = screen.getByRole('status').firstChild;
    expect(spinner).toHaveClass('w-16', 'h-16');
  });

  it('should apply custom className', () => {
    render(<LoadingSpinner className="custom-class" />);
    
    const container = screen.getByRole('status').parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('should have proper accessibility attributes', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Chargement en cours');
    
    const hiddenText = screen.getByText('Chargement...');
    expect(hiddenText).toHaveClass('sr-only');
  });
});