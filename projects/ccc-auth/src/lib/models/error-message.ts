export enum AlertLevel {
  ERROR = 'warn',
  INFO = 'accent',
}

export interface ErrorMessage {
  id?: number;
  duration?: number;
  message: string;
  link: string;
  level: AlertLevel;
}
