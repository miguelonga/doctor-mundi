import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Organization } from '@doctor-mundi/core';

@Component({
  selector: 'dm-organization-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="dm-org-mark"
      [style.background]="organization().color"
      [style.width.px]="pixels()"
      [style.height.px]="pixels()"
      [style.font-size.px]="fontSize()"
      [attr.aria-label]="organization().name"
      role="img"
    >
      {{ organization().monogram }}
    </span>
  `,
  styleUrl: './organization-mark.scss',
})
export class DmOrganizationMark {
  readonly organization = input.required<Organization>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  protected readonly pixels = computed(() => (this.size() === 'sm' ? 32 : this.size() === 'lg' ? 58 : 42));
  protected readonly fontSize = computed(() => (this.size() === 'sm' ? 10 : this.size() === 'lg' ? 15 : 12));
}
