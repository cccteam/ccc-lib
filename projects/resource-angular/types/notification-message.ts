export enum AlertType {
  ERROR = 'warn',
  IDLE = 'idle',
  INFO = 'accent',
  SUCCESS = 'success',
}

export interface CreateNotificationMessage {
  duration?: number;
  message: string;
  link: string;
  type: AlertType;
}

export interface NotificationMessage {
  id: number;
  duration?: number;
  message: string;
  link: string;
  type: AlertType;
}
