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

  it('shows the fallback image, not the initial, when there is no src and one is given', () => {
    const { container } = render(<ImageLoader alt="" fallbackSrc="/favicon.svg" />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.getAttribute('src')).toBe('/favicon.svg');
    expect(img!.getAttribute('alt')).toBe('');
  });

  it('swaps a failed photo for the fallback image', () => {
    const { container } = render(<ImageLoader src="https://example.invalid/x.jpg" alt="" fallbackSrc="/favicon.svg" />);
    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelectorAll('img')).toHaveLength(1);
    expect(container.querySelector('img')!.getAttribute('src')).toBe('/favicon.svg');
  });

  it('drops to the placeholder when the fallback fails too, rather than looping', () => {
    const { container } = render(<ImageLoader src="https://example.invalid/x.jpg" alt="Rumali Roti" fallbackSrc="/missing.svg" />);
    fireEvent.error(container.querySelector('img')!);
    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('img', { name: 'Rumali Roti' })).toHaveTextContent('R');
  });
});
