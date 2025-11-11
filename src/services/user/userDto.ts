import type { User } from '@model/user';

export class UserDto {
  id: User['id'];

  constructor(user: Pick<User, 'id'>) {
    this.id = user.id;
  }
}
