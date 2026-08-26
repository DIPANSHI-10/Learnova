import { useAuth } from "@/_core/hooks/useAuth";
import { isLocalDevelopmentMode, startLogin } from "@/const";
import { ArrowDownRight, ArrowRight, BookOpenText, BrainCircuit, CalendarDays, CheckCircle2, FileText, Layers3, MessageSquareText, Sparkles, Sun, WandSparkles } from "lucide-react";
import React, { useState } from "react";
import { useLocation } from "wouter";
import "./local-entry.css";

const features = [
  { number: "01", icon: MessageSquareText, title: "Ask better questions", text: "Move from confused to clear with explanations shaped around your material and the way you learn." },
  { number: "02", icon: CalendarDays, title: "Build a real rhythm", text: "Turn a deadline, a subject, and your available time into a calm plan you can follow." },
  { number: "03", icon: FileText, title: "Read for the signal", text: "Bring documents into one space, find key ideas, and turn dense material into revision prompts." },
  { number: "04", icon: Layers3, title: "Practice the recall", text: "Use varied quizzes and useful flashcards to see what you know and what needs another pass." },
];

export default function MarketingHome() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const isLocalMode = isLocalDevelopmentMode();
  const localAuthError = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("localAuthError");
  const [localEntryOpen, setLocalEntryOpen] = useState(() => isLocalMode && Boolean(localAuthError));
  const enter = () => isAuthenticated ? navigate("/dashboard") : isLocalMode ? setLocalEntryOpen(true) : startLogin();
  const submitLocalEntry = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startLogin({ name: String(form.get("name") || ""), email: String(form.get("email") || "") });
  };

  React.useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>(".learnova-reveal"));
    if (!("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  return <div className="learnova-marketing min-h-screen overflow-hidden text-[#1e1a13]">
    <div className="learnova-sun-glow learnova-sun-glow-one" /><div className="learnova-sun-glow learnova-sun-glow-two" />
    <header className="container relative z-20 flex items-center justify-between py-6">
      <button className="learnova-brand" onClick={() => navigate("/")} aria-label="Learnova home"><span className="learnova-mark"><Sun size={18} /></span><span>Learnova <em>AI</em></span></button>
      <nav className="hidden items-center gap-8 text-sm font-medium text-stone-600 md:flex"><a href="#how-it-works">How it works</a><a href="#features">Learning tools</a><a href="#momentum">Your momentum</a></nav>
      <div className="flex items-center gap-3"><button onClick={enter} className="hidden text-sm font-semibold text-stone-700 sm:block">Sign in</button><button onClick={enter} className="learnova-primary">Begin learning <ArrowRight size={16} /></button></div>
    </header>
    {localEntryOpen && <div className="learnova-user-modal" role="dialog" aria-modal="true" aria-labelledby="local-user-title"><button className="learnova-user-modal-backdrop" onClick={() => setLocalEntryOpen(false)} aria-label="Close account entry" /><form onSubmit={submitLocalEntry} className="learnova-user-card"><span className="learnova-mark"><Sun size={18} /></span><button type="button" className="learnova-user-close" onClick={() => setLocalEntryOpen(false)} aria-label="Close">×</button><p className="learnova-kicker">Your local Learnova account</p><h2 id="local-user-title">Choose who is studying.</h2>{localAuthError === "database" && <p role="alert" className="learnova-local-error">Learnova could not save this account to MySQL. Check that MySQL Server is running, confirm the DATABASE_URL in .env, then stop and restart <code>pnpm dev</code>.</p>}<p>Use a different name and email to create a separate private workspace on this computer.</p><label>Name<input required name="name" minLength={2} maxLength={80} placeholder="Your name" defaultValue="Dipanshi" autoFocus /></label><label>Email<input required name="email" type="email" maxLength={320} placeholder="you@example.com" defaultValue="dipanshi@example.local" /></label><button className="learnova-primary learnova-primary-large w-full" type="submit">Enter your workspace <ArrowRight size={17} /></button><small>Use the same email later to return to the same local learning data.</small></form></div>}
    <main>
      <section className="container relative z-10 grid gap-12 pb-24 pt-14 lg:grid-cols-[1.03fr_.97fr] lg:items-center lg:pb-32 lg:pt-24">
        <div className="max-w-2xl"><p className="learnova-kicker"><Sun size={14} /> Your space for steady progress</p><h1 className="mt-7 text-balance text-5xl font-semibold leading-[.98] tracking-[-.065em] sm:text-6xl lg:text-7xl">Make study time<br /><span>feel like sunlight.</span></h1><p className="mt-7 max-w-xl text-lg leading-8 text-stone-600">Learnova brings your study materials, plans, questions, and progress together so the next right step is always easier to see.</p><div className="mt-9 flex flex-wrap gap-3"><button onClick={enter} className="learnova-primary learnova-primary-large">Open your workspace <ArrowRight size={17} /></button><a href="#features" className="learnova-secondary">Explore the learning loop <ArrowDownRight size={16} /></a></div><div className="mt-11 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-stone-600"><span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-orange-500" /> Your private study space</span><span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-orange-500" /> Built for active recall</span></div></div>
        <div className="learnova-orbit-card"><div className="learnova-orbit learnova-orbit-one" /><div className="learnova-orbit learnova-orbit-two" /><div className="learnova-preview-top"><span className="learnova-mark learnova-mark-small"><Sun size={14} /></span><p>Today’s learning light</p><span className="learnova-pulse" /></div><div className="relative p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-[.14em] text-orange-700/70">Tuesday · 08:45</p><h2 className="mt-2 text-2xl font-semibold tracking-[-.04em]">Good morning !</h2></div><span className="learnova-streak">3 day streak</span></div><div className="mt-6 grid grid-cols-3 gap-3"><PreviewMetric label="Study" value="4.5h" /><PreviewMetric label="On track" value="82%" /><PreviewMetric label="Tasks" value="7/9" /></div><div className="mt-4 grid gap-4 sm:grid-cols-[1.25fr_.75fr]"><div className="learnova-preview-panel"><div className="flex justify-between text-xs font-medium text-stone-500"><span>This week</span><span className="text-orange-600">+24%</span></div><div className="mt-7 flex h-24 items-end gap-2">{[38, 57, 45, 76, 63, 91, 72].map((height, index) => <span key={index} className="learnova-bar" style={{ height: `${height}%`, animationDelay: `${index * 65}ms` }} />)}</div><p className="mt-3 text-xs text-stone-500">Focus grows through small returns.</p></div><button onClick={enter} className="learnova-next-card"><WandSparkles size={19} /><span>Next bright step</span><strong>Review DBMS normalisation</strong><ArrowRight size={17} /></button></div><button onClick={enter} className="learnova-material-row"><span><BookOpenText size={18} /></span><p><small>Learnova AI</small>Turn your notes into a revision plan.</p><ArrowRight size={16} /></button></div></div>
      </section>
      <section id="how-it-works" className="container relative z-10 py-20 sm:py-28"><div className="learnova-editorial-grid learnova-reveal"><p className="learnova-side-number">01 / 03</p><div><p className="learnova-kicker"><Sparkles size={14} /> Study in a clearer sequence</p><h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-.055em] sm:text-6xl">Collect the material. Find the thread. Return stronger.</h2></div><p className="max-w-md self-end text-base leading-7 text-stone-600">Learnova gives every study session a shape: capture the source, clarify the difficult parts, then practice retrieval before moving on.</p></div><div className="mt-10 grid gap-3 lg:grid-cols-3">{[["01", "Bring it in", "Upload documents, capture notes, and make your workload visible."], ["02", "Make it useful", "Use summaries, questions, plans, and explanations that stay grounded in your material."], ["03", "Bring it back", "Return through flashcards and quizzes until your understanding feels solid."]].map(([number, title, copy], index) => <article className={`learnova-process-card learnova-reveal learnova-reveal-delay-${index + 1}`} key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
      <section id="features" className="container relative z-10 py-20 sm:py-28"><div className="learnova-reveal flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between"><div><p className="learnova-kicker"><BrainCircuit size={14} /> Built around your learning loop</p><h2 className="mt-5 text-4xl font-semibold tracking-[-.055em] sm:text-5xl">Tools that invite you in.</h2></div><p className="max-w-sm leading-7 text-stone-600">Hover each panel to explore the part of Learnova that helps carry your work forward.</p></div><div className="mt-10 grid gap-4 md:grid-cols-2">{features.map((feature, index) => <button className={`learnova-feature-card learnova-reveal learnova-reveal-delay-${(index % 4) + 1}`} onClick={enter} key={feature.number}><span className="learnova-feature-number">{feature.number}</span><span className="learnova-feature-icon"><feature.icon size={22} /></span><h3>{feature.title}</h3><p>{feature.text}</p><span className="learnova-card-link">Open tool <ArrowRight size={16} /></span></button>)}</div></section>
      <section id="momentum" className="container relative z-10 pb-24 pt-12"><div className="learnova-cta learnova-reveal"><span className="learnova-cta-sun"><Sun size={38} /></span><p className="learnova-kicker">The next session starts here</p><h2>Less pressure.<br />More momentum.</h2><p>Begin with what you have, then let each small action give the next one more clarity.</p><button onClick={enter} className="learnova-primary learnova-primary-large">Enter Learnova <ArrowRight size={17} /></button></div></section>
    </main>
    <footer className="container relative z-10 flex flex-col gap-3 border-t border-stone-900/10 py-8 text-sm text-stone-500 sm:flex-row sm:justify-between"><p>© {new Date().getFullYear()} Learnova AI. Study with a little more light.</p><p>Made for intentional learning.</p></footer>
  </div>;
}

function PreviewMetric({ label, value }: { label: string; value: string }) { return <div className="learnova-preview-metric"><span>{label}</span><strong>{value}</strong></div>; }
