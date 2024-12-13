export enum AlertLevel {
  ERROR = 'warn',
  INFO = 'accent',
  SUCCESS = 'success',
}

export interface CreateNotificationMessage {
  duration?: number;
  message: string;
  link: string;
  level: AlertLevel;
}

export interface NotificationMessage {
  id: number;
  duration?: number;
  message: string;
  link: string;
  level: AlertLevel;
}
