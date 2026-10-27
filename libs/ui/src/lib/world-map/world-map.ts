import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import * as L from 'leaflet';
import {
  COUNTRY_BY_CODE,
  I18nService,
  Mission,
  TranslationKey,
  Urgency,
} from '@doctor-mundi/core';

@Component({
  selector: 'dm-world-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './world-map.html',
  styleUrl: './world-map.scss',
})
export class DmWorldMap implements AfterViewInit, OnChanges, OnDestroy {
  private readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);

  @ViewChild('map', { static: true }) private mapEl!: ElementRef<HTMLDivElement>;

  @Input({ required: true }) missions: readonly Mission[] = [];
  @Input() selectedId: string | null = null;
  @Input() height = '560px';
  @Output() readonly missionSelected = new EventEmitter<Mission>();

  protected readonly i18nPublic = this.i18n;

  private map?: L.Map;
  private readonly layer = L.layerGroup();
  private readonly markers = new Map<string, L.Marker>();
  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.map = L.map(this.mapEl.nativeElement, {
        zoomControl: false,
        scrollWheelZoom: false,
        worldCopyJump: true,
        minZoom: 2,
        maxZoom: 9,
        attributionControl: true,
      }).setView([18, 12], 2);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(this.map);

      L.control.zoom({ position: 'bottomright' }).addTo(this.map);
      this.layer.addTo(this.map);
      this.renderMarkers();

      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => {
          this.map?.invalidateSize();
        });
        this.resizeObserver.observe(this.mapEl.nativeElement);
      }
      setTimeout(() => this.map?.invalidateSize(), 50);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) return;
    if (changes['missions']) {
      this.zone.runOutsideAngular(() => this.renderMarkers());
    }
    if (changes['selectedId']) {
      this.highlight(this.selectedId);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.map?.remove();
  }

  protected urgencyLabel(urgency: Urgency): string {
    return this.i18n.t(('urgency.' + urgency) as TranslationKey);
  }

  protected missionLabel(mission: Mission): string {
    return this.i18n.loc(mission.title);
  }

  private renderMarkers(): void {
    if (!this.map) return;
    this.layer.clearLayers();
    this.markers.clear();
    const bounds = L.latLngBounds([]);
    for (const mission of this.missions) {
      const openPlaces = Math.max(0, mission.slots.total - mission.slots.filled);
      const icon = L.divIcon({
        className: 'dm-map-marker-wrap',
        html: `<div class="dm-map-marker dm-map-marker--${mission.urgency} ${
          mission.id === this.selectedId ? 'dm-map-marker--active' : ''
        }"><span>${openPlaces}</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 30],
        popupAnchor: [0, -26],
      });
      const marker = L.marker([mission.coordinates.lat, mission.coordinates.lng], {
        icon,
        title: this.i18n.loc(mission.title),
        alt: `${this.i18n.loc(mission.title)} — ${mission.city}`,
        keyboard: true,
      }).addTo(this.layer);

      marker.bindPopup(this.popupHtml(mission), {
        className: 'dm-map-popup',
        closeButton: false,
        offset: [0, -4],
        maxWidth: 280,
      });

      marker.on('click', () => {
        this.zone.run(() => {
          this.highlight(mission.id);
          this.missionSelected.emit(mission);
        });
      });

      marker.on('popupopen', () => {
        const popup = marker.getPopup()?.getElement();
        popup?.querySelectorAll<HTMLAnchorElement>('[data-mission-link]').forEach((link) => {
          link.addEventListener('click', (event) => {
            event.preventDefault();
            this.zone.run(() => this.router.navigate(['/misiones', mission.slug]));
          });
        });
      });

      this.markers.set(mission.id, marker);
      bounds.extend([mission.coordinates.lat, mission.coordinates.lng]);
    }

    if (bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [44, 44], maxZoom: 4 });
    }
  }

  private highlight(id: string | null): void {
    for (const [missionId, marker] of this.markers) {
      const element = marker.getElement()?.querySelector('.dm-map-marker');
      element?.classList.toggle('dm-map-marker--active', missionId === id);
    }
    if (!id) return;
    const marker = this.markers.get(id);
    if (!marker) return;
    marker.openPopup();
    this.map?.panTo(marker.getLatLng(), { animate: true, duration: 0.4 });
  }

  private popupHtml(mission: Mission): string {
    const title = this.escape(this.i18n.loc(mission.title));
    const country = COUNTRY_BY_CODE.get(mission.countryCode);
    const place = `${this.escape(mission.city)}${country ? ', ' + this.escape(this.i18n.loc(country.name)) : ''}`;
    const dates = this.escape(this.i18n.formatDateRange(mission.startDate, mission.endDate));
    const urgency = this.escape(this.i18n.t(('urgency.' + mission.urgency) as TranslationKey));
    const remote = mission.remote ? ` · ${this.escape(this.i18n.t('common.remote'))}` : '';
    return `
      <div class="dm-map-popup__kicker">${urgency}${remote}</div>
      <a class="dm-map-popup__title" href="/misiones/${mission.slug}" data-mission-link>${title}</a>
      <div class="dm-map-popup__meta">${place} · ${dates}</div>
      <a class="dm-map-popup__link" href="/misiones/${mission.slug}" data-mission-link>${this.escape(
        this.i18n.t('common.viewMission')
      )}</a>
    `;
  }

  private escape(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
