import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { ErrorMessage } from '../../models/error-message';
import { ErrorService } from '../../service/error.service';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
  standalone: true,
  imports: [MatIconModule, MatButtonModule, CommonModule, RouterModule],
})
export class AlertComponent implements OnInit {
  @Input({ required: true }) error!: ErrorMessage;
  @Output() dismiss = new EventEmitter();

  errors = inject(ErrorService);
  ngOnInit(): void {
    if (this.error.duration === undefined) {
      this.error.duration = 30000;
    }

    setTimeout(() => {
      this.dismissAlert();
    }, this.error.duration);
  }

  dismissAlert(): void {
    if (this.error.id !== undefined) {
      this.errors.dismissGlobalError(this.error);
    }
  }
}
