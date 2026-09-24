import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ImageLoader from './ImageLoader';

describe('ImageLoader', () => {
  it('shows a named placeholder, not a broken image, when there is no src', () => {
    const { container } = render(<ImageLoader alt="Paradise Biryani" />);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('img', { name: 'Paradise Biryani' })).toHaveTextContent('P');
  });

  it('swaps to the placeholder when the image fails to load', () => {
    const { container } = render(<ImageLoader src="https://example.invalid/x.jpg" alt="Rumali Roti" />);
    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('img', { name: 'Rumali Roti' })).toBeInTheDocument();
  });
});
