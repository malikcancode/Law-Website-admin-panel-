# Law Website Admin Panel

Next.js admin dashboard for consultation leads and site settings.

## Run locally

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

Set `NEXT_PUBLIC_API_URL` to your backend (default `http://localhost:5000`).

Sign in with the admin account created by the API (see backend `.env` `ADMIN_EMAIL` / `ADMIN_PASSWORD`).
