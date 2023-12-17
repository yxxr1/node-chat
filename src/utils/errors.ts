export class HttpError extends Error {
  name = 'HttpError';
  status = 0;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
