import type { User } from '@/model/user';

export class UserDto {
  id: User['id'];
  sessionId: string;

  constructor(user: Pick<User, 'id'>, sessionId: string) {
    this.id = user.id;
    this.sessionId = sessionId;
  }
}
