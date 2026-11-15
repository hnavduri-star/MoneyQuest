import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb } from './db.js';
import { createApp } from './app.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const port = Number(process.env.PORT) || 4100;
const db = openDb(process.env.DB_FILE || join(root, 'data', 'moneyquest.db'));
const app = createApp({ db, clientDist: join(root, 'client', 'dist') });
app.listen(port, () => console.log(`MoneyQuest server on http://localhost:${port}`));
