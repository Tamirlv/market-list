import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import OfflineBanner from '../../src/ui/OfflineBanner';

describe('OfflineBanner', () => {
  it('shows the offline message when offline', () => {
    render(<OfflineBanner online={false} />);
    expect(screen.getByText('לא מחובר — יסונכרן כשתחזור הקליטה')).toBeInTheDocument();
  });

  it('renders nothing when online', () => {
    const { container } = render(<OfflineBanner online={true} />);
    expect(container).toBeEmptyDOMElement();
  });
});
