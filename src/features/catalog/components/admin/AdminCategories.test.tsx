import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const post = vi.fn();
const put = vi.fn();
const refetch = vi.fn();
const showError = vi.fn();

vi.mock('@/lib/zodiosClients', () => ({
  restaurantApi: { category: { post: (...args: unknown[]) => post(...args), put: (...args: unknown[]) => put(...args) } },
}));
vi.mock('@/hooks/usePolling', () => ({
  usePolling: () => ({ data: [], refetch }),
}));
vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({ showSuccess: vi.fn(), showError }),
}));

import AdminCategories from './AdminCategories';

describe('AdminCategories validation', () => {
  beforeEach(() => {
    post.mockReset();
    put.mockReset();
    refetch.mockReset();
    showError.mockReset();
  });

  it('rejects a description beyond the backend length limit before it sends a write', () => {
    render(<AdminCategories />);
    fireEvent.change(screen.getByPlaceholderText('e.g. Italian, Vegan, Burgers'), { target: { value: 'Desserts' } });
    fireEvent.change(screen.getByPlaceholderText('Brief description of the category...'), { target: { value: 'x'.repeat(256) } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Category' }));

    expect(showError).toHaveBeenCalledWith('Description cannot exceed 255 characters');
    expect(post).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
    expect(refetch).not.toHaveBeenCalled();
  });
});
