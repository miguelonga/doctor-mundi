import { Injectable, signal } from '@angular/core';

export type ToastIntent = 'success' | 'error' | 'info';

export interface DmToast {
  readonly id: number;
  readonly message: string;
  readonly intent: ToastIntent;
}

@Injectable({ providedIn: 'root' })
export class ToastStore {
  readonly toasts = signal<readonly DmToast[]>([]);
  private counter = 0;

  show(message: string, intent: ToastIntent = 'success'): void {
    const id = ++this.counter;
    this.toasts.update((toasts) => [...toasts, { id, message, intent }]);
    setTimeout(() => this.dismiss(id), 4600);
  }

  dismiss(id: number): void {
    this.toasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }
}
