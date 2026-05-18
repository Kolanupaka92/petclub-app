import { useState, useEffect } from "react";
import { INIT_CUSTOMER, INIT_PETS, TC, fmtDate, within } from "./data/mockData.js";
import { getGreeting, isDueSoon, daysUntil } from "./utils/dates.js";
import { loadPets, savePets } from "./utils/storage.js";
import {
  Stars,
  Badge,
  Modal,
  Field,
  Input,
  Select,
  Button,
  EmptyState,
  Toast,
} from "./components/ui.jsx";

const TAB_META = {
  grooming: { icon: "✂️", label: "Grooming" },
  training: { icon: "🎓", label: "Training" },
  food: { icon: "🍖", label: "Food" },
  vet: { icon: "🏥", label: "Vet" },
};

function petRecordCount(p) {
  return (
    p.records.grooming.length +
    p.records.training.length +
    p.records.food.length +
    p.records.vet.length
  );
}

export default function PetclubApp({ session, onLogout }) {
  const [customer] = useState({
    ...INIT_CUSTOMER,
    ...(session?.phone ? { phone: session.phone } : {}),
    ...(session?.email ? { email: session.email } : {}),
  });
  const [pets, setPets] = useState(() => loadPets(INIT_PETS));
  const [view, setView] = useState("dashboard");
  const [activePetId, setActivePetId] = useState(null);
  const [activeTab, setActiveTab] = useState("grooming");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");

  const pet = pets.find((p) => p.id === activePetId);
  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const goTo = (v) => {
    setView(v);
    if (v === "pets") setActivePetId(null);
  };

  const openPet = (id) => {
    setActivePetId(id);
    setActiveTab("grooming");
    setView("petDetail");
  };

  useEffect(() => {
    savePets(pets);
  }, [pets]);

  useEffect(() => {
    if (view === "petDetail" && activePetId && !pets.some((p) => p.id === activePetId)) {
      goTo("pets");
    }
  }, [view, activePetId, pets]);

  const addPet = () => {
    const name = form.name?.trim();
    if (!name) return;
    setPets((prev) => [
      ...prev,
      {
        id: `p${Date.now()}`,
        name,
        species: form.species || "dog",
        breed: form.breed || "Mixed",
        age: "",
        dob: "",
        weight: "",
        gender: "",
        color: "",
        chip: "",
        records: { grooming: [], training: [], food: [], vet: [] },
      },
    ]);
    setModal(null);
    setForm({});
    setToast({ message: `${name} added to your family! 🐾`, type: "success" });
  };

  const filt = (arr) => arr?.filter((r) => within(r.date, 9999)) || [];

  const totalRec = pets.reduce(
    (s, p) =>
      s + p.records.grooming.length + p.records.training.length + p.records.food.length + p.records.vet.length,
    0
  );

  const filteredPets = pets.filter(
    (p) =>
      !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.breed.toLowerCase().includes(search.toLowerCase())
  );

  const navItems = [
    { id: "dashboard", icon: "🏠", label: "Home" },
    { id: "pets", icon: "🐾", label: "Pets" },
    { id: "profile", icon: "👤", label: "Profile" },
  ];

  const AppHeader = () => (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 px-5 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-xl shrink-0 shadow-sm">
            {customer.avatar}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400 font-medium truncate">PETclub</p>
            <p className="text-sm font-bold text-gray-800 truncate">{customer.name.split(" ")[0]}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setModal("reminders")}
          className="relative w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-lg hover:bg-gray-100 transition-colors"
          aria-label="View reminders"
        >
          🔔
          {pets
            .flatMap((p) => p.records.vet.map((v) => ({ ...v, petName: p.name, petId: p.id })))
            .some((v) => v.nextDue && isDueSoon(v.nextDue, 30)) && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          )}
        </button>
      </div>
    </header>
  );

  const BottomNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-lg mx-auto nav-safe">
      <div className="bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-nav mx-2 mb-2 rounded-2xl flex">
        {navItems.map((n) => {
          const active = view === n.id || (view === "petDetail" && n.id === "pets");
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => goTo(n.id)}
              className={`flex-1 flex flex-col items-center py-2.5 text-[11px] font-semibold transition-all duration-200 relative ${
                active ? "text-brand-500" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {active && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand-500 rounded-full" />
              )}
              <span className={`text-xl mb-0.5 transition-transform ${active ? "scale-110" : ""}`}>{n.icon}</span>
              {n.label}
            </button>
          );
        })}
      </div>
    </nav>
  );

  const Dashboard = () => {
    const upcoming = pets
      .flatMap((p) =>
        p.records.vet
          .filter((v) => v.nextDue && daysUntil(v.nextDue) >= 0 && daysUntil(v.nextDue) <= 90)
          .map((v) => ({ pet: p.name, detail: v.detail, due: v.nextDue, petId: p.id }))
      )
      .sort((a, b) => daysUntil(a.due) - daysUntil(b.due));

    const recent = pets
      .flatMap((p) => [
        ...p.records.grooming.map((r) => ({
          pet: p.name,
          petId: p.id,
          type: "grooming",
          icon: TAB_META.grooming.icon,
          label: r.service,
          by: r.by,
          date: r.date,
        })),
        ...p.records.training.map((r) => ({
          pet: p.name,
          petId: p.id,
          type: "training",
          icon: TAB_META.training.icon,
          label: r.session,
          by: r.by,
          date: r.date,
        })),
        ...p.records.food.map((r) => ({
          pet: p.name,
          petId: p.id,
          type: "food",
          icon: TAB_META.food.icon,
          label: r.product,
          by: r.brand,
          date: r.date,
        })),
        ...p.records.vet.map((r) => ({
          pet: p.name,
          petId: p.id,
          type: "vet",
          icon: TAB_META.vet.icon,
          label: r.detail,
          by: r.vet,
          date: r.date,
        })),
      ])
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    return (
      <div className="p-5 animate-fade-in">
        <h1 className="text-2xl font-extrabold text-gray-800 mb-0.5">
          {getGreeting()}, {customer.name.split(" ")[0]}! 👋
        </h1>
        <p className="text-gray-500 text-sm mb-5">Here&apos;s how your pets are doing today.</p>

        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { label: "My Pets", val: pets.length, icon: "🐾", bg: "from-orange-50 to-amber-50", tc: "text-brand-600", action: () => goTo("pets") },
            { label: "Care Records", val: totalRec, icon: "📋", bg: "from-blue-50 to-indigo-50", tc: "text-blue-600", action: () => pets[0] && openPet(pets[0].id) },
          ].map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={s.action}
              className={`bg-gradient-to-br ${s.bg} rounded-2xl p-4 text-left card-interactive border border-white/80`}
            >
              <p className="text-2xl mb-2">{s.icon}</p>
              <p className={`text-3xl font-extrabold ${s.tc}`}>{s.val}</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</p>
            </button>
          ))}
        </div>

        {pets.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-1 px-1 scrollbar-hide">
            {pets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => openPet(p.id)}
                className="shrink-0 flex items-center gap-2 bg-white border border-gray-100 rounded-full pl-1 pr-4 py-1 shadow-sm hover:border-orange-200 hover:shadow-md transition-all active:scale-95"
              >
                <span className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center text-lg">
                  {p.species === "dog" ? "🐕" : "🐈"}
                </span>
                <span className="text-sm font-semibold text-gray-700">{p.name}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setForm({ species: "dog" });
                setModal("addPet");
              }}
              className="shrink-0 flex items-center gap-1 text-brand-500 text-sm font-bold px-3 py-2 rounded-full border-2 border-dashed border-orange-200 hover:bg-orange-50 transition-colors"
            >
              + Add
            </button>
          </div>
        )}

        <section className="card p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-700">💉 Upcoming</h2>
            {upcoming.length > 0 && <Badge text={`${upcoming.length} due`} cls="bg-amber-100 text-amber-800" />}
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">All caught up — no vaccinations due soon.</p>
          ) : (
            <div className="space-y-1">
              {upcoming.map((u, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => openPet(u.petId)}
                  className="w-full flex justify-between items-center py-3 border-b border-gray-50 last:border-0 text-sm text-left hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
                >
                  <span className="font-semibold text-gray-800">
                    {u.pet} — {u.detail}
                  </span>
                  <Badge
                    text={daysUntil(u.due) === 0 ? "Today" : daysUntil(u.due) <= 7 ? `${daysUntil(u.due)}d` : fmtDate(u.due)}
                    cls={daysUntil(u.due) <= 7 ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-700"}
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="card p-5">
          <h2 className="font-bold text-gray-700 mb-3">🕐 Recent activity</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">No activity yet. Add a pet to get started!</p>
          ) : (
            <div className="space-y-1">
              {recent.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => openPet(r.petId)}
                  className="w-full flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-lg px-1 -mx-1 transition-colors text-left"
                >
                  <span
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${TC[r.type].light}`}
                  >
                    {r.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {r.pet} · {r.label}
                    </p>
                    <p className="text-xs text-gray-400">{r.by}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{fmtDate(r.date)}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  };

  const MyPets = () => (
    <div className="p-5 animate-fade-in">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">My Pets</h1>
          <p className="text-gray-500 text-sm">{pets.length} companion{pets.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setForm({ species: "dog" });
            setModal("addPet");
          }}
          className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold px-4 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 shrink-0"
        >
          + Add Pet
        </button>
      </div>

      {pets.length > 1 && (
        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🔍</span>
          <input
            type="search"
            placeholder="Search by name or breed…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 py-2.5"
          />
        </div>
      )}

      {filteredPets.length === 0 ? (
        <EmptyState
          icon="🐾"
          title={search ? "No pets found" : "No pets yet"}
          description={search ? "Try a different search term." : "Add your first furry friend to start tracking their care."}
          action={
            !search && (
              <button
                type="button"
                onClick={() => {
                  setForm({ species: "dog" });
                  setModal("addPet");
                }}
                className="bg-brand-500 text-white font-bold px-6 py-2.5 rounded-full text-sm hover:bg-brand-600 transition-colors"
              >
                Add your first pet
              </button>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredPets.map((p) => {
            const count = petRecordCount(p);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => openPet(p.id)}
                className="w-full text-left card-interactive overflow-hidden group"
              >
                <div
                  className={`p-6 text-center relative ${
                    p.species === "dog"
                      ? "bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100"
                      : "bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100"
                  }`}
                >
                  <p className="text-5xl mb-2 group-hover:scale-110 transition-transform duration-200">
                    {p.species === "dog" ? "🐕" : "🐈"}
                  </p>
                  <h2 className="text-xl font-extrabold text-gray-800">{p.name}</h2>
                  <p className="text-sm text-gray-500">{p.breed}</p>
                  {p.age && <p className="text-xs text-gray-400 mt-1">{p.age}</p>}
                </div>
                <div className="px-4 py-3 flex items-center justify-between bg-white border-t border-gray-50">
                  <span className="text-xs text-gray-500">{count} care record{count !== 1 ? "s" : ""}</span>
                  <span className="text-xs font-semibold text-brand-500 group-hover:translate-x-0.5 transition-transform">
                    View →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  const PetDetail = () => {
    if (!pet) return null;
    const records = {
      grooming: filt(pet.records.grooming),
      training: filt(pet.records.training),
      food: filt(pet.records.food),
      vet: filt(pet.records.vet),
    };
    const list = records[activeTab] || [];

    return (
      <div className="p-5 animate-fade-in">
        <button
          type="button"
          onClick={() => goTo("pets")}
          className="inline-flex items-center gap-1 text-sm text-brand-500 font-semibold mb-4 hover:text-brand-600 transition-colors"
        >
          ← Back to My Pets
        </button>

        <div
          className={`rounded-2xl p-6 mb-5 text-center shadow-card ${
            pet.species === "dog"
              ? "bg-gradient-to-br from-orange-50 to-amber-100"
              : "bg-gradient-to-br from-purple-50 to-pink-100"
          }`}
        >
          <p className="text-6xl mb-2">{pet.species === "dog" ? "🐕" : "🐈"}</p>
          <h1 className="text-2xl font-extrabold text-gray-800">{pet.name}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {pet.breed}
            {pet.gender ? ` · ${pet.gender}` : ""}
            {pet.weight ? ` · ${pet.weight}` : ""}
          </p>
        </div>

        {(pet.chip || pet.color || pet.dob) && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {pet.dob && (
              <div className="card p-3 text-center">
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Born</p>
                <p className="text-xs font-bold text-gray-700 mt-0.5">{fmtDate(pet.dob)}</p>
              </div>
            )}
            {pet.color && (
              <div className="card p-3 text-center">
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Color</p>
                <p className="text-xs font-bold text-gray-700 mt-0.5">{pet.color}</p>
              </div>
            )}
            {pet.chip && (
              <div className="card p-3 text-center col-span-2">
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Microchip</p>
                <p className="text-xs font-mono font-bold text-gray-700 mt-0.5">{pet.chip}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-1 px-1 scrollbar-hide">
          {Object.entries(TAB_META).map(([t, meta]) => {
            const count = pet.records[t]?.length || 0;
            const active = activeTab === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTab(t)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  active ? `${TC[t].btn} text-white shadow-sm scale-[1.02]` : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <span>{meta.icon}</span>
                {meta.label}
                {count > 0 && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${active ? "bg-white/25" : "bg-gray-100 text-gray-500"}`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          {list.length === 0 ? (
            <EmptyState
              icon={TAB_META[activeTab].icon}
              title={`No ${TAB_META[activeTab].label.toLowerCase()} records`}
              description="Records you add will show up here for easy tracking."
            />
          ) : (
            list.map((r) => (
              <article key={r.id} className={`card p-4 border-l-4 ${TC[activeTab].border} animate-fade-in`}>
                <div className="flex justify-between items-start gap-2">
                  <p className="font-bold text-sm text-gray-800">{r.service || r.session || r.product || r.detail}</p>
                  {r.cost && <span className="text-xs font-semibold text-gray-500 shrink-0">{r.cost}</span>}
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  {r.by || r.brand || r.vet}
                  {r.clinic ? ` · ${r.clinic}` : ""} · {fmtDate(r.date)}
                </p>
                {r.notes && <p className="text-xs text-gray-400 mt-2 italic">&ldquo;{r.notes}&rdquo;</p>}
                {r.rating ? (
                  <div className="mt-2">
                    <Stars n={r.rating} />
                  </div>
                ) : null}
                {r.nextDue && (
                  <div className="mt-2">
                    <Badge text={`Next: ${fmtDate(r.nextDue)}`} cls="bg-green-100 text-green-700" />
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      </div>
    );
  };

  const Profile = () => (
    <div className="p-5 animate-fade-in">
      <h1 className="text-2xl font-extrabold text-gray-800 mb-5">My Profile</h1>
      <div className="card p-5 mb-4">
        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl flex items-center justify-center text-5xl shadow-inner">
            {customer.avatar}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{customer.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Member since {customer.since}</p>
            <Badge text="Customer" cls="bg-orange-100 text-orange-700 mt-2" />
          </div>
        </div>
        {[
          ["📧", "Email", customer.email],
          ["📱", "Phone", customer.phone],
          ["🏙️", "City", customer.city],
          ["📍", "Address", customer.address],
        ].map(([icon, label, val]) => (
          <div key={label} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
            <span className="text-lg shrink-0">{icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-sm font-medium text-gray-800 break-words">{val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4 mb-4">
        <p className="text-xs font-semibold text-gray-400 mb-2">Quick stats</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-orange-50 rounded-xl py-3">
            <p className="text-lg font-extrabold text-brand-600">{pets.length}</p>
            <p className="text-[10px] text-gray-500 font-medium">Pets</p>
          </div>
          <div className="bg-blue-50 rounded-xl py-3">
            <p className="text-lg font-extrabold text-blue-600">{totalRec}</p>
            <p className="text-[10px] text-gray-500 font-medium">Records</p>
          </div>
          <div className="bg-green-50 rounded-xl py-3">
            <p className="text-lg font-extrabold text-green-600">{customer.since.split(" ")[0]}</p>
            <p className="text-[10px] text-gray-500 font-medium">Since</p>
          </div>
        </div>
      </div>

      <Button
        variant="secondary"
        onClick={() => setModal("logout")}
        className="border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200"
      >
        Sign Out
      </Button>
    </div>
  );

  return (
    <div className="app-shell">
      <AppHeader />
      <main key={view} className="safe-bottom min-h-screen">
        {view === "dashboard" && <Dashboard />}
        {view === "pets" && <MyPets />}
        {view === "petDetail" && <PetDetail />}
        {view === "profile" && <Profile />}
      </main>
      <BottomNav />

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      {modal === "addPet" && (
        <Modal title="Add New Pet 🐾" onClose={() => setModal(null)}>
          <Field label="Pet name *">
            <Input placeholder="e.g. Bruno" value={form.name || ""} onChange={setF("name")} autoFocus />
          </Field>
          <Field label="Species">
            <Select opts={["dog", "cat"]} value={form.species || "dog"} onChange={setF("species")} />
          </Field>
          <Field label="Breed (optional)">
            <Input placeholder="e.g. Labrador" value={form.breed || ""} onChange={setF("breed")} />
          </Field>
          <Button onClick={addPet} disabled={!form.name?.trim()}>
            Add Pet
          </Button>
        </Modal>
      )}

      {modal === "reminders" && (
        <Modal title="Reminders 🔔" onClose={() => setModal(null)}>
          {(() => {
            const items = pets
              .flatMap((p) =>
                p.records.vet
                  .filter((v) => v.nextDue && isDueSoon(v.nextDue, 90))
                  .map((v) => ({
                    pet: p.name,
                    petId: p.id,
                    detail: v.detail,
                    due: v.nextDue,
                    days: daysUntil(v.nextDue),
                  }))
              )
              .sort((a, b) => a.days - b.days);
            if (items.length === 0) {
              return <p className="text-sm text-gray-500 py-4 text-center">No vaccinations due in the next 90 days.</p>;
            }
            return (
              <ul className="space-y-2">
                {items.map((item, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => {
                        setModal(null);
                        openPet(item.petId);
                      }}
                      className="w-full text-left card p-3 hover:border-orange-200 transition-colors"
                    >
                      <p className="font-semibold text-sm text-gray-800">
                        {item.pet} — {item.detail}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.days === 0 ? "Due today" : item.days === 1 ? "Due tomorrow" : `Due in ${item.days} days`} ·{" "}
                        {fmtDate(item.due)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            );
          })()}
        </Modal>
      )}

      {modal === "logout" && (
        <Modal title="Sign out?" onClose={() => setModal(null)}>
          <p className="text-sm text-gray-500 mb-5">You&apos;ll need to sign in again to access your pets and records.</p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">
              Cancel
            </Button>
            <button
              type="button"
              onClick={onLogout}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-full transition-colors"
            >
              Sign Out
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
