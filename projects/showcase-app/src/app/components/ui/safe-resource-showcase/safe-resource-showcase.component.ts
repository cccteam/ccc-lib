import { JsonPipe } from '@angular/common';
import { httpResource, HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
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
  imports: [JsonPipe, SwrSectionComponent, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
})
export class SafeResourceShowcaseComponent {
  private readonly http = inject(HttpClient);

  readonly userId = signal('');
  readonly showSwrSection = signal(true);
  readonly useErrorUrl = signal(false);

  private readonly listUrl = computed(() => (this.useErrorUrl() ? '/api/invalid-route-test' : '/api/users'));
  private readonly detailUrl = computed(() => {
    if (this.useErrorUrl()) return '/api/invalid-route-test';
    return this.userId() ? `/api/users/${this.userId()}` : undefined;
  });

  // --- plain Angular variants (for comparison) ---
  readonly plainHttpList = httpResource<Users[]>(() => this.listUrl());

  readonly plainRxDetail = rxResource<Users, string | undefined>({
    params: () => this.detailUrl(),
    stream: ({ params }) => this.http.get<Users>(params!),
  });

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

  toggleErrorUrl(): void {
    this.useErrorUrl.update((v) => !v);
  }

  bumpAll(): void {
    this.plainHttpList.reload();
    this.safeHttpList.resource.reload();
    this.staleHttpList.resource.reload();
    if (this.userId()) {
      this.plainRxDetail.reload();
      this.safeRxDetail.resource.reload();
      this.staleRxDetail.resource.reload();
    }
  }
}
