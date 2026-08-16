# SmartLMS — Frontend

Next.js 16 (App Router) + React 19 + Tailwind v4 + shadcn/ui.
Ye zip 1 (auth + router structure) aur zip 2 (assignments / exams / quizzes /
projects module) ka merged version hai.

## Chalane ka tareeqa

### 1. Backend (FastAPI + MongoDB)

```bash
cd backend
python -m venv venv
venv\Scripts\activate         # Windows
# source venv/bin/activate    # macOS / Linux
pip install -r requirements.txt
```

`backend/.env` me MongoDB ki details daalo:

```
MONGO_URL=mongodb://localhost:27017
DATABASE_NAME=smartlms
```

Dummy users banane ke liye ek dafa:

```bash
python seed.py
```

Server chalao:

```bash
uvicorn main:app --reload      # http://localhost:8000
```

### 2. Frontend

```bash
cd Smart-LMS-Frontend
npm install
npm run dev                    # http://localhost:3000
```

`.env.local` pehle se maujood hai:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Test logins (seed.py se)

| Role       | Email                      | Password       |
| ---------- | -------------------------- | -------------- |
| Admin      | admin@smartlms.com         | admin123       |
| Instructor | instructor@smartlms.com    | instructor123  |
| Student    | student@smartlms.com       | student123     |

## Structure

```
src/
  app/
    (auth)/          login, register
    (dashboard)/     layout = AppShell + auth guard
      admin/         dashboard, users, courses, analytics
      instructor/    dashboard, courses, assignments, exams, quizzes,
                     projects, submissions, gradebook, students
      student/       dashboard, courses, assignments, exams, quizzes,
                     projects, grades, insights
      profile/  settings/  notifications/
  components/        ui (shadcn), layout (shell/sidebar/navbar), shared
  features/          instructor + student ke bade feature components
  data/              mock/seed arrays — API aane par yahi replace karna hai
  lib/api/           backend calls (client.ts me Bearer token lagta hai)
  lib/selectors.ts   data/ par derived queries
  context/auth/      AuthContext (login, logout, session restore)
  middleware.ts      cookie `role` par route protection
```

## Aage kya karna hai

- `src/data/*.ts` abhi khali arrays hain. Backend ready hone par inhe
  `src/lib/api/*` calls se replace karo — `lib/selectors.ts` ka shape wahi
  rakhna, taake pages na tooten.
- Backend me abhi sirf `POST /auth/login` hai. Frontend jo aur endpoints
  expect karta hai: `/auth/me`, `/auth/register`, `/courses`, `/users`,
  `/assignments`, `/enrollments`, `/submissions`.
- Next 16 me `middleware.ts` deprecated hai — baad me `proxy.ts` rename kar lena.
