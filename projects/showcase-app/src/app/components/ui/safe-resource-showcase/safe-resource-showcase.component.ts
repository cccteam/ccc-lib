import { JsonPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  safeHttpResource,
  safeRxResource,
  staleHttpResource,
  staleRxResource,
} from '@cccteam/ccc-lib/resource-utils/safe-resource';
import { Users } from '../../../core/generated/zz_gen_resources';
import { SwrSectionComponent } from './swr-section.component';

@Component({
  selector: 'app-resource-showcase',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './safe-resource-showcase.component.html',
  styleUrl: './safe-resource-showcase.component.scss',
  imports: [JsonPipe, SwrSectionComponent],
})
export class SafeResourceShowcaseComponent {
  private readonly http = inject(HttpClient);

  readonly userId = signal('');
  readonly showSwrSection = signal(true);

  // --- safe variants ---
  readonly safeHttpList = safeHttpResource<Users[]>(() => '/api/users', undefined, []);

  readonly safeRxDetail = safeRxResource<Users>({
    params: () => (this.userId() ? this.userId() : undefined),
    stream: ({ params }) => this.http.get<Users>(`/api/users/${params}`),
  });

  // --- stale variants ---
  readonly staleHttpList = staleHttpResource<Users[]>(() => '/api/users', undefined, []);

  readonly staleRxDetail = staleRxResource<Users>({
    params: () => (this.userId() ? this.userId() : undefined),
    stream: ({ params }) => this.http.get<Users>(`/api/users/${params}`),
  });

  bumpAll(): void {
    this.safeHttpList.resource.reload();
    this.staleHttpList.resource.reload();
    if (this.userId()) {
      this.safeRxDetail.resource.reload();
      this.staleRxDetail.resource.reload();
    }
  }
}
