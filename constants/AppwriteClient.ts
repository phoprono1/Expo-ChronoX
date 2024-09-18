import {
  Client,
  Databases,
  Account,
  Avatars,
  Storage,
} from "react-native-appwrite";
import { config } from "./Config";

const client = new Client();
const storage = new Storage(client);

client
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setPlatform(config.platform);

const databases = new Databases(client);
const account = new Account(client);
const avatars = new Avatars(client);

export { client, databases, account, avatars, storage };
