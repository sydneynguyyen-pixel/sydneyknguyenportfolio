/* Shoal: the same family plan, seen by everyone else. Nurse or doula, trusted circle, kids and teens,
   and volunteers with the family's volunteer code each get their own small view. Uses state and helpers from app.js and main-app.js. */

const ROLES = [
  { id: "main", screen: "home", who: "You", label: "Main caregiver", sees: "The whole plan: every jar, task, and stone." },
  { id: "nurse", screen: "asNurse", who: "Ana", label: "Nurse or doula", sees: "Visits, the care notes the family shares, meds and allergies (view only), and what she's asked for." },
  { id: "trusted", screen: "asTrusted", who: "Nora", label: "Trusted circle", sees: "Her own tasks and light ones she can pick up. No medical details." },
  { id: "kid", screen: "asKid", who: "Leo", label: "Kid or teen", sees: "Their own small jobs, in plain words. Never urgent." },
  { id: "public", screen: "asPublic", who: "A volunteer", label: "Volunteer code", sees: "Only tasks the family shares. No names, no address." },
];
const ROLE_SCREENS = ROLES.filter((r) => r.id !== "main").map((r) => r.screen);
[...ROLE_SCREENS, "volunteerCode", "vcNotif", "vcThanks", "vcWall"].forEach((s) => APP_SCREENS.add(s));
APP_NAV.push("volunteerCode", "vcNotif", "vcThanks", "vcWall", ...ROLE_SCREENS);
const PUBLIC_CODE = "4821";

/* ---------- Data each view needs ---------- */

const roleTask = (id, n, who, w, k, when, extra = {}) => ({
  id, n, w, k, y: false, cat: "", on: true, pebble: false,
  kind: Array.isArray(when) ? "repeat" : "once",
  days: Array.isArray(when) ? when : ["Sat"],
  date: Array.isArray(when) ? addDays(3) : addDays(when),
  time: "", who, done: false, steps: [], notes: "", remote: false, ...extra,
});

// Leo, Nora, and the light or kid-friendly tasks they see, added once to whatever family is loaded.
// Nora, Leo, and their tasks. A sample family has them from the start; a real one gets them only when someone previews their view.
function roleCast() {
  if (!S.people.some((p) => p.id === "nora")) S.people.push({ id: "nora", name: "Nora", img: "avatar-nora.png", tier: "trusted", cap: 2, about: "Neighbor", invited: true, joined: true });
  if (!S.people.some((p) => p.id === "leo")) S.people.push({ id: "leo", name: "Leo", tier: "kid", cap: 2, about: `${L()}'s grandson, 14`, invited: true, joined: true });
  const l = L();
  const add = (t) => { if (!S.tasks.some((x) => x.id === t.id)) S.tasks.push(t); };
  if (!S.tasks.some((t) => t.on && t.who === "nora")) add(roleTask("rn1", "Bring in the mail", "nora", 1, "there", ["Mon", "Thu"]));
  add(roleTask("rn2", "Drop off a library book", null, 1, "drive", 3));
  add(roleTask("rn3", "Walk the dog after lunch", null, 1, "there", ["Wed"], { y: true }));
  add(roleTask("rk1", `Read the paper to ${l}`, "leo", 1, "there", ["Tue", "Sat"], { y: true }));
  add(roleTask("rk2", "Water the plants", "leo", 1, "there", ["Wed"], { y: true }));
  add(roleTask("rk3", `Make a card for ${l}`, null, 1, "there", 4, { y: true }));
}
function ensureRoles() {
  if (S.app.roles) return;
  if (S.app.demo) roleCast();
  S.app.roles = {
    visits: [
      { id: "v1", day: addDays(0), time: "10:00", done: true, note: "Comfortable today. Ate a little breakfast." },
      { id: "v2", day: addDays(2), time: "10:00", done: false, note: "" },
      { id: "v3", day: addDays(4), time: "14:00", done: false, note: "" },
    ],
    visitFor: null, visitNote: "", asks: [],
    code: "", joined: false, volunteer: "", claimFor: null, thanks: null, wall: true,
    open: [
      { id: "p2", n: "Order warm socks online", m: "This week · from the family's wish list", short: "ordering warm socks", taken: false, done: false },
      { id: "p3", n: "Order groceries online", m: "Fridays · from anywhere", short: "ordering groceries", taken: false, done: false },
    ],
    paused: false,
  };
}
const baseEnsureAppData = ensureAppData;
ensureAppData = function () { baseEnsureAppData(); ensureRoles(); };

// What the main caregiver hears back from the other views.
const baseNotifications = notifications;
notifications = function () {
  const R = S.app.roles, list = [];
  if (R) {
    R.visits.filter((v) => v.done && v.id !== "v1").forEach((v) => list.push({ kind: "done", when: "Today", who: { name: "Ana" }, n: "Ana checked in after the visit", m: v.note || "Visit done", act: "", id: "" }));
    R.asks.forEach((a) => list.push({ kind: "request", needs: !task(a.task)?.who, cta: "Open", when: "Today", who: { name: "Ana" }, n: `Ana asked for “${a.n}”`, m: "It's in the open tasks", act: "openTask", id: a.task }));
    if (R.volunteer) R.open.filter((x) => x.taken).forEach((x) => list.push(x.done
      ? { kind: "done", needs: !x.thanked, cta: "Make a card", when: "Today", who: { name: R.volunteer }, n: `${R.volunteer} did “${x.n}”`, m: x.thanked ? "You sent a card" : "With your volunteer code. Make them a card?", act: x.thanked ? "" : "vcThank", id: x.id }
      : { kind: "done", when: "Today", who: { name: R.volunteer }, n: `${R.volunteer} is doing “${x.n}”`, m: "With your volunteer code", act: "", id: "" }));
  }
  return [...list, ...baseNotifications()];
};
const task = (id) => S.tasks.find((t) => t.id === id);

/* ---------- Shared pieces ---------- */

function rolebar(r) {
  return `<div class="rolebar">
    <button class="rb-who" data-act="roleSheet">${avatar({ name: r.who, img: r.id === "trusted" ? "avatar-nora.png" : "" }, "s20")}<span>Viewing as <b>${esc(r.who)}</b> · ${r.label}</span><em>Switch</em></button>
    <button class="x-btn" data-act="roleExit" aria-label="Back to your view">×</button>
  </div>`;
}
const roleOf = (screen) => ROLES.find((r) => r.screen === screen);
const sees = (txt) => `<div class="card info left sees">${icon("settings")}<span class="small">${txt}</span></div>`;

/* ---------- Nurse or doula ---------- */

SCREENS.asNurse = () => {
  const R = S.app.roles;
  const next = R.visits.find((v) => !v.done);
  const home = S.tasks.find((t) => t.on && !t.done && /nurse visit/i.test(t.n));
  const homeLine = home?.who ? `${nameOf(home.who)} will be home` : "No one has said they'll be home yet";
  const dayName = (d) => (d === iso(TODAY) ? "Today" : fmtDate(d));
  const notes = [
    ["Mom", `Morning meds at 8. ${L()} takes them with applesauce.`],
    ["You", S.tasks.find((t) => t.notes && t.k === "meds")?.notes || "The pill box is filled on Sundays."],
    ["Bill", "The stair rail is loose. Please use the back door."],
  ];
  return `<div class="content app">
    ${rolebar(roleOf("asNurse"))}
    <p class="eyebrow grey">${esc(L())}'s care team · Hospice nurse</p>
    <h1 class="title">Hi, Ana</h1>
    ${next ? `<div class="card next-visit">
      <p class="eyebrow">Next visit</p>
      <p class="nv-when">${dayName(next.day)} · ${fmtTime(next.time)}</p>
      <p class="nv-home ${home?.who ? "" : "warn"}">${home?.who ? gem("progress", { size: "xs" }) : gem("urgent", { size: "xs" })}${homeLine}</p>
      <button class="btn-primary" data-act="visitSheet" data-id="${next.id}">Check in after the visit</button>
    </div>` : `<div class="card info left">${gem("done", { size: "s" })}<span class="small">All of this week's visits are done.</span></div>`}
    <p class="section-h">This week</p>
    <div class="card tlist">${R.visits.map((v) => `<div class="tline ${v.done ? "is-done" : ""}"><div class="tl-main">${gem(v.done ? "done" : "progress")}
      <span class="tl-txt"><span class="n">${dayName(v.day)} · ${fmtTime(v.time)}</span><span class="m">${v.done ? esc(v.note || "Checked in") : "Home visit"}</span></span></div>
      ${v.done ? `<span class="small muted">Done</span>` : `<button class="pill-btn" data-act="visitSheet" data-id="${v.id}">Check in</button>`}</div>`).join("")}</div>
    <p class="section-h">Notes from the family</p>
    <div class="card tlist">${notes.map(([who, n]) => `<div class="tline"><div class="tl-main">${avatar(S.people.find((p) => p.name === who) || { name: who }, "s36")}
      <span class="tl-txt"><span class="m">${esc(who)}</span><span class="n wrap">${esc(n)}</span></span></div></div>`).join("")}</div>
    <p class="section-h">You asked the family for<button class="linkish" data-act="askSheet">Ask for something</button></p>
    ${R.asks.length ? `<div class="card tlist">${R.asks.map((a) => { const t = task(a.task); return `<div class="tline"><div class="tl-main">${gemOf(t)}
      <span class="tl-txt"><span class="n">${esc(a.n)}</span><span class="m">${t.done ? "Done" : t.who ? `${nameOf(t.who)} has it` : "Waiting for someone to take it"}</span></span></div></div>`; }).join("")}</div>`
      : `<button class="btn-wide" data-act="askSheet">Ask the family for something</button>`}
    ${sees("Ana sees visit times, the notes the family shares, meds and allergies (view only), and what she's asked for. She doesn't see the family's other tasks or who's doing more.")}
  </div>`;
};

/* ---------- Trusted circle ---------- */

SCREENS.asTrusted = () => {
  const R = S.app.roles;
  const mineN = S.tasks.filter((t) => t.on && t.who === "nora");
  const open = S.tasks.filter((t) => t.on && !t.done && !t.who && t.w === 1);
  return `<div class="content app">
    ${rolebar(roleOf("asTrusted"))}
    <div class="tc-top">${lockup(22)}<span class="small muted">Link from a text</span></div>
    <h1 class="title">Hi, Nora</h1>
    <p class="sub">Mom added you to ${esc(possessive({ name: L() }))} trusted circle. Thank you for helping.</p>
    <p class="section-h">Yours</p>
    <div class="card tlist">${mineN.length ? mineN.map((t) => `<div class="tline ${t.done ? "is-done" : ""}"><div class="tl-main">${gemOf(t)}
      <span class="tl-txt"><span class="n">${esc(t.n)}</span><span class="m">${t.done ? "Done. The family can see it." : whenLabel(t)}</span></span></div>
      ${t.done ? "" : `<button class="pill-btn" data-act="roleDone" data-id="${t.id}">Mark done</button>`}</div>`).join("") : `<p class="small empty">Nothing yet. Pick one below if you have time.</p>`}</div>
    <p class="section-h">Could you help with one?</p>
    ${R.paused ? `<div class="card info left">${gem("done", { size: "s" })}<span class="small">You said this week is busy. We won't ask until next week. <button class="linkish" data-act="rolePause">I have time after all</button></span></div>`
      : open.length ? `<div class="card tlist">${open.map((t) => `<div class="tline"><div class="tl-main">${gemOf(t)}
      <span class="tl-txt"><span class="n">${esc(t.n)}</span><span class="m">${whenLabel(t)}</span></span></div>
      <button class="pill-btn" data-act="roleClaim" data-id="${t.id}" data-who="nora">I can do it</button></div>`).join("")}</div>
      <button class="btn-wide" data-act="rolePause">I'm busy this week</button>` : `<div class="card info left">${gem("done", { size: "s" })}<span class="small">Nothing open right now.</span></div>`}
    <p class="section-h">For you</p>
    <div class="card thanks-in">${avatar(S.people.find((p) => p.id === "mom") || { name: "Mom" }, "s36")}<span class="tl-txt"><span class="m">Mom said thanks</span><span class="n wrap">“You bringing in the mail is one less thing. Thank you, Nora.”</span></span></div>
    ${sees("Nora only sees light tasks the family shares with the trusted circle. No medical details, and no one else's jar.")}
  </div>`;
};

/* ---------- Kids and teens ---------- */

SCREENS.asKid = () => {
  const jobs = S.tasks.filter((t) => t.on && t.who === "leo");
  const extra = S.tasks.filter((t) => t.on && !t.done && !t.who && t.y);
  const helped = jobs.filter((t) => t.done).length + 2;
  return `<div class="content app kid">
    ${rolebar(roleOf("asKid"))}
    <h1 class="title">Hey Leo</h1>
    <p class="sub">Here's how you're helping ${esc(L())} this week.</p>
    <div class="card kid-streak">${gem("done", { size: "s" })}${gem("done", { size: "s" })}${gem(helped > 2 ? "done" : "open", { size: "s" })}
      <span><b>You helped ${helped} times</b> this week</span></div>
    <p class="section-h">Your jobs</p>
    ${jobs.map((t) => `<div class="card kid-job ${t.done ? "is-done" : ""}">${gemOf(t, { size: "m" })}
      <span class="tl-txt"><span class="n">${esc(t.n)}</span><span class="m">${t.done ? "Done. Nice work." : whenLabel(t)}</span></span>
      ${t.done ? "" : `<button class="btn-primary sm" data-act="kidDone" data-id="${t.id}">I did it</button>`}</div>`).join("")}
    ${extra.length ? `<p class="section-h">Want to do one more?</p>
    ${extra.map((t) => `<div class="card kid-job">${gemOf(t, { size: "m" })}<span class="tl-txt"><span class="n">${esc(t.n)}</span><span class="m">${whenLabel(t)}</span></span>
      <button class="btn-soft sm" data-act="roleClaim" data-id="${t.id}" data-who="leo">I'll do it</button></div>`).join("")}` : ""}
    ${sees("Leo only sees kid-friendly jobs. Nothing about medicine, money, or how sick his grandpa is.")}
  </div>`;
};

/* ---------- Public code ---------- */

SCREENS.asPublic = () => {
  const R = S.app.roles, on = S.app.prefs.publicCode;
  if (!R.joined) return `<div class="content app">
    ${rolebar(roleOf("asPublic"))}
    <div class="tc-top">${lockup(22)}</div>
    <h1 class="title">Got a code?</h1>
    <p class="sub">A family shared a code so neighbors and volunteers can help from anywhere. You'll only see remote tasks, never names or addresses.</p>
    <label class="card field"><p class="eyebrow grey">Family code</p><input data-input="roleCode" inputmode="numeric" placeholder="4-digit code" value="${esc(R.code)}" aria-label="Family code"></label>
    <button class="btn-primary" data-act="roleJoin">See how I can help</button>
    <p class="small center-text">For the demo, the code is <b>${PUBLIC_CODE}</b>.${on ? "" : " The family's code is off right now."}</p>
    ${on ? "" : `<button class="btn-wide" data-act="rolePublicOn">Turn the code on (as the family)</button>`}
    ${sees("The family turns the code on in People. They can turn it off anytime, and the code stops working.")}
  </div>`;
  return `<div class="content app">
    ${rolebar(roleOf("asPublic"))}
    <div class="tc-top">${lockup(22)}<span class="small muted">Code ${PUBLIC_CODE}</span></div>
    <h1 class="title">${R.volunteer ? `Thanks, ${esc(R.volunteer)}` : "How you can help"}</h1>
    <p class="sub">A family nearby is caring for someone at home. These are things anyone can do from anywhere.</p>
    <div class="card tlist">${R.open.map((x) => `<div class="tline"><div class="tl-main">${gem(x.done ? "done" : x.taken ? "progress" : "open")}
      <span class="tl-txt"><span class="n">${esc(x.n)}</span><span class="m">${x.thanked ? "Done · the family sent you a card" : x.done ? "Done · the family got a notification" : x.taken ? "You've got this one" : esc(x.m)}</span></span></div>
      ${x.thanked ? `<button class="pill-btn" data-act="go" data-to="vcWall">See it</button>` : x.done ? "" : x.taken ? `<button class="pill-btn" data-act="vcDone" data-id="${x.id}">Mark done</button>` : `<button class="pill-btn" data-act="publicClaim" data-id="${x.id}">I can help</button>`}</div>`).join("")}</div>
    <button class="btn-wide" data-act="go" data-to="vcWall">See the thanks wall</button>
    ${sees("Volunteers see remote tasks only. The family sees just their first name.")}
    <button class="btn-text center" data-act="publicLeave">Use a different code</button>
  </div>`;
};

/* ---------- Volunteer code, as the family sees it ---------- */

const VC_STEPS = [
  ["Share the code", "Text it, post it, or put it in a church bulletin."],
  ["They enter it in Shoal", "Volunteers only see the tasks you share below."],
  ["Someone does a task", "You get a notification with their first name, and can send them a card."],
];
SCREENS.volunteerCode = () => {
  const R = S.app.roles, on = S.app.prefs.publicCode;
  return `${navtop("People")}
  <div class="content">
    <p class="eyebrow">Extended circle</p>
    <h1 class="title">Volunteer code</h1>
    <p class="sub">A 4-digit code for people outside the family who want to help, like neighbors, a church group, or coworkers.</p>
    <div class="card vc-code ${on ? "" : "off"}">
      <div class="vc-digits" aria-label="Code ${PUBLIC_CODE.split("").join(" ")}">${PUBLIC_CODE.split("").map((d) => `<span>${d}</span>`).join("")}</div>
      <div class="vc-row"><span class="tl-txt"><span class="n">${on ? "Code is on" : "Code is off"}</span><span class="m">${on ? "Anyone with it can offer help" : "No one can use it right now"}</span></span>${toggle(on, "pref", "publicCode", "Volunteer code")}</div>
      ${on ? `<div class="actions"><button class="btn-soft" data-act="vcShare">Share code</button><button class="btn-soft" data-act="vcNew">Make a new one</button></div>` : ""}
    </div>
    <p class="section-h">How it works</p>
    <div class="card steps-list">${VC_STEPS.map(([t, d], i) => `<div class="step"><span class="num">${i + 1}</span><span><b>${t}</b><small>${d}</small></span></div>`).join("")}</div>
    <p class="section-h">Shared with volunteers</p>
    <div class="card tlist">${R.open.map((x) => `<div class="tline"><div class="tl-main">${gem(x.taken ? "progress" : "open")}
        <span class="tl-txt"><span class="n">${esc(x.n)}</span><span class="m">${x.done ? `${esc(R.volunteer || "A volunteer")} did this` : x.taken ? `${esc(R.volunteer || "A volunteer")} has this one` : esc(x.m)}</span></span></div>
        ${x.thanked ? `<span class="small muted">Card sent</span>` : x.done ? `<button class="pill-btn" data-act="vcThank" data-id="${x.id}">Make a card</button>` : x.taken ? "" : `<button class="pill-btn" data-act="vcUnshare" data-id="${x.id}">Stop</button>`}</div>`).join("") || `<p class="small empty">Nothing shared yet.</p>`}
      <button class="more" data-act="vcAddSheet">Share another task${chev}</button></div>
    <div class="can-grid">
      <div class="card can"><p class="eyebrow">Volunteers see</p><p class="ci yes">Tasks you share here</p><p class="ci yes">That a family needs help</p></div>
      <div class="card can"><p class="eyebrow grey">They never see</p><p class="ci no">Names or the address</p><p class="ci no">Medical details or jars</p></div>
    </div>
    <button class="btn-wide" data-act="roleGo" data-to="asPublic">See what volunteers see</button>
  </div>`;
};

/* ---------- A volunteer did a task: the family hears about it ---------- */

const doneByVolunteer = () => { const R = S.app.roles; return R.open.find((o) => o.id === R.thankTask) || R.open.find((o) => o.done && !o.thanked) || R.open.find((o) => o.done); };

// The family's lock screen, with the notification held open (outside.js draws the lock screen).
SCREENS.vcNotif = () => {
  const R = S.app.roles, x = doneByVolunteer(), name = R.volunteer || "A volunteer";
  return `<div class="os os-lock os-dim">
    ${lockTop(osData())}
    <div class="os-expanded">
      <div class="os-x-card">
        <span class="os-note-top">${osIcon(26)}<b>Shoal</b><em>now</em></span>
        <p class="os-x-title">${esc(name)} helped with your volunteer code</p>
        <p class="os-x-task">${esc(x ? x.n : "A shared task")}</p>
        <p class="os-x-meta">Done today · from your wish list</p>
      </div>
      <div class="os-x-acts"><button data-act="vcThankOs" data-id="${x ? x.id : ""}">Make ${esc(name)} a card</button><button data-act="osOpenApp" data-to="volunteerCode">Open in Shoal</button></div>
    </div>
    <span class="os-bar" aria-hidden="true"></span>
  </div>`;
};

/* ---------- The family makes the volunteer a card ---------- */

// The same card as the family's thank-you cards (thanks.js). Volunteers never see names, so it's from "the family".
SCREENS.vcThanks = () => {
  const R = S.app.roles, x = doneByVolunteer(), name = R.volunteer || "A volunteer", th = cardTheme();
  return `${navtop("Volunteer code")}
  <div class="content thanks2">
    <p class="eyebrow grey">${esc(name)} helped with your volunteer code</p>
    <h1 class="title">Make ${esc(name)} a card</h1>
    <p class="small">For “${esc(x ? x.n : "a shared task")}” · Today</p>

    <div class="ty-card" data-theme="${th}">
      <div class="ty-art">${themeArt(th)}</div>
      <div class="ty-paper">
        <span class="ty-to">${esc(name)},</span>
        <textarea class="ty-note" data-input="thanksNote" maxlength="160" rows="3" aria-label="Your note" placeholder="Write a short note in your own words…">${esc(S.app.thanksNote)}</textarea>
        <span class="ty-from">From the family</span>
      </div>
    </div>

    <p class="section-h left">Theme</p>
    <div class="ty-themes" role="radiogroup" aria-label="Card theme">${CARD_THEMES.map(([k, l]) => `<button role="radio" aria-checked="${k === th}" class="${k === th ? "on" : ""}" data-act="thankTheme" data-id="${k}"><span class="ty-sw">${themeArt(k)}</span><em>${l}</em></button>`).join("")}</div>

    <div class="card tlist left"><div class="srow"><span class="tl-txt"><span class="n">Post it on the thanks wall</span><span class="m">Volunteers see the card and ${esc(name)}'s first name. Never your names.</span></span>${toggle(R.wall, "vcWallToggle", "", "Post it on the thanks wall")}</div></div>
  </div>
  ${solo("Send card", "vcSendThanks")}`;
};

/* ---------- The thanks wall: cards families sent to volunteers ---------- */

// Everyone with a family's code can see it. Volunteers show by first name; families never show at all.
const WALL = [
  { to: "Marcus", theme: "tea", note: "The groceries came the day we ran out of everything. Thank you.", for: "ordering groceries", when: "Yesterday" },
  { to: "Priya", theme: "bloom", note: "The playlist is on every afternoon now. It helps the room feel calm.", for: "making an afternoon playlist", when: "2 days ago" },
  { to: "Dev", theme: "stars", note: "You found us respite care when we couldn't think straight. We slept.", for: "looking up respite care nearby", when: "This week" },
];
SCREENS.vcWall = () => {
  const R = S.app.roles, mine = R.thanks && R.thanks.wall !== false ? R.thanks : null;
  const post = (c, you) => `<article class="wall-post ${you ? "you" : ""}">
      <div class="wall-art">${themeArt(c.theme)}</div>
      <div class="wall-body">
        ${you ? `<span class="wall-tag">For you</span>` : ""}
        <span class="ty-to">${esc(c.to)},</span>
        <p class="wall-note">${esc(c.note)}</p>
        <p class="wall-meta">From a family, for ${esc(c.for)} · ${esc(c.when)}</p>
      </div></article>`;
  return `${navtop("How you can help")}
  <div class="content">
    <h1 class="title">Thanks wall</h1>
    <p class="sub">Cards families sent to the volunteers who helped them. Families stay anonymous.</p>
    <div class="wall">${mine ? post(mine, true) : ""}${WALL.map((c) => post(c)).join("")}</div>
  </div>`;
};

/* ---------- Actions ---------- */

Object.assign(NOTES, {
  volunteerCode: ["Volunteer code", ["Renamed from “Public code”: testers didn't know what that meant.", "Explains who it's for, how it works, and what volunteers can and can't see. The family picks which tasks to share."]],
  vcNotif: ["A volunteer did a task", ["When a volunteer marks a shared task done, the family gets a notification with their first name.", "Hold it to make them a thank-you card right away."]],
  vcThanks: ["Thank a volunteer", ["The family makes the volunteer a card: the same themes as the family's own thank-you cards.", "It's signed “From the family”, since volunteers never see names. The family can post it on the thanks wall."]],
  vcWall: ["Thanks wall", ["Cards families sent to volunteers, open to anyone with a family's code.", "Volunteers show by first name. Families never show, only what the volunteer did."]],
  asNurse: ["View: nurse or doula", ["Ana, the hospice nurse, sees visits and the notes the family shares with her.", "Checking in after a visit sends a note to the family. Asking for something adds an open task to the family's plan."]],
  asTrusted: ["View: trusted circle", ["Nora gets a text link, not the app. She sees her own tasks and light ones she can pick up.", "Taking one puts it in her name for the whole family."]],
  asKid: ["View: kid or teen", ["Leo sees kid-friendly jobs only, in plain words, with a count of how much he's helped.", "No medical details or due-date pressure."]],
  asPublic: ["View: volunteer code", ["Anyone with the family's code can help with remote tasks. They never see names or the address.", "The code only works while the family has it on in People."]],
});

Object.assign(APP_INPUT, {
  roleCode: (v) => { S.app.roles.code = v.replace(/\D/g, "").slice(0, 4); },
  visitNote: (v) => { S.app.roles.visitNote = v; },
  volunteerName: (v) => { S.app.roles.volunteer = v.trim(); },
});

function roleSwitch(screen) {
  ensureAppData();
  if (screen === "home") { tabTo("home"); return; }
  roleCast();
  tabTo(screen);
}

Object.assign(ACTIONS, {
  roleSheet: () => openSheet(`<h3>See Shoal as…</h3><p class="small">Everyone helps from their own view. Pick one to see what they see.</p>
    <div class="card tlist role-pick">${ROLES.map((r) => `<button class="srow ${S.screen === r.screen ? "on" : ""}" data-act="roleGo" data-to="${r.screen}">
      ${avatar({ name: r.who, img: r.id === "main" ? "avatar-you.png" : r.id === "trusted" ? "avatar-nora.png" : "" }, "s36")}
      <span class="tl-txt"><span class="n">${r.label}${r.id === "main" ? "" : ` · ${esc(r.who)}`}</span><span class="m">${r.sees}</span></span>${chev}</button>`).join("")}</div>
    ${typeof invitee === "function" && invitee() ? `<button class="btn-wide" data-act="invitePreview">New helper's first look: ${esc(invitee().name)} opens the invite</button>` : ""}`),
  roleGo: (d) => { closeSheet(); roleSwitch(d.to); },
  roleExit: () => roleSwitch("home"),
  visitSheet: (d) => {
    const R = S.app.roles; R.visitFor = d.id; R.visitNote = "";
    openSheet(`<h3>How was the visit?</h3><p class="small">The family gets this right away.</p>
      <div class="chips">${["Comfortable today", "Ate a little", "Needs more pillows", "Call me tonight"].map((c) => `<button class="chip" data-act="visitChip" data-id="${c}">${c}</button>`).join("")}</div>
      <textarea class="note-input" data-input="visitNote" placeholder="Anything else they should know?"></textarea>
      <button class="btn-primary" data-act="visitSend">Send to the family</button>`);
  },
  visitChip: (d) => {
    const R = S.app.roles, el = document.querySelector('#sheet [data-input="visitNote"]');
    R.visitNote = R.visitNote ? `${R.visitNote.replace(/\.?$/, ".")} ${d.id}.` : `${d.id}.`;
    if (el) el.value = R.visitNote;
  },
  visitSend: () => {
    const R = S.app.roles, v = R.visits.find((x) => x.id === R.visitFor);
    if (v) { v.done = true; v.note = R.visitNote.trim() || "Visit done. All okay."; }
    closeSheet(); render(); toast("Sent. The family will see it in notifications.");
  },
  askSheet: () => openSheet(`<h3>Ask the family for something</h3><p class="small">It shows up in their open tasks, and whoever's free can take it.</p>
    <div class="card tlist">${["Pick up wound-care supplies", "Be home for the bed delivery", "Get more chux pads", "Call me about pain meds"].map((n) => `<button class="srow" data-act="askSend" data-id="${n}"><span class="tl-txt"><span class="n">${n}</span></span>${chev}</button>`).join("")}</div>`),
  askSend: (d) => {
    const id = `ra${Date.now()}`;
    S.tasks.push(roleTask(id, d.id, null, 1, "drive", 2, { notes: "Asked by Ana, the hospice nurse." }));
    S.app.roles.asks.push({ n: d.id, task: id });
    closeSheet(); render(); toast("Added to the family's open tasks");
  },
  roleDone: (d) => { const t = task(d.id); t.done = true; t.doneAt = "Today, now"; render(); toast("Marked done. The family can see it."); },
  roleClaim: (d) => { const t = task(d.id); t.who = d.who; render(); toast(`Thanks, ${nameOf(d.who)}. It's yours now.`); },
  rolePause: () => { S.app.roles.paused = !S.app.roles.paused; render(); if (S.app.roles.paused) toast("We'll let the family know"); },
  kidDone: (d) => {
    const t = task(d.id); t.done = true; t.doneAt = "Today, now"; render();
    openSheet(`<div class="center-col kid-yay">${gem("done", { size: "l" })}<h3>Nice work, Leo</h3>
      <p class="small">“${esc(t.n)}” is done. Your stone went dark, so the family knows. Mom will see it too.</p>
      <button class="btn-primary" data-act="closeSheet">Done</button></div>`);
  },
  roleJoin: () => {
    const R = S.app.roles;
    if (R.code !== PUBLIC_CODE) { toast("That code didn't work. Try 4821."); return; }
    if (!S.app.prefs.publicCode) { toast("This family's code is off right now"); return; }
    R.joined = true; render();
  },
  vcShare: () => toast(`Copied: “Want to help? Enter code ${PUBLIC_CODE} in Shoal.”`),
  vcNew: () => toast("New code made. The old one stops working."),
  vcDone: (d) => { const x = S.app.roles.open.find((o) => o.id === d.id); x.done = true; S.app.roles.thankTask = d.id; render(); toast("Done. The family got a notification."); },
  vcThank: (d) => { S.app.roles.thankTask = d.id; S.app.thanksNote = ""; go("vcThanks"); },
  // From the lock screen: open Shoal on the volunteer code, then the card, so Back works.
  vcThankOs: (d) => { S.app.roles.thankTask = d.id; S.app.thanksNote = ""; S.history = ["home", "volunteerCode"]; lastDir = "fade"; S.screen = "vcThanks"; render(); },
  vcWallToggle: () => { S.app.roles.wall = !S.app.roles.wall; render(); },
  vcSendThanks: () => {
    const R = S.app.roles, x = doneByVolunteer(), name = R.volunteer || "A volunteer";
    if (!S.app.thanksNote.trim()) { toast("Write a short note on the card first"); return; }
    if (x) x.thanked = true;
    R.thanks = { to: name, theme: cardTheme(), note: S.app.thanksNote.trim(), for: x ? x.short || x.n.toLowerCase() : "helping", when: "Today", wall: R.wall };
    back(); toast(R.wall ? `Card sent to ${name}, and posted on the thanks wall` : `Card sent to ${name}`);
  },
  vcUnshare: (d) => { const R = S.app.roles; R.open = R.open.filter((x) => x.id !== d.id); render(); toast("No longer shared with volunteers"); },
  vcAddSheet: () => {
    const shared = new Set(S.app.roles.open.map((x) => x.from));
    const list = active().filter((t) => !shared.has(t.id) && t.w === 1).slice(0, 8);
    openSheet(`<h3>Share a task with volunteers</h3><p class="small">Light tasks someone could do without visiting. Volunteers won't see who it's for.</p>
      <div class="card tlist">${list.map((t) => `<button class="srow" data-act="vcShareTask" data-id="${t.id}">${gemOf(t)}<span class="tl-txt"><span class="n">${esc(t.n)}</span></span><span class="paired-tag">Share</span></button>`).join("") || `<p class="small empty">No light tasks to share yet.</p>`}</div>`);
  },
  vcShareTask: (d) => {
    const t = S.tasks.find((x) => x.id === d.id);
    S.app.roles.open.push({ id: `s${t.id}`, from: t.id, n: t.n, m: "From anywhere · first come", taken: false });
    closeSheet(); render(); toast("Shared with volunteers");
  },
  rolePublicOn: () => { S.app.prefs.publicCode = true; render(); toast("Volunteer code is on"); },
  publicClaim: (d) => {
    const R = S.app.roles; R.claimFor = d.id;
    if (R.volunteer) { ACTIONS.publicConfirm(); return; }
    openSheet(`<h3>What's your first name?</h3><p class="small">The family sees only this. Nothing else about you.</p>
      <label class="card field"><input data-input="volunteerName" placeholder="First name" aria-label="First name" autocomplete="given-name"></label>
      <button class="btn-primary" data-act="publicConfirm">I can help</button>`);
  },
  publicConfirm: () => {
    const R = S.app.roles;
    if (!R.volunteer) { toast("Add your first name first"); return; }
    R.open.find((x) => x.id === R.claimFor).taken = true;
    closeSheet(); render(); toast(`Thanks, ${R.volunteer}. Mark it done when it's done.`);
  },
  publicLeave: () => { Object.assign(S.app.roles, { joined: false, code: "" }); render(); },
});
