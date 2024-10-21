import { EventEmitter, OnInit } from '@angular/core';
import { ErrorMessage } from '../../models/error-message';
import { ErrorService } from '../../service/error.service';
import * as i0 from "@angular/core";
export declare class AlertComponent implements OnInit {
    error: ErrorMessage;
    dismiss: EventEmitter<any>;
    errors: ErrorService;
    ngOnInit(): void;
    dismissAlert(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<AlertComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<AlertComponent, "app-alert", never, { "error": { "alias": "error"; "required": true; }; }, { "dismiss": "dismiss"; }, never, never, true, never>;
}
