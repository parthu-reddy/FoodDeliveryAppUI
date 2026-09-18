import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Modal } from './Modal';

describe('Modal', () => {
  it('uses its title as the dialog accessible name', () => {
    render(
      <Modal open onClose={() => {}} title="Refund request">
        <p>body</p>
      </Modal>,
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Refund request');
    expect(screen.getByRole('heading', { name: 'Refund request' })).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    render(
      <Modal open={false} onClose={() => {}} title="Refund request">
        <p>body</p>
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('has a labelled close control', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Refund request">
        <p>body</p>
      </Modal>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders a footer when given one', () => {
    render(
      <Modal open onClose={() => {}} title="Refund request" footer={<span>footer slot</span>}>
        <p>body</p>
      </Modal>,
    );
    expect(screen.getByText('footer slot')).toBeInTheDocument();
  });
});
