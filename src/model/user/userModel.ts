import type { Collection } from 'mongodb';
import { initDb } from '../db';
import type { UserRecord, UserSettings, UserWithoutCredentials } from './types';

const TABLE_NAME = 'users';

export class UserModel {
  collection: Collection<UserRecord>;

  constructor() {
    const db = initDb();
    const usersCollection = db.collection<UserRecord>(TABLE_NAME);

    usersCollection.createIndex({ id: 1 }, { unique: true });

    this.collection = usersCollection;
  }

  async checkUsername(username: string) {
    return !!(await this.collection.findOne({ username }, { projection: { id: 1 } }));
  }

  async createUser(user: UserRecord) {
    return this.collection.insertOne(user);
  }

  async getUserRecord(username: string) {
    return this.collection.findOne<UserRecord>({ username });
  }

  async updateUser(
    id: string,
    { settings, ...data }: Partial<Omit<UserRecord, 'id' | 'settings'> & { settings: Partial<UserRecord['settings']> }>,
  ) {
    const settingsUpdate =
      settings &&
      Object.entries(settings).reduce<Record<string, UserSettings[keyof UserSettings]>>((acc, [key, value]) => {
        acc[`settings.${key}`] = value;
        return acc;
      }, {});

    return this.collection.updateOne({ id }, { $set: { ...data, ...settingsUpdate } });
  }

  async getUser(id: string) {
    return this.collection.findOne<UserWithoutCredentials>({ id }, { projection: { _id: 0, passwordHash: 0 } });
  }
}

export const userModel = new UserModel();
