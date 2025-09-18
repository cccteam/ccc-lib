import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { NotificationMessage } from '../types';
import { NotificationService } from '../ui-notification-service';

@Component({
  selector: 'ccc-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
  imports: [MatIconModule, MatButtonModule, CommonModule, RouterModule],
})
export class AlertComponent implements OnInit {
  @Input({ required: true }) error!: NotificationMessage;
  @Output() dismiss = new EventEmitter();

  errors = inject(NotificationService);
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
      this.errors.dismissGlobalNotification(this.error);
    }
  }
}
