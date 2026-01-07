export class ErrorResponse {
  statusCode: number; // HTTP status code
  message: string; // Error message
  details?: any; // Optional additional details about the error

  constructor(statusCode: number, message: string, details?: any) {
    this.statusCode = statusCode;
    this.message = message;
    this.details = details;
  }
}
