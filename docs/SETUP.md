# הגדרה והפעלה

הפרויקט ב-Firebase (`market-list-3a1c8`), ב-GitHub (`Tamirlv/market-list`) וב-Vercel (`market-list`) כבר קיימים. נשארו רק הצעדים הבאים.

## 1. פריסת חוקי האבטחה של Firestore
מתוך תיקיית הפרויקט:

```
npx firebase login
npx firebase deploy --only firestore:rules --project prod
```

## 2. פריסת האתר (Vercel)
- Vercel מפרסם אוטומטית בכל push ל-`main` ב-`Tamirlv/market-list`.
- הגדרות הפרויקט ב-Vercel צריכות להיות: Framework Preset = **Vite**, Output Directory = **dist**, Build Command = `npm run build` (ברירות המחדל). כדאי לוודא ב-Settings → General.
- אין צורך במשתני סביבה: הגדרות ה-Firebase הציבוריות נמצאות בקובץ `.env.production` שנשמר ב-git.
- הכתובת: https://market-list-silk.vercel.app

## 3. הרשאות OAuth ב-Google Cloud (חובה)
בלי זה ההתחברות באייפון תיכשל עם `redirect_uri_mismatch`.
1. פתחו: https://console.cloud.google.com/apis/credentials?project=market-list-3a1c8
2. תחת OAuth 2.0 Client IDs פתחו את הלקוח **"Web client (auto created by Google Service)"**.
3. ב-Authorized JavaScript origins הוסיפו: `https://market-list-silk.vercel.app`
4. ב-Authorized redirect URIs הוסיפו: `https://market-list-silk.vercel.app/__/auth/handler`
5. לחצו Save.

## 4. התקנה באייפון
פתחו את הכתובת ב-**Safari** → כפתור השיתוף → **"הוסף למסך הבית"**.

## 5. פיתוח מקומי
- `npm run dev` — שרת פיתוח
- `npm test` — בדיקות יחידה
- `npm run test:emulator` — בדיקות מול אמולטור Firebase (דורש Java)
- `npm run icons` — יצירה מחדש של סמלי ה-PNG מתוך `public/icons/icon.svg`

## פתרון תקלות
אם ההתחברות באייפון נכשלת:
- בדקו ב-Firebase Console → Authentication → Settings → Authorized domains שהדומיין `market-list-silk.vercel.app` ברשימה.
- בדקו שהכתובת `https://market-list-silk.vercel.app/__/auth/handler` נטענת (לא מחזירה 404 ולא את דף האפליקציה).
