import React, { useState, useEffect } from "react";
import {
  ChefHat, Dices, Wine, BookOpen, Swords, Trophy,
  MapPin, Calendar, ArrowLeft, ArrowRight, Check, RotateCw,
  Users, Sparkles, Plus, X, Pencil, Bell, CalendarCheck,
  Lock, UserPlus, Zap
} from "lucide-react";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');`;

const TOKENS = {
  paper: "#ECE7DA", ink: "#26312B", card: "#FBF8EF",
  gold: "#C89A3B", rust: "#AF483F", sage: "#6E8368", line: "#D8D0BC",
};

const TEMPLATES = [
  { id: "cookbook", name: "Cookbook Club", tagline: "One book, one table, everybody cooks a page.", icon: ChefHat, cadence: "Every 4 weeks",
    roles: [ { label: "Host", type: "fixed" }, { label: "Picks the cookbook + chapter", type: "rotating" }, { label: "Brings a starter", type: "open" }, { label: "Brings a main", type: "open" }, { label: "Brings dessert", type: "open" } ] },
  { id: "board", name: "Board Game Club", tagline: "Same table, second Thursday, new box every time.", icon: Dices, cadence: "Every 2 weeks",
    roles: [ { label: "Host", type: "fixed" }, { label: "Picks tonight's game", type: "rotating" }, { label: "Brings snacks", type: "open" }, { label: "Brings drinks", type: "open" } ] },
  { id: "wine", name: "Wine Tasting Club", tagline: "A theme, six glasses, and strong opinions.", icon: Wine, cadence: "Monthly",
    roles: [ { label: "Host", type: "fixed" }, { label: "Sets the tasting theme", type: "rotating" }, { label: "Brings bottle 1", type: "open" }, { label: "Brings bottle 2", type: "open" }, { label: "Brings the cheese board", type: "open" } ] },
  { id: "book", name: "Book Club", tagline: "You all said you'd finish it this time.", icon: BookOpen, cadence: "Every 4 weeks",
    roles: [ { label: "Host", type: "fixed" }, { label: "Picks the next book", type: "rotating" }, { label: "Writes discussion questions", type: "rotating" } ] },
  { id: "dnd", name: "Tabletop RPG Group", tagline: "Same party, same campaign, different Tuesday.", icon: Swords, cadence: "Weekly",
    roles: [ { label: "Host", type: "fixed" }, { label: "Dungeon Master", type: "fixed" }, { label: "Snack rotation", type: "rotating" } ] },
  { id: "trivia", name: "Trivia Club", tagline: "Someone writes questions. Everyone else suffers.", icon: Trophy, cadence: "Monthly",
    roles: [ { label: "Host", type: "fixed" }, { label: "Writes tonight's questions", type: "rotating" }, { label: "Brings the prize", type: "open" } ] },
  { id: "blank", name: "Start from scratch", tagline: "No template — build your own cadence and roles.", icon: Sparkles, cadence: "", roles: [] },
];

let uid = 1;
const nextId = () => `s${uid++}`;

function Stepper({ step }) {
  const steps = ["Pick a club", "Set the session", "Confirm the date", "Fill the roster"];
  return (
    <div className="flex items-stretch mb-10" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
      {steps.map((s, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step || step === 5;
        return (
          <div key={s} className="flex items-center flex-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0"
                style={{ background: done ? TOKENS.sage : active ? TOKENS.ink : "transparent", color: done || active ? TOKENS.card : TOKENS.ink, border: `1.5px solid ${done ? TOKENS.sage : TOKENS.ink}` }}>
                {done ? <Check size={13} /> : n}
              </div>
              <span className="text-[11px] uppercase tracking-wider whitespace-nowrap" style={{ color: active ? TOKENS.ink : "#8A8570", fontWeight: active ? 600 : 500 }}>{s}</span>
            </div>
            {n < 4 && <div className="flex-1 h-px mx-3" style={{ background: TOKENS.line }} />}
          </div>
        );
      })}
    </div>
  );
}

function IndexCard({ children, rotate = 0, style = {}, className = "" }) {
  return (
    <div className={`relative ${className}`}
      style={{ background: TOKENS.card, border: `1px solid ${TOKENS.line}`, boxShadow: "0 1px 2px rgba(38,49,43,0.06), 0 6px 14px rgba(38,49,43,0.07)", transform: `rotate(${rotate}deg)`, ...style }}>
      {children}
    </div>
  );
}

function Tag({ children }) {
  return <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#8A8570", border: `1px solid ${TOKENS.line}` }}>{children}</span>;
}

function Initials({ name, active }) {
  const init = name.trim().slice(0, 2).toUpperCase();
  return (
    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0"
      style={{ background: active ? TOKENS.sage : TOKENS.paper, color: active ? TOKENS.card : "#8A8570", border: `1px solid ${TOKENS.line}`, fontFamily: "'IBM Plex Mono', monospace" }}>
      {init}
    </span>
  );
}

export default function Rotation() {
  const [step, setStep] = useState(1);
  const [templateId, setTemplateId] = useState(null);
  const [clubName, setClubName] = useState("");
  const [cadence, setCadence] = useState("");

  const [dateOptions, setDateOptions] = useState([]);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const [locationMode, setLocationMode] = useState("fixed");
  const [location, setLocation] = useState("");

  const [members, setMembers] = useState([{ id: "you", name: "You" }]);
  const [newMemberName, setNewMemberName] = useState("");
  const [currentHostIdx, setCurrentHostIdx] = useState(0);

  const [votes, setVotes] = useState({});
  const [nudged, setNudged] = useState(new Set());
  const [autoLock, setAutoLock] = useState(false);
  const [autoLocked, setAutoLocked] = useState(false);
  const [lockedDateId, setLockedDateId] = useState(null);

  const [roles, setRoles] = useState([]);
  const [newRoleLabel, setNewRoleLabel] = useState("");
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [claims, setClaims] = useState({});
  const [claimingSlot, setClaimingSlot] = useState(null);
  const [nameInput, setNameInput] = useState("");

  const [showRecap, setShowRecap] = useState(false);
  const [recapNote, setRecapNote] = useState("");
  const [sessionComplete, setSessionComplete] = useState(false);
  const [history, setHistory] = useState([]);

  const [prepNotes, setPrepNotes] = useState("");
  const [prepVisibility, setPrepVisibility] = useState("shared");
  const [isPlus, setIsPlus] = useState(false);
  const [savedAsDefault, setSavedAsDefault] = useState(false);

  const [bellOpen, setBellOpen] = useState(false);

  const template = TEMPLATES.find((t) => t.id === templateId);

  function chooseTemplate(t) {
    setTemplateId(t.id);
    setClubName(t.name === "Start from scratch" ? "" : t.name);
    setCadence(t.cadence);
    setRoles(t.roles.map((r) => ({ ...r, id: nextId() })));
    setDateOptions([]); setVotes({}); setLockedDateId(null); setAutoLocked(false);
    setStep(2);
  }

  function addDateOption() {
    if (!newDate) return;
    setDateOptions((d) => [...d, { id: nextId(), date: newDate, time: newTime }]);
    setNewDate(""); setNewTime("");
  }
  function removeDateOption(id) {
    setDateOptions((d) => d.filter((o) => o.id !== id));
    if (lockedDateId === id) setLockedDateId(null);
  }
  function addMember() {
    if (!newMemberName.trim()) return;
    setMembers((m) => [...m, { id: nextId(), name: newMemberName.trim() }]);
    setNewMemberName("");
  }
  function removeMember(id) {
    if (id === "you") return;
    setMembers((m) => m.filter((x) => x.id !== id));
    setVotes((v) => { const n = { ...v }; delete n[id]; return n; });
  }

  function setMyVote(slotId, mark) {
    setVotes((prev) => {
      const mine = { ...(prev.you || {}) };
      if (mine[slotId] === mark) delete mine[slotId]; else mine[slotId] = mark;
      return { ...prev, you: mine };
    });
  }
  function simulateOneResponse() {
    const next = members.find((m) => m.id !== "you" && !(votes[m.id] && Object.keys(votes[m.id]).length));
    if (!next || !dateOptions.length) return;
    const v = {}; let anyYes = false;
    dateOptions.forEach((d, i) => { const yes = Math.random() < (i === 0 ? 0.72 : 0.5); v[d.id] = yes ? "yes" : "no"; if (yes) anyYes = true; });
    if (!anyYes) v[dateOptions[0].id] = "yes";
    setVotes((prev) => ({ ...prev, [next.id]: v }));
  }
  function simulateAll() {
    const remaining = members.filter((m) => m.id !== "you" && !(votes[m.id] && Object.keys(votes[m.id]).length));
    if (!remaining.length || !dateOptions.length) return;
    const add = {};
    remaining.forEach((m) => {
      const v = {}; let anyYes = false;
      dateOptions.forEach((d, i) => { const yes = Math.random() < (i === 0 ? 0.72 : 0.5); v[d.id] = yes ? "yes" : "no"; if (yes) anyYes = true; });
      if (!anyYes) v[dateOptions[0].id] = "yes";
      add[m.id] = v;
    });
    setVotes((prev) => ({ ...prev, ...add }));
  }
  function nudge(id) { setNudged((prev) => new Set(prev).add(id)); }

  function addRole() {
    if (!newRoleLabel.trim()) return;
    setRoles((r) => [...r, { id: nextId(), label: newRoleLabel.trim(), type: "open" }]);
    setNewRoleLabel("");
  }
  function removeRole(id) {
    setRoles((r) => r.filter((x) => x.id !== id));
    setClaims((c) => { const n = { ...c }; delete n[id]; return n; });
  }
  function saveRoleLabel(id) { setRoles((r) => r.map((x) => (x.id === id ? { ...x, label: editingLabel } : x))); setEditingRoleId(null); }
  function cycleRoleType(id) { const order = ["open", "rotating", "fixed"]; setRoles((r) => r.map((x) => (x.id === id ? { ...x, type: order[(order.indexOf(x.type) + 1) % 3] } : x))); }
  function confirmClaim(slotId) { if (!nameInput.trim()) return; setClaims((c) => ({ ...c, [slotId]: nameInput.trim() })); setClaimingSlot(null); setNameInput(""); }

  // derived voting state
  const slotYes = {};
  dateOptions.forEach((d) => { slotYes[d.id] = members.reduce((n, m) => n + ((votes[m.id]?.[d.id]) === "yes" ? 1 : 0), 0); });
  const maxYes = dateOptions.length ? Math.max(0, ...dateOptions.map((d) => slotYes[d.id])) : 0;
  const leaders = dateOptions.filter((d) => slotYes[d.id] === maxYes && maxYes > 0);
  const isTie = leaders.length > 1;
  const respondedIds = members.filter((m) => votes[m.id] && Object.keys(votes[m.id]).length).map((m) => m.id);
  const nonResponders = members.filter((m) => !respondedIds.includes(m.id));

  useEffect(() => {
    if (step === 3 && autoLock && !lockedDateId && dateOptions.length && nonResponders.length === 0 && leaders.length === 1) {
      setAutoLocked(true); setLockedDateId(leaders[0].id);
    }
  }, [step, autoLock, votes, dateOptions, members, lockedDateId, nonResponders.length, leaders.length]);

  function lockDate(id) { setAutoLocked(false); setLockedDateId(id); }
  function reopen() { setLockedDateId(null); setAutoLocked(false); }

  const lockedDate = dateOptions.find((d) => d.id === lockedDateId);
  const currentLocation = locationMode === "rotating" ? (members[currentHostIdx]?.name || "no members yet") : (location || "no location set");

  // In-app notifications — derived from real session state, shown when the person opens Rotation
  const openRolesCount = roles.filter((r) => r.type === "open" && !claims[r.id]).length;
  const pendingVoters = nonResponders.filter((m) => m.id !== "you").length;
  const notifications = [
    lockedDate && { id: "confirmed", icon: CalendarCheck, text: `${clubName || "Your club"} is set for ${lockedDate.date}${lockedDate.time ? " · " + lockedDate.time : ""} at ${currentLocation}.` },
    lockedDate && openRolesCount > 0 && { id: "roles", icon: Users, text: `${openRolesCount} role${openRolesCount > 1 ? "s" : ""} still open — claim one before the session.` },
    step === 3 && !lockedDateId && dateOptions.length > 0 && pendingVoters > 0 && { id: "voting", icon: Bell, text: `Voting's open — ${pendingVoters} member${pendingVoters > 1 ? "s" : ""} haven't weighed in yet.` },
    sessionComplete && locationMode === "rotating" && members.length && { id: "next-host", icon: RotateCw, text: `${members[currentHostIdx]?.name} is up to host next — pick some dates to get voting going.` },
  ].filter(Boolean);

  function completeSession() {
    setHistory((h) => [{ date: lockedDate ? `${lockedDate.date} ${lockedDate.time}` : "—", host: currentLocation, note: recapNote || "(no notes added)" }, ...h]);
    if (locationMode === "rotating" && members.length) setCurrentHostIdx((i) => (i + 1) % members.length);
    setSessionComplete(true); setShowRecap(false);
  }

  return (
    <div className="min-h-screen w-full" style={{ background: TOKENS.paper, color: TOKENS.ink, fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <style>{FONT_IMPORT}</style>

      <header className="border-b" style={{ borderColor: TOKENS.line }}>
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-end justify-between">
          <div>
            <div className="text-3xl tracking-tight" style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}>Rotation</div>
            <div className="text-[13px] mt-1" style={{ color: "#5C5A48" }}>logistics for the friends you already have.</div>
          </div>
          <div className="flex items-center gap-3">
            {template && (
              <div className="hidden sm:flex items-center gap-2 text-[11px] uppercase tracking-wider px-3 py-1.5" style={{ fontFamily: "'IBM Plex Mono', monospace", border: `1px solid ${TOKENS.line}`, color: "#5C5A48" }}>
                <RotateCw size={12} /> {clubName || "unnamed club"}
              </div>
            )}
            <div className="relative">
              <button onClick={() => setBellOpen((v) => !v)} className="relative w-9 h-9 flex items-center justify-center rounded-full" style={{ border: `1px solid ${TOKENS.line}`, background: bellOpen ? TOKENS.card : "transparent" }} aria-label="Notifications">
                <Bell size={16} style={{ color: TOKENS.ink }} />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px]" style={{ background: TOKENS.rust, color: TOKENS.card, fontFamily: "'IBM Plex Mono', monospace" }}>{notifications.length}</span>
                )}
              </button>
              {bellOpen && (
                <div className="absolute right-0 mt-2 w-72 z-20" style={{ background: TOKENS.card, border: `1px solid ${TOKENS.line}`, boxShadow: "0 6px 20px rgba(38,49,43,0.14)" }}>
                  <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ borderColor: TOKENS.line }}>
                    <span className="text-[11px] uppercase tracking-wider" style={{ fontFamily: "'IBM Plex Mono', monospace", color: TOKENS.sage }}>Notifications</span>
                    <span className="text-[10px]" style={{ color: "#8A8570" }}>shown when you open Rotation</span>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-[12px] text-center italic" style={{ color: "#8A8570" }}>Nothing needs you right now.</div>
                  ) : (
                    <div>
                      {notifications.map((n) => {
                        const Icon = n.icon;
                        return (
                          <div key={n.id} className="px-4 py-3 flex items-start gap-2.5 border-b last:border-b-0" style={{ borderColor: TOKENS.line }}>
                            <Icon size={14} className="mt-0.5 shrink-0" style={{ color: TOKENS.sage }} />
                            <span className="text-[12px]" style={{ color: "#3C4038", lineHeight: 1.5 }}>{n.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="px-4 py-2.5 border-t text-[11px]" style={{ borderColor: TOKENS.line, color: "#8A8570" }}>
                    These wait here until you visit. Time-sensitive ones also go out by email or text.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <Stepper step={step} />

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl mb-1" style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}>What are you and your people actually doing?</h1>
            <p className="text-sm mb-8" style={{ color: "#5C5A48" }}>Pick a starting point. Templates just pre-fill suggested roles and cadence — everything about your actual club is yours to set next.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {TEMPLATES.map((t, i) => {
                const Icon = t.icon;
                return (
                  <IndexCard key={t.id} rotate={i % 2 === 0 ? -0.6 : 0.6} className="p-5 flex flex-col">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center mb-4" style={{ background: TOKENS.paper, color: TOKENS.sage }}><Icon size={17} /></div>
                    <div className="text-lg mb-1" style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}>{t.name}</div>
                    <p className="text-[13px] flex-1 mb-4" style={{ color: "#5C5A48" }}>{t.tagline}</p>
                    <div className="text-[11px] uppercase tracking-wider mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace", color: TOKENS.sage }}>{t.id === "blank" ? "Fully custom" : `${t.cadence} · ${t.roles.length} suggested roles`}</div>
                    <button onClick={() => chooseTemplate(t)} className="text-[13px] font-medium px-3 py-2 flex items-center justify-center gap-1.5" style={{ background: TOKENS.ink, color: TOKENS.card }}>Start this club <ArrowRight size={14} /></button>
                  </IndexCard>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2 — set session */}
        {step === 2 && template && (
          <div className="grid md:grid-cols-[1.3fr_1fr] gap-8">
            <div>
              <button onClick={() => setStep(1)} className="text-[12px] flex items-center gap-1 mb-5" style={{ color: "#5C5A48" }}><ArrowLeft size={13} /> Choose a different club</button>

              <label className="block text-[11px] uppercase tracking-wider mb-1.5" style={{ fontFamily: "'IBM Plex Mono', monospace", color: TOKENS.sage }}>Club name — yours to change</label>
              <input value={clubName} onChange={(e) => setClubName(e.target.value)} placeholder="Name your club" className="w-full mb-5 px-3 py-2 text-lg outline-none" style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, background: "transparent", borderBottom: `2px solid ${TOKENS.ink}` }} />

              <label className="block text-[11px] uppercase tracking-wider mb-1.5" style={{ fontFamily: "'IBM Plex Mono', monospace", color: TOKENS.sage }}>How often</label>
              <input value={cadence} onChange={(e) => setCadence(e.target.value)} placeholder="e.g. every 3rd Thursday, monthly, whenever we feel like it" className="w-full mb-7 px-3 py-2 text-[14px] outline-none" style={{ background: TOKENS.card, border: `1px solid ${TOKENS.line}` }} />

              <div className="flex items-center gap-2 mb-3"><Calendar size={15} style={{ color: TOKENS.sage }} /><div className="text-[13px] font-medium">Propose dates for the group to vote on</div></div>
              <div className="flex flex-wrap gap-2 mb-3">
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="px-3 py-2 text-[13px] outline-none" style={{ background: TOKENS.card, border: `1px solid ${TOKENS.line}` }} />
                <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="px-3 py-2 text-[13px] outline-none" style={{ background: TOKENS.card, border: `1px solid ${TOKENS.line}` }} />
                <button onClick={addDateOption} className="px-3 py-2 text-[12px] font-medium flex items-center gap-1" style={{ background: TOKENS.ink, color: TOKENS.card }}><Plus size={13} /> Add option</button>
              </div>
              <div className="space-y-2 mb-8">
                {dateOptions.length === 0 && <div className="text-[12px] italic px-1" style={{ color: "#8A8570" }}>No dates proposed yet — add at least one.</div>}
                {dateOptions.map((d) => (
                  <div key={d.id} className="w-full flex items-center justify-between px-4 py-3 text-[14px]" style={{ border: `1px solid ${TOKENS.line}` }}>
                    <span>{d.date}{d.time ? ` · ${d.time}` : ""}</span>
                    <button onClick={() => removeDateOption(d.id)} style={{ color: TOKENS.rust }}><X size={14} /></button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 mb-3"><Users size={15} style={{ color: TOKENS.sage }} /><div className="text-[13px] font-medium">Who's in this club?</div></div>
              <p className="text-[12px] mb-3" style={{ color: "#5C5A48" }}>Add the friends you're inviting. They're the ones who vote{locationMode === "rotating" ? ", and this list is your host rotation order" : ""}.</p>
              <div className="flex gap-2 mb-3">
                <input value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addMember()} placeholder="Friend's name" className="flex-1 px-3 py-2 text-[13px] outline-none" style={{ background: TOKENS.card, border: `1px solid ${TOKENS.line}` }} />
                <button onClick={addMember} className="px-3 py-2 text-[12px] font-medium flex items-center gap-1" style={{ background: TOKENS.ink, color: TOKENS.card }}><UserPlus size={13} /> Add</button>
              </div>
              <div className="flex flex-wrap gap-2 mb-8">
                {members.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-1.5 text-[12px] px-2.5 py-1" style={{ background: TOKENS.card, border: `1px solid ${TOKENS.line}` }}>
                    {locationMode === "rotating" && <span style={{ color: "#8A8570" }}>{i + 1}.</span>} {m.name}
                    {m.id !== "you" && <button onClick={() => removeMember(m.id)}><X size={12} style={{ color: TOKENS.rust }} /></button>}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 mb-3"><MapPin size={15} style={{ color: TOKENS.sage }} /><div className="text-[13px] font-medium">Where</div></div>
              <div className="flex items-center gap-3 mb-3">
                <button onClick={() => setLocationMode("fixed")} className="text-[12px] px-3 py-1.5" style={{ background: locationMode === "fixed" ? TOKENS.ink : "transparent", color: locationMode === "fixed" ? TOKENS.card : TOKENS.ink, border: `1px solid ${TOKENS.ink}` }}>Fixed location</button>
                <button onClick={() => setLocationMode("rotating")} className="text-[12px] px-3 py-1.5" style={{ background: locationMode === "rotating" ? TOKENS.ink : "transparent", color: locationMode === "rotating" ? TOKENS.card : TOKENS.ink, border: `1px solid ${TOKENS.ink}` }}>Rotate between members</button>
              </div>
              {locationMode === "fixed" ? (
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Type the address or place name" className="w-full mb-8 px-3 py-2 text-[14px] outline-none" style={{ background: TOKENS.card, border: `1px solid ${TOKENS.line}` }} />
              ) : (
                <p className="text-[12px] mb-8" style={{ color: "#5C5A48" }}>Rotation cycles through your member list above, in order. It advances automatically after each session.</p>
              )}

              <button onClick={() => setStep(3)} disabled={!dateOptions.length} className="text-[13px] font-medium px-4 py-2.5 flex items-center gap-1.5 disabled:opacity-40" style={{ background: TOKENS.ink, color: TOKENS.card }}>Open voting to the group <ArrowRight size={14} /></button>
              {!dateOptions.length && <p className="text-[11px] mt-2" style={{ color: TOKENS.rust }}>Add at least one date option to open voting.</p>}
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wider mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace", color: TOKENS.sage }}>What happens next</div>
              <IndexCard rotate={0.6} className="p-4">
                <p className="text-[13px]" style={{ color: "#3C4038" }}>Opening voting sends your date options to the group. As people mark what works, you'll see the tally build and who hasn't answered yet — then you lock the winning slot and Rotation handles the rest.</p>
              </IndexCard>
            </div>
          </div>
        )}

        {/* STEP 3 — voting & confirm */}
        {step === 3 && template && (
          <div>
            <button onClick={() => setStep(2)} className="text-[12px] flex items-center gap-1 mb-5" style={{ color: "#5C5A48" }}><ArrowLeft size={13} /> Back to session details</button>

            {!lockedDateId ? (
              <div className="grid md:grid-cols-[1.4fr_1fr] gap-8">
                {/* tally column */}
                <div>
                  <div className="flex items-baseline justify-between mb-1">
                    <h1 className="text-2xl" style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}>Voting is open</h1>
                    <div className="text-[12px]" style={{ color: "#5C5A48" }}>{respondedIds.length} of {members.length} voted</div>
                  </div>
                  <p className="text-sm mb-6" style={{ color: "#5C5A48" }}>Mark your own availability, watch the group's come in, then lock the winner.</p>

                  <div className="space-y-3 mb-6">
                    {dateOptions.map((d) => {
                      const isLeader = leaders.some((l) => l.id === d.id);
                      const mine = votes.you?.[d.id];
                      return (
                        <IndexCard key={d.id} rotate={0} className="p-4" style={{ borderColor: isLeader ? TOKENS.gold : TOKENS.line, borderWidth: isLeader ? 1.5 : 1 }}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-[14px] font-medium">{d.date}{d.time ? ` · ${d.time}` : ""}</div>
                            <div className="flex items-center gap-2">
                              {isLeader && <Tag>{isTie ? "Tied lead" : "Leading"}</Tag>}
                              <span className="flex items-center gap-1 text-[13px]" style={{ color: TOKENS.sage }}><Users size={13} /> {slotYes[d.id]}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] uppercase tracking-wider mr-1" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#8A8570" }}>You:</span>
                            <button onClick={() => setMyVote(d.id, "yes")} className="text-[12px] px-2.5 py-1" style={{ background: mine === "yes" ? TOKENS.sage : "transparent", color: mine === "yes" ? TOKENS.card : TOKENS.sage, border: `1px solid ${TOKENS.sage}` }}>I'm in</button>
                            <button onClick={() => setMyVote(d.id, "no")} className="text-[12px] px-2.5 py-1" style={{ background: mine === "no" ? TOKENS.rust : "transparent", color: mine === "no" ? TOKENS.card : TOKENS.rust, border: `1px solid ${TOKENS.rust}` }}>Can't</button>
                            {/* who said yes */}
                            <div className="flex -space-x-1 ml-2">
                              {members.filter((m) => votes[m.id]?.[d.id] === "yes").slice(0, 6).map((m) => <Initials key={m.id} name={m.name} active />)}
                            </div>
                          </div>
                        </IndexCard>
                      );
                    })}
                  </div>

                  {/* add more options */}
                  <div className="flex flex-wrap items-center gap-2 mb-8">
                    <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="px-2 py-1.5 text-[12px] outline-none" style={{ background: TOKENS.card, border: `1px solid ${TOKENS.line}` }} />
                    <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="px-2 py-1.5 text-[12px] outline-none" style={{ background: TOKENS.card, border: `1px solid ${TOKENS.line}` }} />
                    <button onClick={addDateOption} className="text-[12px] px-2.5 py-1.5 flex items-center gap-1" style={{ border: `1px solid ${TOKENS.line}`, color: "#5C5A48" }}><Plus size={12} /> Add another option</button>
                  </div>

                  {/* confirm area */}
                  <div className="border-t pt-6" style={{ borderColor: TOKENS.line }}>
                    <label className="flex items-center gap-2 text-[13px] mb-4 cursor-pointer" style={{ color: "#3C4038" }}>
                      <input type="checkbox" checked={autoLock} onChange={(e) => setAutoLock(e.target.checked)} />
                      <Zap size={14} style={{ color: TOKENS.gold }} /> Auto-lock the top slot once everyone's voted
                    </label>

                    {maxYes === 0 ? (
                      <div className="text-[13px] px-4 py-3" style={{ background: TOKENS.card, border: `1px dashed ${TOKENS.rust}`, color: TOKENS.rust }}>
                        No slot works for the group yet. Add another option above, or nudge the people who haven't voted.
                      </div>
                    ) : isTie ? (
                      <div>
                        <div className="text-[13px] mb-3" style={{ color: "#3C4038" }}>It's a tie — pick which one to lock:</div>
                        <div className="flex flex-wrap gap-2">
                          {leaders.map((l) => (
                            <button key={l.id} onClick={() => lockDate(l.id)} className="text-[13px] font-medium px-3 py-2 flex items-center gap-1.5" style={{ background: TOKENS.ink, color: TOKENS.card }}>
                              <Lock size={13} /> Lock {l.date}{l.time ? ` · ${l.time}` : ""}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        {autoLock && nonResponders.length > 0 && <div className="text-[12px] mb-2" style={{ color: "#8A8570" }}>Auto-lock armed — will pick {leaders[0].date} once {nonResponders.length} more vote{nonResponders.length > 1 ? "s" : ""} come in. You can still lock now.</div>}
                        <button onClick={() => lockDate(leaders[0].id)} className="text-[14px] font-medium px-4 py-2.5 flex items-center gap-1.5" style={{ background: TOKENS.ink, color: TOKENS.card }}>
                          <Lock size={14} /> Lock {leaders[0].date}{leaders[0].time ? ` · ${leaders[0].time}` : ""}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* members column */}
                <div>
                  <div className="text-[11px] uppercase tracking-wider mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace", color: TOKENS.sage }}>The group</div>
                  <IndexCard rotate={0.4} className="p-4 mb-4">
                    <div className="space-y-2">
                      {members.map((m) => {
                        const voted = respondedIds.includes(m.id);
                        return (
                          <div key={m.id} className="flex items-center justify-between text-[13px]">
                            <span className="flex items-center gap-2"><Initials name={m.name} active={voted} /> {m.name}{m.id === "you" ? " (you)" : ""}</span>
                            {voted ? (
                              <span className="text-[11px] flex items-center gap-1" style={{ color: TOKENS.sage }}><Check size={12} /> voted</span>
                            ) : nudged.has(m.id) ? (
                              <span className="text-[11px]" style={{ color: "#8A8570" }}>nudged</span>
                            ) : (
                              <button onClick={() => nudge(m.id)} className="text-[11px] flex items-center gap-1" style={{ color: TOKENS.rust }}><Bell size={11} /> nudge</button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </IndexCard>

                  {members.length <= 1 ? (
                    <p className="text-[12px] italic" style={{ color: "#8A8570" }}>Add friends on the previous screen to see votes come in.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <button onClick={simulateOneResponse} disabled={!nonResponders.filter((m) => m.id !== "you").length} className="text-[12px] px-3 py-2 flex items-center justify-center gap-1.5 disabled:opacity-40" style={{ border: `1px solid ${TOKENS.line}`, color: "#5C5A48" }}>Simulate one response coming in</button>
                      <button onClick={simulateAll} disabled={!nonResponders.filter((m) => m.id !== "you").length} className="text-[12px] px-3 py-2 flex items-center justify-center gap-1.5 disabled:opacity-40" style={{ border: `1px solid ${TOKENS.line}`, color: "#5C5A48" }}>Simulate everyone responding</button>
                      <p className="text-[11px] mt-1" style={{ color: "#8A8570" }}>(Demo controls — in the real app these votes arrive from your friends.)</p>
                    </div>
                  )}

                  {nonResponders.filter((m) => m.id !== "you").length > 0 && (
                    <button onClick={() => nonResponders.forEach((m) => m.id !== "you" && nudge(m.id))} className="text-[12px] mt-4 px-3 py-2 w-full flex items-center justify-center gap-1.5" style={{ border: `1px solid ${TOKENS.rust}`, color: TOKENS.rust }}><Bell size={12} /> Nudge everyone who hasn't voted</button>
                  )}
                </div>
              </div>
            ) : (
              /* LOCKED — cascade */
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <Lock size={18} style={{ color: TOKENS.sage }} />
                  <h1 className="text-2xl" style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}>Locked in</h1>
                </div>
                <p className="text-sm mb-2" style={{ color: "#5C5A48" }}>{lockedDate?.date}{lockedDate?.time ? ` · ${lockedDate.time}` : ""} · {currentLocation}</p>
                {autoLocked && <p className="text-[12px] mb-6" style={{ color: "#8A8570" }}>Auto-locked because everyone voted and one slot came out ahead.</p>}
                {!autoLocked && <div className="mb-6" />}

                <div className="text-[11px] uppercase tracking-wider mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace", color: TOKENS.sage }}>Rotation just handled the rest</div>
                <div className="space-y-2 mb-8">
                  {[
                    { icon: Bell, label: "Everyone got the final time", sub: `"${clubName || "Your club"} is set: ${lockedDate?.date}${lockedDate?.time ? " at " + lockedDate.time : ""} · ${currentLocation}."` },
                    { icon: CalendarCheck, label: "Calendar invites went out", sub: "It lands in everyone's actual calendar, not just here." },
                    { icon: Users, label: "The roster is open for claiming", sub: "Open roles can now be grabbed by the group." },
                    { icon: Zap, label: "Reminders are armed", sub: "Day-before text and open-role nudges are scheduled off this date." },
                  ].map((c, i) => {
                    const Icon = c.icon;
                    return (
                      <IndexCard key={i} rotate={i % 2 === 0 ? -0.3 : 0.3} className="p-4 flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: TOKENS.paper, color: TOKENS.sage }}><Icon size={15} /></div>
                        <div>
                          <div className="text-[13px] font-medium flex items-center gap-1.5"><Check size={13} style={{ color: TOKENS.sage }} /> {c.label}</div>
                          <div className="text-[12px] mt-0.5" style={{ color: "#5C5A48" }}>{c.sub}</div>
                        </div>
                      </IndexCard>
                    );
                  })}
                </div>

                <div className="flex items-center gap-4">
                  <button onClick={() => setStep(4)} className="text-[13px] font-medium px-4 py-2.5 flex items-center gap-1.5" style={{ background: TOKENS.sage, color: TOKENS.card }}>Fill the roster <ArrowRight size={14} /></button>
                  <button onClick={reopen} className="text-[12px]" style={{ color: "#5C5A48", textDecoration: "underline" }}>Re-open voting</button>
                </div>
                <p className="text-[11px] mt-3" style={{ color: "#8A8570" }}>Decided is decided by default — re-opening is there for when plans genuinely change.</p>
              </div>
            )}
          </div>
        )}

        {/* STEP 4 — roster + prep notes */}
        {step === 4 && template && (
          <div>
            <button onClick={() => setStep(3)} className="text-[12px] flex items-center gap-1 mb-5" style={{ color: "#5C5A48" }}><ArrowLeft size={13} /> Back to the date</button>

            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
              <h1 className="text-2xl" style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}>{clubName || "Unnamed club"}</h1>
              <div className="text-[13px]" style={{ color: "#5C5A48" }}>{lockedDate?.date}{lockedDate?.time ? ` · ${lockedDate.time}` : ""} · {currentLocation}</div>
            </div>
            <p className="text-sm mb-6" style={{ color: "#5C5A48" }}>Rename or delete any role, or add your own. Click the type tag to cycle Fixed → Rotating → Open.</p>

            <div className="flex gap-2 mb-6">
              <input value={newRoleLabel} onChange={(e) => setNewRoleLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addRole()} placeholder="Add a role, e.g. 'Brings the aux cord'" className="flex-1 px-3 py-2 text-[13px] outline-none" style={{ background: TOKENS.card, border: `1px solid ${TOKENS.line}` }} />
              <button onClick={addRole} className="px-3 py-2 text-[12px] font-medium flex items-center gap-1" style={{ background: TOKENS.ink, color: TOKENS.card }}><Plus size={13} /> Add role</button>
            </div>

            {roles.length === 0 && <div className="text-[13px] italic mb-6" style={{ color: "#8A8570" }}>No roles yet — this club can run with none, or add some above.</div>}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {roles.map((r, i) => {
                const claimed = claims[r.id];
                const autoAssigned = r.type === "fixed" || r.type === "rotating";
                const isClaiming = claimingSlot === r.id;
                const isEditing = editingRoleId === r.id;
                return (
                  <IndexCard key={r.id} rotate={i % 3 === 0 ? -0.8 : i % 3 === 1 ? 0.5 : -0.3} className="p-4 flex flex-col justify-between min-h-[136px]" style={{ borderStyle: claimed || autoAssigned ? "solid" : "dashed", borderColor: claimed || autoAssigned ? TOKENS.gold : TOKENS.rust, borderWidth: claimed || autoAssigned ? 1 : 1.5 }}>
                    <div className="flex items-start justify-between gap-2">
                      <button onClick={() => cycleRoleType(r.id)}><Tag>{r.type === "fixed" ? "Fixed" : r.type === "rotating" ? "Rotates" : "Open"}</Tag></button>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => { setEditingRoleId(r.id); setEditingLabel(r.label); }} style={{ color: "#8A8570" }}><Pencil size={11} /></button>
                        <button onClick={() => removeRole(r.id)} style={{ color: TOKENS.rust }}><X size={12} /></button>
                      </div>
                    </div>
                    {isEditing ? (
                      <div className="flex gap-1 my-2">
                        <input autoFocus value={editingLabel} onChange={(e) => setEditingLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveRoleLabel(r.id)} className="flex-1 min-w-0 px-2 py-1 text-[13px] outline-none" style={{ border: `1px solid ${TOKENS.line}`, background: TOKENS.paper }} />
                        <button onClick={() => saveRoleLabel(r.id)} className="px-2 text-[12px]" style={{ background: TOKENS.ink, color: TOKENS.card }}><Check size={13} /></button>
                      </div>
                    ) : (<div className="text-[14px] font-medium my-2">{r.label}</div>)}
                    {isClaiming ? (
                      <div className="flex gap-1">
                        <input autoFocus value={nameInput} onChange={(e) => setNameInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && confirmClaim(r.id)} placeholder="Your name" className="flex-1 min-w-0 px-2 py-1 text-[13px] outline-none" style={{ border: `1px solid ${TOKENS.line}`, background: TOKENS.paper }} />
                        <button onClick={() => confirmClaim(r.id)} className="px-2 text-[12px]" style={{ background: TOKENS.ink, color: TOKENS.card }}><Check size={13} /></button>
                      </div>
                    ) : autoAssigned ? (
                      <div className="flex items-center gap-1.5 text-[13px]" style={{ color: TOKENS.sage }}><Users size={13} /> {r.type === "fixed" ? currentLocation : "assigned by rotation"}</div>
                    ) : claimed ? (
                      <div className="flex items-center gap-1.5 text-[13px]" style={{ color: TOKENS.sage }}><Users size={13} /> {claimed}</div>
                    ) : (
                      <button onClick={() => { setClaimingSlot(r.id); setNameInput(""); }} className="text-[12px] font-medium self-start px-2.5 py-1" style={{ color: TOKENS.rust, border: `1px solid ${TOKENS.rust}` }}>Claim this</button>
                    )}
                  </IndexCard>
                );
              })}
            </div>

            {/* prep notes */}
            <div className="mt-10 border-t pt-8" style={{ borderColor: TOKENS.line }}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2"><Pencil size={15} style={{ color: TOKENS.sage }} /><div className="text-[13px] font-medium">Prep notes for this session</div></div>
                <button onClick={() => setIsPlus((v) => !v)} className="text-[10px] uppercase tracking-wider px-2 py-1" style={{ fontFamily: "'IBM Plex Mono', monospace", border: `1px solid ${isPlus ? TOKENS.gold : TOKENS.line}`, background: isPlus ? TOKENS.gold : "transparent", color: isPlus ? TOKENS.card : "#8A8570" }}>{isPlus ? "Viewing as Plus" : "Viewing as Free"}</button>
              </div>
              <p className="text-[12px] mb-3" style={{ color: "#5C5A48" }}>Discussion questions, a tasting theme, house rules — whatever your club needs. Members see these once released.</p>
              <IndexCard rotate={-0.3} className="p-4 max-w-xl">
                <textarea value={prepNotes} onChange={(e) => setPrepNotes(e.target.value)} rows={4} placeholder={"1. What did the ending change about the first chapter?\n2. Which character did you trust least, and when did that shift?\n3. If you could cut one subplot, which?"} className="w-full px-3 py-2 text-[13px] outline-none" style={{ background: TOKENS.paper, border: `1px solid ${TOKENS.line}`, lineHeight: 1.6, resize: "vertical" }} />
                <div className="border-t mt-4 pt-4" style={{ borderColor: TOKENS.line }}>
                  <div className="text-[12px] font-medium mb-2">When do members see these?</div>
                  <button onClick={() => setPrepVisibility("shared")} className="w-full flex items-start gap-2 text-left px-3 py-2 mb-2" style={{ border: `1px solid ${prepVisibility === "shared" ? TOKENS.gold : TOKENS.line}`, background: prepVisibility === "shared" ? TOKENS.card : "transparent" }}>
                    <Check size={14} className="mt-0.5 shrink-0" style={{ color: prepVisibility === "shared" ? TOKENS.gold : "transparent" }} />
                    <span><span className="text-[13px] font-medium block">Share before we meet</span><span className="text-[12px]" style={{ color: "#5C5A48" }}>Members can read and prep ahead. Free.</span></span>
                  </button>
                  <button onClick={() => isPlus && setPrepVisibility("hidden_until_start")} disabled={!isPlus} className="w-full flex items-start gap-2 text-left px-3 py-2" style={{ border: `1px solid ${prepVisibility === "hidden_until_start" ? TOKENS.gold : TOKENS.line}`, background: prepVisibility === "hidden_until_start" ? TOKENS.card : "transparent", opacity: isPlus ? 1 : 0.55, cursor: isPlus ? "pointer" : "not-allowed" }}>
                    <Check size={14} className="mt-0.5 shrink-0" style={{ color: prepVisibility === "hidden_until_start" ? TOKENS.gold : "transparent" }} />
                    <span className="flex-1"><span className="text-[13px] font-medium flex items-center gap-1.5">Reveal when the session starts {!isPlus && <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5" style={{ background: TOKENS.gold, color: TOKENS.card, fontFamily: "'IBM Plex Mono', monospace" }}>Plus</span>}</span><span className="text-[12px]" style={{ color: "#5C5A48" }}>Stays hidden so no one reads ahead.</span></span>
                  </button>
                  <div className="flex items-center justify-between mt-4">
                    {isPlus ? (
                      <button onClick={() => setSavedAsDefault((v) => !v)} className="text-[12px] flex items-center gap-1.5" style={{ color: savedAsDefault ? TOKENS.sage : "#5C5A48" }}><Sparkles size={13} style={{ color: TOKENS.gold }} />{savedAsDefault ? "Saved as this club's default set" : "Save these as a reusable club default"}</button>
                    ) : (
                      <div className="text-[12px] flex items-center gap-1.5" style={{ color: "#8A8570" }}><Sparkles size={13} style={{ color: TOKENS.gold }} /> Saving a reusable question set is a Plus feature.</div>
                    )}
                  </div>
                </div>
              </IndexCard>
            </div>

            <div className="mt-10 flex items-center justify-between border-t pt-6" style={{ borderColor: TOKENS.line }}>
              <div className="text-[13px]" style={{ color: "#5C5A48" }}>{Object.keys(claims).length + roles.filter((r) => r.type !== "open").length} of {roles.length} roles filled</div>
              <button onClick={() => setStep(5)} className="text-[13px] font-medium px-4 py-2.5 flex items-center gap-1.5" style={{ background: TOKENS.sage, color: TOKENS.card }}>Send the invite <ArrowRight size={14} /></button>
            </div>
          </div>
        )}

        {/* STEP 5 — club home */}
        {step === 5 && template && (
          <div>
            <div className="text-[11px] uppercase tracking-wider mb-6 flex items-center gap-1.5" style={{ fontFamily: "'IBM Plex Mono', monospace", color: TOKENS.sage }}><Check size={13} /> Invite sent — this is the club's home from now on</div>
            <div className="grid md:grid-cols-[1.3fr_1fr] gap-8">
              <div>
                <h1 className="text-2xl mb-1" style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}>{clubName || "Unnamed club"}</h1>
                <div className="text-[13px] mb-6" style={{ color: "#5C5A48" }}>{cadence || "no cadence set"} · {roles.length} roles · {members.length} members</div>

                <IndexCard rotate={-0.4} className="p-5 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[11px] uppercase tracking-wider" style={{ fontFamily: "'IBM Plex Mono', monospace", color: TOKENS.sage }}>Next up</div>
                    <div className="text-[11px] px-2 py-0.5" style={{ background: TOKENS.gold, color: TOKENS.card }}>Confirmed</div>
                  </div>
                  <div className="flex items-center gap-2 text-[15px] font-medium mb-1"><Calendar size={15} style={{ color: TOKENS.sage }} /> {lockedDate?.date}{lockedDate?.time ? ` · ${lockedDate.time}` : ""}</div>
                  <div className="flex items-center gap-2 text-[13px]" style={{ color: "#5C5A48" }}><MapPin size={13} /> {currentLocation}</div>
                  <div className="mt-4 pt-4 flex flex-wrap gap-1.5" style={{ borderTop: `1px solid ${TOKENS.line}` }}>
                    {roles.map((r) => {
                      const filled = r.type !== "open" ? (r.type === "fixed" ? currentLocation : "rotation") : claims[r.id];
                      return <div key={r.id} className="text-[11px] px-2 py-1" style={{ border: `1px solid ${filled ? TOKENS.line : TOKENS.rust}`, color: filled ? "#5C5A48" : TOKENS.rust }}>{r.label}{filled ? ` — ${filled}` : " (open)"}</div>;
                    })}
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <button onClick={() => setStep(4)} className="text-[12px]" style={{ color: TOKENS.sage, textDecoration: "underline" }}>Edit roster</button>
                    {!sessionComplete && <button onClick={() => setShowRecap(true)} className="text-[12px] ml-auto px-2.5 py-1" style={{ background: TOKENS.ink, color: TOKENS.card }}>Mark session complete</button>}
                  </div>
                </IndexCard>

                {prepNotes.trim() && (
                  <IndexCard rotate={0.4} className="p-5 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[11px] uppercase tracking-wider" style={{ fontFamily: "'IBM Plex Mono', monospace", color: TOKENS.sage }}>Prep notes</div>
                      <div className="text-[10px] uppercase tracking-wider px-2 py-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace", border: `1px solid ${TOKENS.line}`, color: "#8A8570" }}>{prepVisibility === "shared" ? "Visible to members now" : "Hidden until start"}</div>
                    </div>
                    {prepVisibility === "shared" ? (
                      <div className="text-[13px] whitespace-pre-line" style={{ color: "#3C4038", lineHeight: 1.6 }}>{prepNotes}</div>
                    ) : (
                      <div className="text-[13px] italic flex items-center gap-1.5" style={{ color: "#8A8570" }}><RotateCw size={13} /> Members see these the moment the session starts.</div>
                    )}
                  </IndexCard>
                )}

                {showRecap && !sessionComplete && (
                  <IndexCard rotate={0.3} className="p-5 mb-6" style={{ borderColor: TOKENS.gold, borderWidth: 1.5 }}>
                    <div className="text-[11px] uppercase tracking-wider mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace", color: TOKENS.sage }}>How'd it go?</div>
                    <textarea value={recapNote} onChange={(e) => setRecapNote(e.target.value)} placeholder="A line or two for the log..." rows={3} className="w-full px-3 py-2 text-[13px] outline-none mb-3" style={{ background: TOKENS.paper, border: `1px solid ${TOKENS.line}` }} />
                    <button onClick={completeSession} className="text-[12px] font-medium px-3 py-1.5" style={{ background: TOKENS.sage, color: TOKENS.card }}>Save to history &amp; bump host order</button>
                  </IndexCard>
                )}

                {sessionComplete && (
                  <IndexCard rotate={-0.3} className="p-4 mb-6" style={{ borderColor: TOKENS.sage, borderWidth: 1.5 }}>
                    <div className="flex items-center gap-1.5 text-[13px]" style={{ color: TOKENS.sage, fontWeight: 600 }}><Check size={14} /> Logged.{locationMode === "rotating" && members.length ? ` ${members[currentHostIdx]?.name} is now up next.` : ""}</div>
                  </IndexCard>
                )}

                <div className="text-[11px] uppercase tracking-wider mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace", color: TOKENS.sage }}>History</div>
                {history.length === 0 ? (
                  <div className="text-[12px] italic" style={{ color: "#8A8570" }}>Nothing logged yet — this fills in as sessions wrap.</div>
                ) : (
                  <div className="space-y-3">
                    {history.map((p, i) => (
                      <IndexCard key={i} rotate={i % 2 === 0 ? 0.5 : -0.5} className="p-4">
                        <div className="text-[12px] mb-1" style={{ fontFamily: "'IBM Plex Mono', monospace", color: TOKENS.sage }}>{p.date} · {p.host}</div>
                        <div className="text-[13px]" style={{ color: "#3C4038" }}>{p.note}</div>
                      </IndexCard>
                    ))}
                  </div>
                )}
              </div>

              <div>
                {locationMode === "rotating" && (
                  <>
                    <div className="text-[11px] uppercase tracking-wider mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace", color: TOKENS.sage }}>Host order</div>
                    <IndexCard rotate={0.3} className="p-4 mb-6">
                      <div className="space-y-2 text-[13px]">
                        {members.map((m, i) => (
                          <div key={m.id} className="flex items-center justify-between">
                            <span style={{ color: i === currentHostIdx ? TOKENS.ink : "#8A8570", fontWeight: i === currentHostIdx ? 600 : 400 }}>{i + 1}. {m.name}</span>
                            {i === currentHostIdx && <span className="text-[10px] px-1.5 py-0.5" style={{ background: TOKENS.gold, color: TOKENS.card }}>up next</span>}
                          </div>
                        ))}
                      </div>
                    </IndexCard>
                  </>
                )}

                <div className="flex items-start gap-2 text-[12px] mb-6" style={{ color: "#5C5A48" }}><RotateCw size={14} className="mt-0.5 shrink-0" style={{ color: TOKENS.sage }} /> When this session wraps, Rotation bumps the host order and opens date voting for the next one automatically.</div>

                <div className="text-[11px] uppercase tracking-wider mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace", color: TOKENS.sage }}>What people get texted</div>
                <div className="space-y-2">
                  {[
                    roles.some((r) => r.type === "open" && !claims[r.id]) && `"A role's still open for ${clubName || "your club"} on ${lockedDate?.date} — grab one?"`,
                    lockedDate && `"Reminder: ${clubName || "your club"} is coming up — ${lockedDate.date}${lockedDate.time ? " at " + lockedDate.time : ""}."`,
                    sessionComplete && locationMode === "rotating" && members.length && `"${members[currentHostIdx]?.name}'s up to host next — Rotation opened date voting."`,
                  ].filter(Boolean).map((msg, i) => (
                    <div key={i} className="text-[12px] px-3 py-2" style={{ background: TOKENS.card, border: `1px solid ${TOKENS.line}`, color: "#3C4038" }}>{msg}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
