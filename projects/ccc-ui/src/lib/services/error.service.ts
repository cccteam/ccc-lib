import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ErrorMessage } from '../models/error-message';

@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  errorMessages = new BehaviorSubject<ErrorMessage[]>([]);
  errorId = 0;

  addGlobalError(error: ErrorMessage): number {
    error.id = this.errorId++;
    this.errorMessages.next([...this.errorMessages.value, error]);
    return error.id;
  }

  dismissGlobalErrorById(errorId: number): void {
    this.errorMessages.next(this.errorMessages.value.filter((a) => !(a.id === errorId)));
  }

  dismissGlobalError(error: ErrorMessage): void {
    if (error.id !== undefined) {
      this.dismissGlobalErrorById(error.id);
    }
  }

  updateError(error: ErrorMessage): void {
    this.errorMessages.next(
      this.errorMessages.value.map((a) => {
        if (a.id === error.id) {
          return error;
        }
        return a;
      }),
    );
  }
}
