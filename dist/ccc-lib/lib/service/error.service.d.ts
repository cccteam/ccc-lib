import { BehaviorSubject } from 'rxjs';
import { ErrorMessage } from '../models/error-message';
import * as i0 from "@angular/core";
export declare class ErrorService {
    errorMessages: BehaviorSubject<ErrorMessage[]>;
    errorId: number;
    addGlobalError(error: ErrorMessage): number;
    dismissGlobalErrorById(errorId: number): void;
    dismissGlobalError(error: ErrorMessage): void;
    updateError(error: ErrorMessage): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<ErrorService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<ErrorService>;
}
