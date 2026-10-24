import { Component, input, output } from '@angular/core';
import { formatBytes, formatDateTime } from '../../core/utils/format';

export interface InfoItem {
  name: string;
  kind: 'archivo' | 'carpeta';
  type?: string;
  createdAt?: string;
  updatedAt?: string;
  size?: number;
  owner?: string;
}

@Component({
  selector: 'app-info-modal',
  standalone: true,
  templateUrl: './info-modal.html',
})
export class InfoModal {
  readonly info = input.required<InfoItem>();
  readonly closed = output<void>();

  formatBytes = formatBytes;
  formatDateTime = formatDateTime;
}
