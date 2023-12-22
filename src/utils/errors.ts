export class HttpError extends Error {
  name = 'HttpError';
  status = 0;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export class ChatNotFound extends HttpError {
  name = 'ChatNotFound';

  constructor() {
    super(404, 'Chat not found');
  }
}

export class NotJoinedChat extends HttpError {
  name = 'NotJoinedChat';

  constructor() {
    super(403, 'Not joined to this chat');
  }
}
