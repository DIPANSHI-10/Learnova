# NovaMind AI — Local End-to-End Test Guide

## 1. Test environment

Before testing, confirm that MySQL is running, `.env` is present, and all migrations have finished. Start the application with `pnpm dev`, then open the local URL shown in the terminal, usually `http://localhost:3000`.

Run these automated checks before manual testing:

```powershell
pnpm test
pnpm check
```

All automated tests should pass. `pnpm test` should report 15 passing tests and `pnpm check` should finish without TypeScript errors.

## 2. Database verification

In MySQL Shell, connect to the NovaMind database and run:

```sql
USE novamind_ai;
SHOW TABLES;
SELECT id, openId, name, email FROM users;
```

After opening the local app once, the `users` query should contain the local developer account from `.env`. The tables should include `users`, `tasks`, `notes`, `documents`, `studyPlans`, `chatMessages`, `quizzes`, `flashcards`, `calendarEvents`, `activityLogs`, and `userSettings`.

## 3. Public site and navigation

Open `http://localhost:3000` in a desktop browser. Confirm that the home page loads without a blank screen, the NovaMind name is visible, the navigation links scroll or navigate correctly, and the primary action opens the protected workspace.

Use every navigation item in the workspace sidebar: Overview, AI Assistant, Study Planner, Tasks, Notes, Documents, Quiz Studio, Flashcards, Summarize, Calendar, Analytics, and Settings. Every item should load a page and must not show an error or empty white screen.

## 4. Dashboard

On Overview, check that the welcome card, metric cards, study rhythm chart area, recommendation, quick actions, task list, and recent notes are visible. Click every quick action. Confirm that each button opens the correct feature page.

Create tasks, notes, a quiz, and a calendar study session during the later sections. Return to Overview and verify that the dashboard counts, recent content, and recommendation update after a refresh.

## 5. Task manager

Create three tasks: one high-priority task with a deadline today, one medium-priority task with a future deadline, and one low-priority task with no deadline. For each task, verify title, category, description, priority, status, and date display correctly.

Test the following actions one by one: edit a task; mark it complete; mark it incomplete again; delete a task; use All, Today, Upcoming, and Completed filters. Confirm that deleted tasks do not return after refreshing the page.

For validation, try to submit a task with an empty title. The browser should prevent submission. Also use a very long title and confirm the layout remains readable.

## 6. Notes and note AI actions

Create two notes with different subjects, tags, and detailed content. Search using a title word and confirm only matching notes remain. Edit a note, refresh, and confirm the edit persists. Delete the second note and confirm it does not return.

Select the remaining note in **NovaMind note actions**. Test all four actions: Summarize, Questions, Flashcards, and Explain simply. Confirm each action produces output. Open Flashcards after choosing Flashcards and confirm a new card set exists.

## 7. AI Assistant

Open AI Assistant. Send a normal study question, such as `Explain database normalization simply.` Confirm that a response appears and remains visible after refreshing the page.

Click each prompt shortcut. Confirm a new response is added each time. Attach a small TXT or PDF study file, wait for its processing message, then ask a question about the attachment. Confirm the response uses the attached context.

Click Clear chat, confirm the confirmation prompt, and confirm the message history disappears after accepting it. Test canceling the confirmation too; messages should remain.

## 8. Document workspace

Upload one small TXT file and one small PDF file. Confirm each appears in the library with filename, size, and date. Select each document and confirm extracted text appears.

For a selected document, test Summarize this, Key topics, Generate questions, Explain simply, and a custom question. Confirm each produces an answer.

Delete one document, refresh the page, and confirm it remains deleted. Try an unsupported file type and a file larger than 5 MB; the system should reject it or show a safe error instead of crashing.

## 9. Study planner

Create a plan with a subject, several topics, an exam date, daily hours, preferred time, and a knowledge level. Confirm the plan appears with days, focus items, duration, and progress.

Click several day-completion boxes and confirm the completion percentage changes. Use Edit and change at least two day focus/duration entries. Confirm the edited plan persists after refresh. Use Regenerate and verify the plan refreshes. Finally, delete a plan and confirm it is removed.

## 10. Quiz studio

Generate a five-question quiz. Select answers for every question, grade it, and confirm the score and explanations appear. Generate a second quiz using a different topic and difficulty. Refresh the page and confirm completed attempts appear in Past attempts.

For validation, try grading before answering every question. The Grade button should stay disabled. Test both correct and incorrect answers to confirm explanations display in either case.

## 11. Flashcards

Generate flashcards from a topic and optional source text. Test flip, previous, next, Review again, and I know this. Mark at least one card Known and one Review again.

Confirm that the Known count, Review again count, and Revision progress metric update. Refresh the page and confirm card status remains saved.

## 12. Summarizer

Paste a multi-paragraph study passage. Generate Short, Medium, and Detailed summaries. Confirm each result appears and differs in length or level of detail.

Test Copy by pasting into Notepad. Test Download and open the downloaded Markdown file. Test Save as note, then visit Notes and confirm the summary is available there.

## 13. Calendar and analytics

Create a study session, an exam, a deadline, and another event with different dates. Confirm they appear both in the agenda and the week-at-a-glance view. Use previous week, next week, and Today controls.

Delete one event and refresh to confirm removal. Then visit Analytics. Confirm study time, scheduled study, task completion, quiz average, streak, trend chart, and subject-focus chart display data after you have created sessions and completed work.

## 14. Settings and profile

Change AI response style, preferred difficulty, notification preference, and reminder time. Refresh and confirm values persist.

Change the display name and confirm the Settings profile card updates. Upload a JPG, PNG, or WEBP image smaller than 2 MB and confirm the avatar changes. Try a non-image file and a file larger than 2 MB; it should be rejected safely.

Use the theme control in the top bar and confirm dark/light presentation changes without unreadable text.

## 15. Responsive and browser checks

In Chrome or Edge, press `F12`, then click the device toolbar icon. Test widths near 390 px, 768 px, and 1280 px. Check the home page, Overview, Tasks, Assistant, Documents, Calendar, and Settings.

At each width, verify buttons can be tapped, text is not cut off, the menu can open, forms remain usable, and horizontal scrolling only occurs where it is intentionally required by the week calendar.

Test at least two browsers, preferably Chrome/Edge and Firefox. Watch the developer-console tab. Red error messages are defects; normal development messages are not necessarily defects.

## 16. Bug reporting template

For every issue, record this information before sending it for a fix:

| Item | Record |
|---|---|
| Feature/page | For example, Documents → Upload |
| Steps | Exact clicks and values used |
| Expected result | What should have happened |
| Actual result | What happened instead |
| Screenshot/video | Include the full visible error if possible |
| Terminal/console output | Copy the complete relevant error |
| Browser and device size | For example, Chrome, 390 × 844 |

## 17. Final acceptance criteria

NovaMind is ready for local demonstration when all automated commands pass, the application starts with no terminal error, every sidebar route opens, all create/edit/delete flows persist after refresh, document and image validation behaves safely, mobile pages remain usable, and no unexplained red browser-console errors occur.
