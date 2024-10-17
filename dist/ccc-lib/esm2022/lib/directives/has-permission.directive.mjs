import { Directive, Input, TemplateRef, ViewContainerRef, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Store } from "@ngxs/store";
import { Subject, catchError, combineLatest, map, of } from "rxjs";
import { CoreState } from "../state/core.state";
import * as i0 from "@angular/core";
export class HasPermissionDirective {
    templateRef = inject((TemplateRef));
    viewContainer = inject(ViewContainerRef);
    store = inject(Store);
    permissions = new Subject();
    set appHasPermission(val) {
        this.permissions.next(val);
    }
    constructor() {
        combineLatest({
            permissionFn: this.store.select(CoreState.hasPermission),
            permissions: this.permissions.asObservable(),
        })
            .pipe(takeUntilDestroyed(), map(({ permissionFn, permissions }) => permissionFn(permissions)), catchError(() => {
            return of(false);
        }))
            .subscribe((result) => {
            if (result) {
                if (!this.viewContainer.get(0)) {
                    this.viewContainer.createEmbeddedView(this.templateRef);
                }
            }
            else {
                this.viewContainer.clear();
            }
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.7", ngImport: i0, type: HasPermissionDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive });
    static ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "18.2.7", type: HasPermissionDirective, isStandalone: true, selector: "[appHasPermission]", inputs: { appHasPermission: "appHasPermission" }, ngImport: i0 });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.7", ngImport: i0, type: HasPermissionDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: "[appHasPermission]",
                    standalone: true,
                }]
        }], ctorParameters: () => [], propDecorators: { appHasPermission: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFzLXBlcm1pc3Npb24uZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2NjLWxpYi9zcmMvbGliL2RpcmVjdGl2ZXMvaGFzLXBlcm1pc3Npb24uZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDeEYsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFDaEUsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUNwQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxhQUFhLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUNuRSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0scUJBQXFCLENBQUM7O0FBTWhELE1BQU0sT0FBTyxzQkFBc0I7SUFDekIsV0FBVyxHQUFHLE1BQU0sQ0FBQyxDQUFBLFdBQW9CLENBQUEsQ0FBQyxDQUFDO0lBQzNDLGFBQWEsR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUN6QyxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRXRCLFdBQVcsR0FBRyxJQUFJLE9BQU8sRUFBWSxDQUFDO0lBRTlDLElBQ0ksZ0JBQWdCLENBQUMsR0FBYTtRQUNoQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM3QixDQUFDO0lBRUQ7UUFDRSxhQUFhLENBQUM7WUFDWixZQUFZLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQztZQUN4RCxXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLEVBQUU7U0FDN0MsQ0FBQzthQUNDLElBQUksQ0FDSCxrQkFBa0IsRUFBRSxFQUNwQixHQUFHLENBQUMsQ0FBQyxFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUUsRUFBRSxFQUFFLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQ2pFLFVBQVUsQ0FBQyxHQUFHLEVBQUU7WUFDZCxPQUFPLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNuQixDQUFDLENBQUMsQ0FDSDthQUNBLFNBQVMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO1lBQ3BCLElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ1gsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQy9CLElBQUksQ0FBQyxhQUFhLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUMxRCxDQUFDO1lBQ0gsQ0FBQztpQkFBTSxDQUFDO2dCQUNOLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDN0IsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQzt1R0FqQ1Usc0JBQXNCOzJGQUF0QixzQkFBc0I7OzJGQUF0QixzQkFBc0I7a0JBSmxDLFNBQVM7bUJBQUM7b0JBQ1QsUUFBUSxFQUFFLG9CQUFvQjtvQkFDOUIsVUFBVSxFQUFFLElBQUk7aUJBQ2pCO3dEQVNLLGdCQUFnQjtzQkFEbkIsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERpcmVjdGl2ZSwgSW5wdXQsIFRlbXBsYXRlUmVmLCBWaWV3Q29udGFpbmVyUmVmLCBpbmplY3QgfSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuaW1wb3J0IHsgdGFrZVVudGlsRGVzdHJveWVkIH0gZnJvbSBcIkBhbmd1bGFyL2NvcmUvcnhqcy1pbnRlcm9wXCI7XG5pbXBvcnQgeyBTdG9yZSB9IGZyb20gXCJAbmd4cy9zdG9yZVwiO1xuaW1wb3J0IHsgU3ViamVjdCwgY2F0Y2hFcnJvciwgY29tYmluZUxhdGVzdCwgbWFwLCBvZiB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBDb3JlU3RhdGUgfSBmcm9tIFwiLi4vc3RhdGUvY29yZS5zdGF0ZVwiO1xuXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6IFwiW2FwcEhhc1Blcm1pc3Npb25dXCIsXG4gIHN0YW5kYWxvbmU6IHRydWUsXG59KVxuZXhwb3J0IGNsYXNzIEhhc1Blcm1pc3Npb25EaXJlY3RpdmUge1xuICBwcml2YXRlIHRlbXBsYXRlUmVmID0gaW5qZWN0KFRlbXBsYXRlUmVmPHVua25vd24+KTtcbiAgcHJpdmF0ZSB2aWV3Q29udGFpbmVyID0gaW5qZWN0KFZpZXdDb250YWluZXJSZWYpO1xuICBwcml2YXRlIHN0b3JlID0gaW5qZWN0KFN0b3JlKTtcblxuICBwcml2YXRlIHBlcm1pc3Npb25zID0gbmV3IFN1YmplY3Q8c3RyaW5nW10+KCk7XG5cbiAgQElucHV0KClcbiAgc2V0IGFwcEhhc1Blcm1pc3Npb24odmFsOiBzdHJpbmdbXSkge1xuICAgIHRoaXMucGVybWlzc2lvbnMubmV4dCh2YWwpO1xuICB9XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgY29tYmluZUxhdGVzdCh7XG4gICAgICBwZXJtaXNzaW9uRm46IHRoaXMuc3RvcmUuc2VsZWN0KENvcmVTdGF0ZS5oYXNQZXJtaXNzaW9uKSxcbiAgICAgIHBlcm1pc3Npb25zOiB0aGlzLnBlcm1pc3Npb25zLmFzT2JzZXJ2YWJsZSgpLFxuICAgIH0pXG4gICAgICAucGlwZShcbiAgICAgICAgdGFrZVVudGlsRGVzdHJveWVkKCksXG4gICAgICAgIG1hcCgoeyBwZXJtaXNzaW9uRm4sIHBlcm1pc3Npb25zIH0pID0+IHBlcm1pc3Npb25GbihwZXJtaXNzaW9ucykpLFxuICAgICAgICBjYXRjaEVycm9yKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gb2YoZmFsc2UpO1xuICAgICAgICB9KVxuICAgICAgKVxuICAgICAgLnN1YnNjcmliZSgocmVzdWx0KSA9PiB7XG4gICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICBpZiAoIXRoaXMudmlld0NvbnRhaW5lci5nZXQoMCkpIHtcbiAgICAgICAgICAgIHRoaXMudmlld0NvbnRhaW5lci5jcmVhdGVFbWJlZGRlZFZpZXcodGhpcy50ZW1wbGF0ZVJlZik7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMudmlld0NvbnRhaW5lci5jbGVhcigpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxufVxuIl19