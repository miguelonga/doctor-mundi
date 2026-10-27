import { AfterViewInit, Directive, ElementRef, OnDestroy, inject } from '@angular/core';

/**
 * Tahoe Forms does not expose a native date field type. This tiny adapter keeps
 * the form engine (string model) while upgrading the two availability inputs to
 * real date pickers whenever the wizard re-renders a step.
 */
@Directive({
  selector: 'tf-form[dmDateFields]',
})
export class DmDateFields implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer?: MutationObserver;

  ngAfterViewInit(): void {
    this.upgrade();
    this.observer = new MutationObserver(() => this.upgrade());
    this.observer.observe(this.host.nativeElement, { childList: true, subtree: true });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private upgrade(): void {
    this.host.nativeElement
      .querySelectorAll<HTMLInputElement>('input[name="availableFrom"], input[name="availableTo"]')
      .forEach((input) => {
        if (input.type !== 'date') input.type = 'date';
      });
  }
}
