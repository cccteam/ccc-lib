import { JsonPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { swrHttpResource, swrRxResource } from '@cccteam/ccc-lib/resource-utils/safe-resource';
import { Weathers } from '../../../core/generated/zz_gen_resources';

@Component({
  selector: 'app-swr-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="card">
      <h2>swrHttpResource <small>(list)</small></h2>
      <p class="desc">
        On mount: cached value appears immediately, then fresh data replaces it. Try unmounting and remounting the
        section — the list shows up instantly the second time.
      </p>
      <div class="status">
        <span
          >status: <strong>{{ swrHttpList.resource.status() }}</strong></span
        >
        <span
          >hasValue: <strong>{{ swrHttpList.resource.hasValue() }}</strong></span
        >
        <span
          >count: <strong>{{ swrHttpList.safeValue().length }}</strong></span
        >
      </div>
      <button (click)="swrHttpList.resource.reload()">Reload</button>
      <pre>{{ swrHttpList.safeValue() | json }}</pre>
    </article>

    <article class="card">
      <h2>swrRxResource <small>(detail)</small></h2>
      <p class="desc">
        Cache key is required since the URL is not derivable from the wrapper's inputs. No default → typed
        <code>Weather | undefined</code>.
      </p>
      <div class="status">
        <span
          >status: <strong>{{ swrRxDetail.resource.status() }}</strong></span
        >
        <span
          >hasValue: <strong>{{ swrRxDetail.resource.hasValue() }}</strong></span
        >
        <span
          >value: <strong>{{ swrRxDetail.safeValue()?.temperature ?? '—' }}</strong></span
        >
      </div>
      <button (click)="swrRxDetail.resource.reload()" [disabled]="!weatherId()">Reload</button>
      <pre>{{ swrRxDetail.safeValue() | json }}</pre>
    </article>
  `,
  styleUrl: './safe-resource-showcase.component.scss',
  imports: [JsonPipe],
})
export class SwrSectionComponent {
  private readonly http = inject(HttpClient);
  readonly weatherId = input.required<string>();

  readonly swrHttpList = swrHttpResource<Weathers[]>(() => '/api/weathers', undefined, []);

  readonly swrRxDetail = swrRxResource<Weathers>('weather-detail', {
    params: () => (this.weatherId() ? this.weatherId() : undefined),
    stream: ({ params }) => this.http.get<Weathers>(`/api/weathers/${params}`),
  });
}
