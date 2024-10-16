import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as i0 from "@angular/core";
export class ErrorService {
    errorMessages = new BehaviorSubject([]);
    errorId = 0;
    addGlobalError(error) {
        error.id = this.errorId++;
        this.errorMessages.next([...this.errorMessages.value, error]);
        return error.id;
    }
    dismissGlobalErrorById(errorId) {
        this.errorMessages.next(this.errorMessages.value.filter((a) => !(a.id === errorId)));
    }
    dismissGlobalError(error) {
        if (error.id !== undefined) {
            this.dismissGlobalErrorById(error.id);
        }
    }
    updateError(error) {
        this.errorMessages.next(this.errorMessages.value.map((a) => {
            if (a.id === error.id) {
                return error;
            }
            return a;
        }));
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.7", ngImport: i0, type: ErrorService, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.7", ngImport: i0, type: ErrorService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.7", ngImport: i0, type: ErrorService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root',
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3Iuc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NjYy1saWIvc3JjL2xpYi9zZXJ2aWNlL2Vycm9yLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUMzQyxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sTUFBTSxDQUFDOztBQU12QyxNQUFNLE9BQU8sWUFBWTtJQUN2QixhQUFhLEdBQUcsSUFBSSxlQUFlLENBQWlCLEVBQUUsQ0FBQyxDQUFDO0lBQ3hELE9BQU8sR0FBRyxDQUFDLENBQUM7SUFFWixjQUFjLENBQUMsS0FBbUI7UUFDaEMsS0FBSyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDMUIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDOUQsT0FBTyxLQUFLLENBQUMsRUFBRSxDQUFDO0lBQ2xCLENBQUM7SUFFRCxzQkFBc0IsQ0FBQyxPQUFlO1FBQ3BDLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUNyQixJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLE9BQU8sQ0FBQyxDQUFDLENBQzVELENBQUM7SUFDSixDQUFDO0lBRUQsa0JBQWtCLENBQUMsS0FBbUI7UUFDcEMsSUFBSSxLQUFLLENBQUMsRUFBRSxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQzNCLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDeEMsQ0FBQztJQUNILENBQUM7SUFFRCxXQUFXLENBQUMsS0FBbUI7UUFDN0IsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQ3JCLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO1lBQ2pDLElBQUksQ0FBQyxDQUFDLEVBQUUsS0FBSyxLQUFLLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3RCLE9BQU8sS0FBSyxDQUFDO1lBQ2YsQ0FBQztZQUNELE9BQU8sQ0FBQyxDQUFDO1FBQ1gsQ0FBQyxDQUFDLENBQ0gsQ0FBQztJQUNKLENBQUM7dUdBL0JVLFlBQVk7MkdBQVosWUFBWSxjQUZYLE1BQU07OzJGQUVQLFlBQVk7a0JBSHhCLFVBQVU7bUJBQUM7b0JBQ1YsVUFBVSxFQUFFLE1BQU07aUJBQ25CIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgQmVoYXZpb3JTdWJqZWN0IH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBFcnJvck1lc3NhZ2UgfSBmcm9tICcuLi9tb2RlbHMvZXJyb3ItbWVzc2FnZSc7XG5cbkBJbmplY3RhYmxlKHtcbiAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxufSlcbmV4cG9ydCBjbGFzcyBFcnJvclNlcnZpY2Uge1xuICBlcnJvck1lc3NhZ2VzID0gbmV3IEJlaGF2aW9yU3ViamVjdDxFcnJvck1lc3NhZ2VbXT4oW10pO1xuICBlcnJvcklkID0gMDtcblxuICBhZGRHbG9iYWxFcnJvcihlcnJvcjogRXJyb3JNZXNzYWdlKTogbnVtYmVyIHtcbiAgICBlcnJvci5pZCA9IHRoaXMuZXJyb3JJZCsrO1xuICAgIHRoaXMuZXJyb3JNZXNzYWdlcy5uZXh0KFsuLi50aGlzLmVycm9yTWVzc2FnZXMudmFsdWUsIGVycm9yXSk7XG4gICAgcmV0dXJuIGVycm9yLmlkO1xuICB9XG5cbiAgZGlzbWlzc0dsb2JhbEVycm9yQnlJZChlcnJvcklkOiBudW1iZXIpOiB2b2lkIHtcbiAgICB0aGlzLmVycm9yTWVzc2FnZXMubmV4dChcbiAgICAgIHRoaXMuZXJyb3JNZXNzYWdlcy52YWx1ZS5maWx0ZXIoKGEpID0+ICEoYS5pZCA9PT0gZXJyb3JJZCkpXG4gICAgKTtcbiAgfVxuXG4gIGRpc21pc3NHbG9iYWxFcnJvcihlcnJvcjogRXJyb3JNZXNzYWdlKTogdm9pZCB7XG4gICAgaWYgKGVycm9yLmlkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuZGlzbWlzc0dsb2JhbEVycm9yQnlJZChlcnJvci5pZCk7XG4gICAgfVxuICB9XG5cbiAgdXBkYXRlRXJyb3IoZXJyb3I6IEVycm9yTWVzc2FnZSk6IHZvaWQge1xuICAgIHRoaXMuZXJyb3JNZXNzYWdlcy5uZXh0KFxuICAgICAgdGhpcy5lcnJvck1lc3NhZ2VzLnZhbHVlLm1hcCgoYSkgPT4ge1xuICAgICAgICBpZiAoYS5pZCA9PT0gZXJyb3IuaWQpIHtcbiAgICAgICAgICByZXR1cm4gZXJyb3I7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGE7XG4gICAgICB9KVxuICAgICk7XG4gIH1cbn1cbiJdfQ==