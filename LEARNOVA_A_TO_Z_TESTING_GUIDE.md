# Learnova AI — A-to-Z Local Testing Guide

**Version:** Local Windows/MySQL testing edition  
**Tester:** ____________________  
**Test date:** ____________________  
**Application address:** `http://localhost:3000`  
**MySQL database:** `novamind_ai`

This document is a practical checklist for testing the complete Learnova website on your own Windows computer. Complete the tests in order, record **Pass**, **Fail**, or **Blocked** next to every test, and use the defect-report form at the end whenever something differs from the expected result.

> **Important:** Test with at least two different local accounts. Learnova identifies a local account by its email address. The same email should return to the same private data; a different email should never see the first account’s data.

---

## 1. Test status legend and evidence rules

| Status | Meaning | What to record |
|---|---|---|
| **Pass** | Actual behaviour exactly matches the expected result. | Date and your initials. |
| **Fail** | The feature works incorrectly, displays the wrong result, or does nothing. | A defect-report ID, screenshot, exact input, and observed output. |
| **Blocked** | You cannot perform the test because of setup, login, MySQL, or another earlier problem. | The blocking error and the test number that caused it. |
| **Not tested** | You have not performed the test yet. | Leave blank until tested. |

For each failed test, take a screenshot that includes the browser address bar if possible. Do not share passwords, your `.env` file, or the contents of any session cookie.

---

## 2. Before testing: required local setup

Complete these checks before opening Learnova.

| Check | Action | Expected result | Status / notes |
|---|---|---|---|
| P-01 | Ensure MySQL Server is running. In **PowerShell as Administrator**, run `Get-Service *mysql*`. | A MySQL service, commonly `MySQL80`, has status `Running`. | |
| P-02 | In MySQL Shell, run `\connect root@localhost:3306`, enter the root password, then run `\sql`. | The prompt changes to SQL mode with no connection error. | |
| P-03 | Run `USE novamind_ai;` followed by `SHOW TABLES;`. | The database name is accepted. You can see Learnova tables after migrations are applied. | |
| P-04 | In VS Code, confirm that `.env` exists at the root of the Learnova project. | A hidden `.env` file exists beside `package.json`. | |
| P-05 | Check this exact `.env` line. | `DATABASE_URL=mysql://novamind_user:NovaMind2026@127.0.0.1:3306/novamind_ai` | |
| P-06 | Check these local-mode lines in `.env`. | `LOCAL_DEV_BYPASS_AUTH=true` and `VITE_LOCAL_DEV_BYPASS_AUTH=true` | |
| P-07 | Run `pnpm install` once in the VS Code terminal. | The command finishes with `Done` and no installation error. | |
| P-08 | If `SHOW TABLES;` did not show `users`, run `pnpm drizzle-kit migrate` once. | Migration completes successfully; `SHOW TABLES;` then includes `users`, `tasks`, `notes`, and other Learnova tables. | |
| P-09 | Run `pnpm dev`. | The terminal reports a local server address, normally `http://localhost:3000/`. | |

### 2.1 Test accounts to use

Use these example accounts only for testing. You may replace the names and emails, but keep the two emails different.

| Account | Name to enter | Email to enter | Purpose |
|---|---|---|---|
| **Account A** | Asha Test | `asha.test@example.local` | Create data and confirm it persists. |
| **Account B** | Ravi Test | `ravi.test@example.local` | Confirm Account A’s private data is not visible. |

---

## 3. Local sign-in, landing page, and logout

### 3.1 Marketing landing page

| ID | Steps and test input | Expected result | Status / notes |
|---|---|---|---|
| A-01 | Open `http://localhost:3000`. | The Learnova landing page opens with the warm sun logo, **Sign in**, and **Begin learning** buttons. | |
| A-02 | Scroll down slowly through the landing page. | Content sections reveal smoothly as they enter view. Text remains readable and no section overlaps another. | |
| A-03 | Click the Learnova logo in the header. | You remain on, or return to, the landing page. | |
| A-04 | Click **Begin learning**. | A dialog opens titled **Choose who is studying.** It contains Name and Email fields. | |
| A-05 | Close the dialog using the × button, then reopen it with **Sign in**. | The dialog closes and reopens correctly. | |

### 3.2 Account A sign-in and dashboard handoff

| ID | Steps and test input | Expected result | Status / notes |
|---|---|---|---|
| A-06 | In the dialog enter Name: `Asha Test`, Email: `asha.test@example.local`. Click **Enter your workspace**. | The page navigates to `/dashboard`. The dashboard shows Asha’s name or initial. | |
| A-07 | Refresh the dashboard with `Ctrl+R`. | You remain signed in as Account A and return to the dashboard; you are not sent back to the landing page. | |
| A-08 | Close the browser tab, reopen `http://localhost:3000`. | You remain signed in as Account A until you explicitly log out. | |
| A-09 | Use the dashboard **Logout** action. | You return to the Learnova landing page. The dashboard is no longer visible. | |
| A-10 | Press the browser Back button after logout. | You must not regain the authenticated workspace without signing in again. | |

### 3.3 Account B sign-in and data isolation

| ID | Steps and test input | Expected result | Status / notes |
|---|---|---|---|
| A-11 | From the landing page, click **Begin learning**. Enter Name: `Ravi Test`, Email: `ravi.test@example.local`. | You reach the dashboard as Account B. | |
| A-12 | Check the Tasks, Notes, Documents, Plans, Flashcards, Calendar, and Analytics sections before creating Account B data. | Account B does not show Account A’s test data. New sections can be empty. | |
| A-13 | Log out, sign in again with `asha.test@example.local`. | Account A’s own saved data returns, while Account B’s data remains hidden. | |

> If A-06 remains on the landing page, check that MySQL Server is running and that both local-mode lines are set to `true` in `.env`. Stop the server with `Ctrl+C`, then run `pnpm dev` again. If the account dialog displays a MySQL warning, use the database checks in Section 15.

---

## 4. Dashboard and navigation

| ID | Steps | Expected result | Status / notes |
|---|---|---|---|
| B-01 | Sign in as Account A and open the dashboard. | The dashboard loads without a blank screen, endless spinner, or error toast. | |
| B-02 | Verify the left navigation and mobile navigation, if applicable. | You can reach Dashboard, Tasks, Notes, Assistant, Documents, Planner, Quiz, Flashcards, Summarizer, Calendar, Analytics, and Settings. | |
| B-03 | Click each navigation item once. | The correct page title/content appears, and the selected navigation item is visibly active. | |
| B-04 | Use a dashboard quick action, such as creating a task or opening a learning tool. | The requested tool opens without losing the signed-in account. | |
| B-05 | Resize the browser to a narrow/mobile width, then restore desktop width. | Content remains usable; no important controls become permanently inaccessible. | |

---

## 5. Tasks

Use Account A for all tests in this section.

| ID | Input and steps | Expected result | Status / notes |
|---|---|---|---|
| C-01 | Open **Tasks**. Create a task: Title `Revise DBMS chapter 1`; Category `DBMS`; Priority `High`; Status `Pending`; choose a future deadline. | A new task appears in the list with the entered title, category, priority, and deadline. | |
| C-02 | Create a second task: Title `Read OS scheduling`; Category `Operating Systems`; Priority `Medium`; Status `In progress`. | Both tasks appear and remain distinct. | |
| C-03 | Mark `Revise DBMS chapter 1` complete. | Its status changes to completed, and it appears under the completed filter when that filter is selected. | |
| C-04 | Edit `Read OS scheduling` to `Read OS scheduling algorithms`. | The edited title replaces the old title after saving. | |
| C-05 | Filter by Today, Upcoming, Completed, and All. | Each filter shows only the expected matching tasks. | |
| C-06 | Delete the completed DBMS task. | The task disappears and does not return after refresh. | |
| C-07 | Try to save a task with an empty title. | The form prevents saving and shows validation feedback; no blank task is created. | |
| C-08 | Refresh the browser. | Remaining tasks persist exactly as saved. | |

---

## 6. Notes and note-based learning actions

| ID | Input and steps | Expected result | Status / notes |
|---|---|---|---|
| D-01 | Open **Notes**. Create a note: Title `Normalization revision`; Subject `DBMS`; Tags `normalization, keys`; Content: `1NF removes repeating groups. 2NF removes partial dependency. 3NF removes transitive dependency.` | The note appears in the list with its title, subject, tags, and content. | |
| D-02 | Search for `Normalization`. | The note is found. Search for an unrelated word, such as `thermodynamics`. | The note disappears for the unrelated search. | |
| D-03 | Edit the note by adding `BCNF is stricter than 3NF.` Save it. | The new sentence remains after refresh. | |
| D-04 | Use the note **Summarize** action. | A relevant concise summary is shown or saved according to the page workflow. | |
| D-05 | Use the note question, explain, or flashcard action. | The response is related to normalization and based on the note content. | |
| D-06 | Delete the note. | It disappears from Account A’s list and remains absent after refresh. | |
| D-07 | Sign in as Account B and search notes. | Account B cannot find Account A’s note. | |

---

## 7. AI assistant

| ID | Input and steps | Expected result | Status / notes |
|---|---|---|---|
| E-01 | Open **Assistant**. Send: `Explain primary keys and foreign keys in simple words.` | A relevant study-oriented response appears. A blank or unrelated answer is a failure. | |
| E-02 | Send: `Create a three-day plan to revise DBMS.` | The answer gives a usable multi-day study plan. | |
| E-03 | Send: `Quiz me on normalization with three questions.` | The response provides three meaningful questions about normalization. | |
| E-04 | Use a suggested prompt button. | The prompt sends successfully and a response appears. | |
| E-05 | If attachment upload is available, attach a small `.txt` file containing `OSI has seven layers.` Ask `What does this say?` | The assistant acknowledges or uses the supplied text. | |
| E-06 | Clear the conversation, if a clear-chat control is visible. | Previous messages are removed according to the confirmation behaviour. | |
| E-07 | Refresh the page. | Conversation history behaves as indicated by the product; it must not show another user’s messages. | |

---

## 8. Documents

Prepare a small text file named `dbms-test.txt` with this content:

```text
Normalization organizes database tables to reduce redundancy. A primary key uniquely identifies each row. A foreign key creates a relationship between tables.
```

| ID | Input and steps | Expected result | Status / notes |
|---|---|---|---|
| F-01 | Open **Documents** and upload `dbms-test.txt`. | The file appears with its filename and upload state. | |
| F-02 | Open the document or use the available analysis action. | Extracted content/analysis relates to normalization, primary keys, and foreign keys. | |
| F-03 | Use document summary, question, flashcard, or explanation actions. | Results are relevant to the uploaded text. | |
| F-04 | Attempt to upload an unsupported file type, for example `.exe`. | Upload is rejected with a clear validation message. | |
| F-05 | Attempt to upload a very large unsupported/invalid file. | The application rejects it safely without freezing the page. | |
| F-06 | Refresh the browser. | The permitted uploaded document remains listed for Account A. | |
| F-07 | Sign in as Account B. | Account B cannot see or open Account A’s uploaded document. | |

---

## 9. Study planner

| ID | Input and steps | Expected result | Status / notes |
|---|---|---|---|
| G-01 | Open **Planner**. Create a plan using Subject `DBMS`, goal `Prepare for a DBMS test`, and a future deadline. | A plan is generated/saved with a coherent schedule or set of steps. | |
| G-02 | Mark one plan topic/step complete. | The visible progress updates. | |
| G-03 | Edit the first focus/topic, if edit is available. | The saved plan displays the new text. | |
| G-04 | Use **Regenerate**. | The plan refreshes without creating a duplicate unrelated plan. | |
| G-05 | Refresh the browser. | The saved plan and completion state persist. | |
| G-06 | Sign in as Account B. | Account B cannot see Account A’s plan. | |

---

## 10. Quiz

| ID | Input and steps | Expected result | Status / notes |
|---|---|---|---|
| H-01 | Open **Quiz**. Generate a quiz for `DBMS normalization`. | Questions are related to normalization and answer options are visible. | |
| H-02 | Answer every question, deliberately choosing at least one wrong answer. Submit or finish the quiz. | A result/score and explanations or feedback appear. | |
| H-03 | Generate another quiz for the same topic. | Questions should be meaningful; a completely duplicated question set should be recorded as a potential issue. | |
| H-04 | Check quiz history/performance where shown. | The completed attempt contributes to the displayed learning data. | |
| H-05 | Refresh the page. | Completed quiz history persists for Account A only. | |

---

## 11. Flashcards

| ID | Input and steps | Expected result | Status / notes |
|---|---|---|---|
| I-01 | Open **Flashcards**. Generate cards for `DBMS keys`. | Cards contain terms/questions and relevant answers. | |
| I-02 | Flip at least one card. | The card changes between prompt and answer without a layout error. | |
| I-03 | Mark one card **Known** and another **Review again**. | Revision metrics update: Known, Review again, and revision progress. | |
| I-04 | Refresh the page. | The Known/Review states remain saved. | |
| I-05 | Filter or review cards again, if controls are available. | The saved status controls still work and do not reset unexpectedly. | |
| I-06 | Sign in as Account B. | Account B does not see Account A’s flashcards or revision status. | |

---

## 12. Summarizer

| ID | Input and steps | Expected result | Status / notes |
|---|---|---|---|
| J-01 | Open **Summarizer**. Paste: `A primary key uniquely identifies a row. A foreign key links rows between related tables. Normalization reduces duplication.` Choose a short summary. | A short, coherent summary is generated. | |
| J-02 | Choose medium and detailed output options for the same source. | The longer options contain more detail than the short summary. | |
| J-03 | Use copy. Paste into Notepad. | The copied text matches the generated summary. | |
| J-04 | Use download, if available. | A readable text file downloads. | |
| J-05 | Use save-to-notes, if available. | A new note appears with the generated summary and persists after refresh. | |
| J-06 | Submit empty text. | The page prevents the request or displays clear validation; it must not produce a confusing blank output. | |

---

## 13. Calendar

| ID | Input and steps | Expected result | Status / notes |
|---|---|---|---|
| K-01 | Open **Calendar**. Create event: Title `DBMS revision`; Category `Study`; choose tomorrow; Duration `60` minutes; Notes `Review normalization.` | The event appears on the appropriate day/week and agenda. | |
| K-02 | Navigate to the next week and back to today. | Week controls update the displayed dates correctly and Today returns to the current week. | |
| K-03 | Create an Exam or Deadline event. | It uses the correct category style/label and date. | |
| K-04 | Delete an event. | The event disappears and stays deleted after refresh. | |
| K-05 | Complete a task with a deadline. | Where supported, the task/deadline appears consistently in calendar information. | |
| K-06 | Sign in as Account B. | Account B does not see Account A’s calendar events. | |

---

## 14. Analytics, profile, and settings

### 14.1 Analytics

| ID | Steps | Expected result | Status / notes |
|---|---|---|---|
| L-01 | As Account A, create at least one task, quiz attempt, flashcard status update, and/or study session. Open **Analytics**. | Metrics, charts, subject performance, streaks, and insight areas load without errors. | |
| L-02 | Compare analytics before and after completing a task or quiz. | Relevant completion/performance data updates after refresh or after the normal page refresh cycle. | |
| L-03 | Sign in as Account B and open Analytics. | Account B’s analytics do not include Account A’s actions. | |

### 14.2 Profile and settings

| ID | Input and steps | Expected result | Status / notes |
|---|---|---|---|
| L-04 | Open **Settings**. Change display name to `Asha Tester`; save. | Updated name appears in the profile/workspace and persists after refresh. | |
| L-05 | Upload a small JPG, PNG, or WEBP profile image under 2 MB. | The avatar updates successfully. | |
| L-06 | Try to upload an unsupported image type or a file over 2 MB. | The upload is rejected with a useful error; the prior avatar is not broken. | |
| L-07 | Change theme, notification, AI response style, or difficulty settings, where available. | Selected settings visibly update and persist after refresh. | |
| L-08 | Log out and sign in as Account B. | Account B has separate profile/settings values. | |

---

## 15. MySQL database verification

These are **read-only** verification commands. Run them in MySQL Shell after `\connect root@localhost:3306` and `\sql`. Do not use `DROP`, `DELETE`, `TRUNCATE`, or `UPDATE` commands while testing.

```sql
USE novamind_ai;
```

### 15.1 Confirm all expected tables

```sql
SHOW TABLES;
```

Expected table names include:

```text
users
tasks
notes
documents
studyPlans
chatMessages
quizzes
flashcards
calendarEvents
activityLogs
userSettings
```

### 15.2 Confirm local users were stored

```sql
SELECT id, name, email, loginMethod, lastSignedIn
FROM users
ORDER BY id DESC;
```

Expected result: You can see separate rows for `asha.test@example.local` and `ravi.test@example.local` after they have signed in.

### 15.3 Confirm task ownership

```sql
SELECT t.id, t.title, t.status, u.name, u.email
FROM tasks AS t
JOIN users AS u ON u.id = t.userId
ORDER BY t.id DESC;
```

Expected result: Tasks created while signed in as Asha are joined to Asha’s email, not Ravi’s email.

### 15.4 Confirm note ownership

```sql
SELECT n.id, n.title, n.subject, u.email
FROM notes AS n
JOIN users AS u ON u.id = n.userId
ORDER BY n.id DESC;
```

### 15.5 Confirm document ownership

```sql
SELECT d.id, d.filename, d.createdAt, u.email
FROM documents AS d
JOIN users AS u ON u.id = d.userId
ORDER BY d.id DESC;
```

### 15.6 Confirm planner, quiz, flashcard, and calendar ownership

```sql
SELECT p.id, p.subject, u.email FROM studyPlans AS p JOIN users AS u ON u.id = p.userId ORDER BY p.id DESC;
SELECT q.id, q.topic, u.email FROM quizzes AS q JOIN users AS u ON u.id = q.userId ORDER BY q.id DESC;
SELECT f.id, f.question, f.status, u.email FROM flashcards AS f JOIN users AS u ON u.id = f.userId ORDER BY f.id DESC;
SELECT c.id, c.title, c.category, c.startsAt, u.email FROM calendarEvents AS c JOIN users AS u ON u.id = c.userId ORDER BY c.id DESC;
```

If MySQL reports an unknown column for a query, take a screenshot of the error and report it using the form in Section 18. Do not guess or change the schema yourself.

---

## 16. Reliability, validation, and visual checks

| ID | Test | Expected result | Status / notes |
|---|---|---|---|
| M-01 | Refresh each major page: Tasks, Notes, Documents, Planner, Quiz, Flashcards, Calendar, Analytics, Settings. | No blank white page, uncontrolled error, or endless loading state. | |
| M-02 | Restart the app: press `Ctrl+C` in VS Code, then run `pnpm dev` again. | Landing page opens after restart. Sign in with Account A and confirm saved data persists. | |
| M-03 | Try invalid/empty form values across Tasks, Notes, Calendar, planner, and profile name. | Forms prevent invalid save actions and show understandable feedback. | |
| M-04 | Use browser zoom at 80%, 100%, and 125%. | Text and buttons remain usable without critical overlap. | |
| M-05 | Test on a narrow browser window. | Navigation and page controls remain reachable. | |
| M-06 | Check the browser tab. | Title and icon show Learnova branding. | |
| M-07 | Leave a page while a non-critical request is loading, then return. | The application remains stable and does not lose the current account. | |

---

## 17. Final release checklist

Only mark the project ready after every relevant test above has a Pass status or an accepted documented limitation.

| Final check | Expected result | Status |
|---|---|---|
| All pre-flight checks pass. | MySQL and Learnova start reliably. | |
| Account A can sign in and use all core features. | Data saves and persists after refresh/restart. | |
| Logout works. | Landing page appears and dashboard cannot be accessed as the former account. | |
| Account B is separate. | Account B never sees Account A’s private data. | |
| MySQL verification passes. | Rows belong to the correct user IDs/emails. | |
| No high-severity failure remains. | No blockage of sign-in, saving, navigation, or data isolation. | |

---

## 18. Copy-and-send failure report form

When any test fails, copy this entire form into your message, fill it in, and attach screenshots. This gives the exact information needed to reproduce and fix the issue quickly.

```text
LEARNOVA DEFECT REPORT

Test ID: [for example: C-03]
Date and time:
Account used: [Asha Test / Ravi Test / other email]
Page/URL: [for example: http://localhost:3000/app/tasks]
Browser: [Chrome/Edge + version if known]
Window type: [desktop / narrow mobile-sized window]

Precondition:
[What was already created or selected before the problem?]

Exact steps performed:
1.
2.
3.

Exact input entered:
[Copy the task title, note content, email, topic, file name, etc. Do not include passwords or .env contents.]

Expected result:
[What this guide said should happen]

Actual result:
[What actually happened, including exact visible error text]

Does it happen after refresh? [Yes / No]
Does it happen after pnpm dev restart? [Yes / No / Not tested]
Does it happen for the second user too? [Yes / No / Not tested]

Database check performed, if relevant:
[Paste only the SELECT command result or exact MySQL error. Do not paste passwords.]

Screenshot/video attached: [Yes / No]
Browser console error attached, if available: [Yes / No]
Severity: [Blocker / High / Medium / Low]
```

### 18.1 Severity guide

| Severity | Use it when | Example |
|---|---|---|
| **Blocker** | You cannot start, sign in, reach the dashboard, or access the app at all. | Begin learning remains on landing page. |
| **High** | User data does not save, disappears, mixes between accounts, or a major feature cannot be used. | Account B sees Account A’s task. |
| **Medium** | A feature works partly but produces the wrong result or poor feedback. | A calendar event saves but appears on the wrong date. |
| **Low** | Visual, wording, alignment, or minor convenience problem. | A label is misspelled or a button alignment is off. |

---

## 19. Helpful troubleshooting commands

Run these commands only in the appropriate place.

| Situation | Where to run | Command |
|---|---|---|
| Confirm MySQL service | PowerShell as Administrator | `Get-Service *mysql*` |
| Start common MySQL service | PowerShell as Administrator | `Start-Service MySQL80` |
| Install project dependencies | VS Code terminal in project folder | `pnpm install` |
| Apply tables to a new empty database only | VS Code terminal in project folder | `pnpm drizzle-kit migrate` |
| Start Learnova | VS Code terminal in project folder | `pnpm dev` |
| Run automated tests | VS Code terminal in project folder | `pnpm test` |
| Check TypeScript | VS Code terminal in project folder | `pnpm check` |
| Connect to MySQL | MySQL Shell | `\connect root@localhost:3306` |
| Switch MySQL Shell to SQL mode | MySQL Shell | `\sql` |
| Select Learnova database | MySQL Shell SQL mode | `USE novamind_ai;` |

> Do not use `USE Learnova;` or `USE novamind-ai;`. The correct database name is **`novamind_ai`** with an underscore.

---

## 20. Test session summary

| Area | Passed | Failed | Blocked | Not tested | Notes |
|---|---:|---:|---:|---:|---|
| Setup and MySQL | | | | | |
| Sign-in and logout | | | | | |
| Dashboard and navigation | | | | | |
| Tasks | | | | | |
| Notes | | | | | |
| Assistant | | | | | |
| Documents | | | | | |
| Planner | | | | | |
| Quiz | | | | | |
| Flashcards | | | | | |
| Summarizer | | | | | |
| Calendar | | | | | |
| Analytics and settings | | | | | |
| Account isolation | | | | | |
| Responsive and visual quality | | | | | |

**Overall result:** ☐ Ready to use  ☐ Needs fixes  ☐ Blocked by setup  

**Tester signature/name:** ____________________  
**Date completed:** ____________________
