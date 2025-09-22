import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ResourceCacheService } from '../resource-cache.service';

@Component({
  selector: 'ccc-resource-base',
  imports: [RouterModule],
  providers: [ResourceCacheService],
  template: '<router-outlet></router-outlet>',
})
export class ResourceBaseComponent {}
