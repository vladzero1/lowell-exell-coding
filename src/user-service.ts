import {createLRUCacheProvider} from "./lru-cache"
import { nanoid } from "nanoid";
import { ClientRepository } from "./client-repository.js";
import { User } from "./user.js";
import { GetUserData, UpdateUserData} from "./db/user.js";

export class UserService {
  cache = createLRUCacheProvider<User>({ ttl: 100000, itemLimit: 100 });

  public async AddUser(
    firstname: string,
    surname: string,
    email: string,
    dateOfBirth: Date,
    clientId: string
  ): Promise<boolean> {

    // req validation
    // ensure this checking first before we get the db data
    if (!firstname || !surname) {
      return false;
    }
    if (!email) {
      return false;
    }

    // getting data
    const users = await GetUserData()

    const [_, isUserExist] = this.UserIsExistByEmail(users, email)
    if (isUserExist) {
      return false;
    }

    const now = new Date();
    let age = now.getFullYear() - dateOfBirth.getFullYear();

    if (
      now.getMonth() < dateOfBirth.getMonth() ||
      (now.getMonth() === dateOfBirth.getMonth() && now.getDate() < dateOfBirth.getDate())
    ) {
      age--;
    }

    if (age < 21) {
      return false;
    }

    const clientRepository = new ClientRepository();
    const client = await clientRepository.getById(clientId);
    if (!client) {
      console.error("Client not found");
      return false;
    }

    // init the user data
    let user: Partial<User> = {
      id: nanoid(),
      client: client,
      dateOfBirth: dateOfBirth,
      email: email,
      firstname: firstname,
      surname: surname,
    };
    user = this.updateCreditLimit(client.name, user)

    await UpdateUserData(users)

    // ttl and item limit need more specific context for the number
    this.cache.set(email, user)
    
    return true;
  }

  updateCreditLimit(clientName: string, user: Partial<User>): Partial<User> {
    if (clientName == "VeryImportantClient") {
      // Skip credit check
      user.hasCreditLimit = false;
    } else if (clientName == "ImportantClient") {
      // Do credit check and double credit limit
      user.hasCreditLimit = true;
      user.creditLimit = 10000 * 2;
    } else {
      user.hasCreditLimit = true;
      user.creditLimit = 10000;
    }

    return user
  }

  public async UpdateUser(user: User): Promise<boolean> {
    
    if (!user) {
      return false;
    }

    const existingUsers = await GetUserData()

    let u: User | null = null;
    for (let i = 0; i < existingUsers.length; i++) {
      if (existingUsers[i].id === user.id) {
        u = existingUsers[i];
        break;
      }
    }
    if (!u) {
      return false;
    }

    const users: User[] = new Array<User>(user)
    await UpdateUserData(users)
    this.cache.set(user.email, user)

    return true;
  }

  public async GetAllUsers(): Promise<User[]> {
    const users = await GetUserData()

    return users
  }

  public async GetUserByEmail(email: string): Promise<User | null> {
    const userCache = this.cache.get(email)
    if (userCache !== undefined){
      return userCache
    }

    const users = await GetUserData()
    const [user, isUserExist] = this.UserIsExistByEmail(users, email)
    if (!isUserExist) {
      return null;
    }
    return user;
  }

  UserIsExistByEmail(users: User[], email: string): [User | null, boolean] {
    for (let i = 0; i < users.length; i++) {
      if (users[i].email === email) {
        return [users[i], true]
      }
    }

    return [null, false]
  }

  UserIsExistByUserID(users: User[], userID: string): [User | null, boolean] {
    for (let i = 0; i < users.length; i++) {
      if (users[i].id === userID) {
        return [users[i], true]
      }
    }

    return [null, false]
  }

}
