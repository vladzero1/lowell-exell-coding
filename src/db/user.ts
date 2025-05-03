import { JSONFilePreset,  } from "lowdb/node";
import { Client } from "../client.js";
import { User } from "../user.js";

export async function GetUserData(): Promise<User[]> {
    const db = await JSONFilePreset("db.json", {
        clients: [] as Client[],
        users: [] as User[],
    });

    const users = db.data.users as User[];
    return users
}

export async function UpdateUserData(users: User[]): Promise<User[]> {
    const db = await JSONFilePreset("db.json", {
        clients: [] as Client[],
        users: [] as User[],
    });

    db.data.users = users
    db.write()
    return users
}