"use client";

import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  Coffee,
  CreditCard,
  Edit2,
  Hotel,
  Lock,
  Map,
  MapPin,
  Navigation,
  NotebookPen,
  PackageCheck,
  Palmtree,
  Plane,
  Plus,
  RefreshCw,
  Save,
  Settings,
  ShoppingBag,
  Sparkles,
  Star,
  Ticket,
  Trash2,
  Train,
  Umbrella,
  Users,
  Waves
} from "lucide-react";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { createSeedTravelers } from "@/lib/seed";
import { categories, Category, ItineraryCandidate, RankedOption, Rating, Traveler, TripOption, tripDates } from "@/lib/types";

type StateResponse = {
  travelers: Traveler[];
  options: TripOption[];
  ratings: Rating[];
  savedItinerary: ItineraryCandidate | null;
  rankedOptions: RankedOption[];
  itineraryCandidates: ItineraryCandidate[];
};

const categoryLabels: Record<Category, string> = {
  stay: "Stay",
  food: "Food",
  shopping: "Shopping",
  temples: "Temples",
  beaches: "Beaches & Sightseeing",
  nightlife: "Night Clubs"
};

const categoryHints: Record<Category, string> = {
  stay: "Boutique villas, beach houses, hotels, hostels",
  food: "French cafes, Tamil meals, bakeries, seafood",
  shopping: "Markets, boutiques, crafts, souvenirs",
  temples: "Culture, calm mornings, history",
  beaches: "Beaches, promenade walks, sunrise, boating, heritage stops",
  nightlife: "Night clubs and dance-floor options only"
};

const categoryIcons: Record<Category, React.ElementType> = {
  stay: Hotel,
  food: Coffee,
  shopping: ShoppingBag,
  temples: Sparkles,
  beaches: Waves,
  nightlife: Palmtree
};

const desktopNav = [
  ["Overview", "dashboard", Map],
  ["Places", "plan", Navigation],
  ["Itinerary", "itinerary", CalendarDays],
  ["Group", "group", Users],
  ["Bookings", "bookings", Ticket],
  ["Packing", "packing", PackageCheck],
  ["Notes", "notes", NotebookPen],
  ["Settings", "settings", Settings],
  ["Expenses", "expenses", CreditCard],
  ["Memories", "memories", Umbrella]
] as const;

const mobileNav = [
  ["Home", "dashboard", Map],
  ["Plan", "plan", CalendarDays],
  ["Bookings", "bookings", Ticket],
  ["Group", "group", Users],
  ["More", "more", Sparkles]
] as const;

type PageId = (typeof desktopNav)[number][1] | "more";

type LocalCrudItem = {
  id: string;
  title: string;
  detail: string;
  meta: string;
  amount?: string;
  done?: boolean;
};

const packingGroups = [
  ["Documents", ["ID proof", "Hotel confirmation", "Train or bus tickets"]],
  ["Clothes", ["Light cotton outfits", "Evening fit", "Comfortable footwear"]],
  ["Beach Items", ["Sunscreen", "Sunglasses", "Beach towel"]],
  ["Electronics", ["Chargers", "Power bank", "Speaker"]],
  ["Group Items", ["Cards or games", "First-aid kit", "Shared snacks"]]
] as const;

function money(value: number | null) {
  if (value === null || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function prettyDate(date: string, format: "short" | "long" = "short") {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: format === "long" ? "long" : "short",
    month: "short",
    day: "numeric"
  });
}

function ratingFor(ratings: Rating[], travelerId: string, optionId: string) {
  return ratings.find((rating) => rating.travelerId === travelerId && rating.optionId === optionId)?.stars ?? 0;
}

function makeMapsUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function mapUrlFor(option: TripOption) {
  return option.link || makeMapsUrl(`${option.name} ${option.location || "Pondicherry"}`);
}

function priorityFor(option: TripOption) {
  const text = `${option.name} ${option.notes} ${option.description}`.toLowerCase();
  if (text.includes("must") || text.includes("best for") || text.includes("strong")) return "Must Visit";
  if (text.includes("optional") || text.includes("mid food")) return "Optional";
  if (text.includes("verify") || text.includes("bad service")) return "Good Option";
  return "Good Option";
}

function constraintsFor(option: TripOption) {
  const text = `${option.famousFor} ${option.notes}`.toLowerCase();
  const constraints = [];
  if (text.includes("sunday")) constraints.push("Only Sunday");
  if (text.includes("pre-book") || text.includes("reserve") || text.includes("reservation")) constraints.push("Pre-book recommended");
  if (text.includes("no-photo") || text.includes("silence")) constraints.push("Quiet rules");
  if (text.includes("avoid harsh") || text.includes("heat")) constraints.push("Avoid afternoon heat");
  if (text.includes("verify")) constraints.push("Verify hours");
  if (text.includes("weather")) constraints.push("Weather dependent");
  if (text.includes("crowded") || text.includes("popular")) constraints.push("Can get crowded");
  if (text.includes("bad service")) constraints.push("Service warning");
  return constraints;
}

function daysUntilTrip() {
  const today = new Date();
  const tripStart = new Date("2026-08-01T00:00:00");
  const diff = Math.ceil((tripStart.getTime() - today.getTime()) / 86_400_000);
  if (diff > 0) return `${diff} days left`;
  if (diff >= -3) return "Trip is live";
  return "Memories mode";
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-mutedText">{children}</label>;
}

function PageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <Badge variant="highlight" className="mb-2">{eyebrow}</Badge>
        <h2 className="text-2xl font-black tracking-tight text-primary">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-mutedText">{description}</p>
      </div>
    </div>
  );
}

function HeaderNav({
  activePage,
  setActivePage,
  travelers,
  onAdd,
  activeTraveler
}: {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  travelers: Traveler[];
  onAdd: () => void;
  activeTraveler?: Traveler;
}) {
  return (
    <header className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-6 sm:px-8 lg:px-12">
      <div className="flex min-w-fit items-center gap-4">
        <button type="button" onClick={() => setActivePage("dashboard")} className="font-serif text-2xl font-semibold text-[#0F3331]">
          Pondicherry
        </button>
        <DecorativeStamp small />
        <DecorativeWaves />
      </div>
      <nav className="hidden items-center gap-5 lg:flex xl:gap-7">
        {desktopNav.map(([label, href]) => (
          <button
            key={href}
            type="button"
            onClick={() => setActivePage(href)}
            className={cn(
              "relative text-sm font-medium text-[#0F3331]/75 transition hover:text-[#0F3331]",
              activePage === href && "text-[#0F3331]"
            )}
          >
            {label}
            {activePage === href ? <span className="absolute -bottom-4 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#E3A91A]" /> : null}
          </button>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <Button type="button" onClick={onAdd} className="hidden rounded-full bg-[#E3A91A] px-6 text-white hover:bg-[#cf9917] sm:inline-flex">
          <Plus size={16} />
          Add
        </Button>
        <div className="hidden -space-x-3 sm:flex">
          {travelers.slice(0, 4).map((traveler) => (
            <div key={traveler.id} className="grid h-10 w-10 place-items-center rounded-full border-2 border-[#FBF8F1] bg-[#B9D7EA] text-xs font-black text-[#0F3331]">
              {traveler.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
            </div>
          ))}
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-full bg-[#E86F91]/15 text-xs font-black text-[#E86F91]">
          {activeTraveler?.name.split(" ").map((part) => part[0]).join("").slice(0, 2) ?? "PP"}
        </div>
      </div>
    </header>
  );
}

function MobileBottomNav({ activePage, setActivePage }: { activePage: PageId; setActivePage: (page: PageId) => void }) {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 rounded-lg border border-border bg-white/92 p-1 shadow-coastal backdrop-blur lg:hidden">
      {mobileNav.map(([label, href, Icon]) => (
        <button
          key={href}
          type="button"
          onClick={() => setActivePage(href)}
          className={cn(
            "grid place-items-center gap-1 rounded-md px-2 py-2 text-[11px] font-bold text-primary hover:bg-muted/55",
            activePage === href && "bg-muted/70 text-secondary"
          )}
        >
          <Icon size={17} />
          {label}
        </button>
      ))}
    </nav>
  );
}

function DecorativeStamp({ small = false }: { small?: boolean }) {
  return (
    <div className={cn("grid place-items-center rounded-full border border-[#E86F91]/35 text-[#E86F91]", small ? "h-12 w-12" : "h-24 w-24")}>
      <div className="grid h-[82%] w-[82%] place-items-center rounded-full border border-dashed border-[#E86F91]/45 text-center">
        <span className={cn("font-serif font-bold leading-none", small ? "text-[9px]" : "text-sm")}>PONDY<br />STAMP</span>
      </div>
    </div>
  );
}

function DecorativeWaves() {
  return (
    <div className="hidden h-8 w-20 sm:block">
      <svg viewBox="0 0 96 32" fill="none" aria-hidden="true">
        {[6, 14, 22].map((y) => (
          <path key={y} d={`M0 ${y} C 14 ${y - 9}, 26 ${y + 9}, 40 ${y} S 66 ${y - 9}, 80 ${y} S 104 ${y + 9}, 118 ${y}`} stroke="#E86F91" strokeWidth="2" opacity=".55" />
        ))}
      </svg>
    </div>
  );
}

function PondicherryHero({
  travelers,
  setActivePage
}: {
  travelers: Traveler[];
  setActivePage: (page: PageId) => void;
}) {
  return (
    <section id="dashboard" className="relative mx-auto grid max-w-[1500px] items-center gap-8 px-4 pb-4 pt-2 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-12 lg:pb-6">
      <div className="relative z-10">
        <h1 className="font-serif text-[4.4rem] font-bold leading-[0.9] text-[#0F3331] sm:text-[7rem] lg:text-[8rem]">
          Pondicherry<br />Polama<span className="text-[#E86F91]">.</span>
        </h1>
        <div className="mt-7 flex flex-wrap gap-4">
          <InfoPill icon={CalendarDays} label="1 - 4 Aug, 2026" />
          <InfoPill icon={Users} label={`${travelers.length} Travellers`} />
          <InfoPill icon={Sparkles} label="28 C Sunny" />
        </div>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Button type="button" onClick={() => setActivePage("itinerary")} className="h-14 rounded-full bg-[#E3A91A] px-9 text-base text-white hover:bg-[#cf9917]">
            View Itinerary
            <Navigation size={18} />
          </Button>
          <Button type="button" variant="outline" onClick={() => setActivePage("plan")} className="h-14 rounded-full border-[#E9E2D6] bg-white/60 px-9 text-base text-[#0F3331]">
            Explore Places
          </Button>
        </div>
      </div>
      <div className="relative min-h-[340px] lg:min-h-[560px]">
        <div className="absolute inset-10 rounded-[48%_52%_45%_55%/45%_35%_65%_55%] bg-[#B9D7EA]/55" />
        <div className="absolute left-0 top-24 z-20 opacity-70"><DecorativeStamp /></div>
        <div className="absolute right-4 top-28 z-20 scale-125"><DecorativeWaves /></div>
        <div className="absolute inset-x-5 top-8 overflow-hidden rounded-[44%_56%_47%_53%/42%_35%_65%_58%] border border-dashed border-[#0F3331]/22 bg-white p-3 shadow-[0_30px_80px_rgba(15,51,49,0.12)] lg:inset-x-16">
          <Image src="/images/pondicherry/hero.svg" alt="Pondicherry French street illustration" width={900} height={680} priority className="h-full min-h-[320px] w-full rounded-[44%_56%_47%_53%/42%_35%_65%_58%] object-cover lg:min-h-[500px]" />
        </div>
      </div>
    </section>
  );
}

function InfoPill({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-xl border border-[#E9E2D6] bg-white/70 px-5 py-3 text-sm font-semibold text-[#0F3331] shadow-[0_10px_30px_rgba(15,51,49,0.05)]">
      <Icon size={18} className="text-[#5F9388]" />
      {label}
    </div>
  );
}

function TripCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="rounded-lg border border-border bg-white/82 p-4 shadow-ticket">
      <Icon className="mb-3 text-accent" size={19} />
      <p className="text-xs font-bold uppercase tracking-wide text-mutedText">{label}</p>
      <p className="mt-1 text-lg font-black text-primary">{value}</p>
    </div>
  );
}

const landingCategoryMeta: Array<{
  title: string;
  page: PageId;
  category?: Category;
  icon: React.ElementType;
  tone: string;
}> = [
  { title: "Itinerary", page: "itinerary", icon: CalendarDays, tone: "#E3A91A" },
  { title: "Food", page: "plan", category: "food", icon: Coffee, tone: "#6BA2CC" },
  { title: "Shopping", page: "plan", category: "shopping", icon: ShoppingBag, tone: "#E86F91" },
  { title: "Beaches", page: "plan", category: "beaches", icon: Umbrella, tone: "#5F9388" },
  { title: "Temples", page: "plan", category: "temples", icon: Sparkles, tone: "#E3A91A" },
  { title: "Night Life", page: "plan", category: "nightlife", icon: Palmtree, tone: "#E86F91" }
];

function LandingCategoryCards({
  state,
  setActivePage,
  setActiveCategory
}: {
  state: StateResponse;
  setActivePage: (page: PageId) => void;
  setActiveCategory: (category: Category) => void;
}) {
  return (
    <section className="mx-auto grid max-w-[1500px] gap-5 px-4 pb-8 sm:px-8 md:grid-cols-2 lg:-mt-4 lg:grid-cols-3 lg:px-12 xl:grid-cols-6">
      {landingCategoryMeta.map((item) => {
        const count = item.category ? state.options.filter((option) => option.category === item.category).length : state.itineraryCandidates[0]?.days.length ?? tripDates.length;
        const subtitle = item.category
          ? item.category === "nightlife"
            ? `${count} club picks`
            : `${count} places saved`
          : `${count} days planned`;
        return (
          <button
            key={item.title}
            type="button"
            onClick={() => {
              if (item.category) setActiveCategory(item.category);
              setActivePage(item.page);
            }}
            className="group flex min-h-[160px] flex-col items-start justify-between rounded-[1.25rem] border border-[#E9E2D6] bg-white/78 p-6 text-left shadow-[0_22px_60px_rgba(15,51,49,0.06)] transition hover:-translate-y-1 hover:shadow-[0_30px_70px_rgba(15,51,49,0.1)]"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full" style={{ backgroundColor: `${item.tone}1f`, color: item.tone }}>
              <item.icon size={23} />
            </span>
            <span>
              <span className="block font-serif text-2xl text-[#0F3331]">{item.title}</span>
              <span className="mt-1 block text-sm font-medium text-[#6F7775]">{subtitle}</span>
            </span>
            <span className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-white transition group-hover:translate-x-1" style={{ backgroundColor: item.tone }}>
              <Navigation size={15} />
            </span>
          </button>
        );
      })}
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === "Done" ? "secondary" : status === "Open" ? "accent" : "outline";
  return <Badge variant={variant}>{status}</Badge>;
}

function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed border-border bg-white/70 p-8 text-center">
      <Icon className="mb-3 text-accent" size={28} />
      <p className="font-black text-primary">{title}</p>
      <p className="mt-1 max-w-md text-sm leading-6 text-mutedText">{description}</p>
    </div>
  );
}

function useLocalItems(storageKey: string, initialItems: LocalCrudItem[] = []) {
  const [items, setItems] = useState<LocalCrudItem[]>(initialItems);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) setItems(JSON.parse(stored) as LocalCrudItem[]);
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  return [items, setItems] as const;
}

function LocalCrudSection({
  storageKey,
  title,
  description,
  icon: Icon,
  titlePlaceholder,
  detailPlaceholder,
  metaPlaceholder,
  amountPlaceholder,
  initialItems = []
}: {
  storageKey: string;
  title: string;
  description: string;
  icon: React.ElementType;
  titlePlaceholder: string;
  detailPlaceholder: string;
  metaPlaceholder: string;
  amountPlaceholder?: string;
  initialItems?: LocalCrudItem[];
}) {
  const [items, setItems] = useLocalItems(storageKey, initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingItem = items.find((item) => item.id === editingId);

  function submitItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const item: LocalCrudItem = {
      id: editingId ?? crypto.randomUUID(),
      title: String(form.get("title") ?? ""),
      detail: String(form.get("detail") ?? ""),
      meta: String(form.get("meta") ?? ""),
      amount: String(form.get("amount") ?? ""),
      done: editingItem?.done ?? false
    };

    setItems((current) => (editingId ? current.map((entry) => (entry.id === editingId ? item : entry)) : [item, ...current]));
    setEditingId(null);
    event.currentTarget.reset();
  }

  return (
    <Card>
      <CardHeader>
        <PageHeader eyebrow="Planner" title={title} description={description} />
      </CardHeader>
      <CardContent className="grid gap-4">
        <form key={editingId ?? "new"} onSubmit={submitItem} className="grid gap-3 rounded-lg border border-dashed border-border bg-background/55 p-4 md:grid-cols-2">
          <FieldLabel>Title<Input name="title" required placeholder={titlePlaceholder} defaultValue={editingItem?.title ?? ""} /></FieldLabel>
          <FieldLabel>Detail<Input name="detail" placeholder={detailPlaceholder} defaultValue={editingItem?.detail ?? ""} /></FieldLabel>
          <FieldLabel>Meta<Input name="meta" placeholder={metaPlaceholder} defaultValue={editingItem?.meta ?? ""} /></FieldLabel>
          {amountPlaceholder ? <FieldLabel>Amount<Input name="amount" placeholder={amountPlaceholder} defaultValue={editingItem?.amount ?? ""} /></FieldLabel> : null}
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit">
              {editingId ? <Save size={16} /> : <Plus size={16} />}
              {editingId ? "Update" : "Add"}
            </Button>
            {editingId ? (
              <Button type="button" variant="outline" onClick={() => setEditingId(null)}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>

        {items.length === 0 ? (
          <EmptyState icon={Icon} title={`No ${title.toLowerCase()} yet`} description="Add the first item, then edit, complete, or delete it from here." />
        ) : (
          <div className="grid gap-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg border border-border bg-white p-4 shadow-ticket">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Checkbox checked={Boolean(item.done)} onChange={(event) => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, done: event.currentTarget.checked } : entry))} />
                      <h3 className={cn("font-black text-primary", item.done && "text-mutedText line-through")}>{item.title}</h3>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-mutedText">{item.detail || "No detail added."}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.meta ? <Badge variant="secondary">{item.meta}</Badge> : null}
                      {item.amount ? <Badge variant="accent">{item.amount}</Badge> : null}
                      <StatusBadge status={item.done ? "Done" : "Open"} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(item.id)}>
                      <Edit2 size={14} />
                      Edit
                    </Button>
                    <Button type="button" variant="stamp" size="sm" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}>
                      <Trash2 size={14} />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PlannerApp() {
  const [enteredCode, setEnteredCode] = useState("");
  const [loginTraveler, setLoginTraveler] = useState("traveler-3");
  const [unlocked, setUnlocked] = useState(false);
  const [state, setState] = useState<StateResponse | null>(null);
  const [activeTraveler, setActiveTraveler] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("stay");
  const [activePage, setActivePage] = useState<PageId>("dashboard");
  const [editingOption, setEditingOption] = useState<RankedOption | null>(null);
  const [optionModalOpen, setOptionModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [checkedPacking, setCheckedPacking] = useState<Record<string, boolean>>({});

  const activeTravelerRecord = state?.travelers.find((traveler) => traveler.id === activeTraveler);
  const visibleOptions = useMemo(
    () => state?.rankedOptions.filter((option) => option.category === activeCategory) ?? [],
    [activeCategory, state]
  );

  async function loadState() {
    const response = await fetch("/api/state", { cache: "no-store" });
    if (!response.ok) {
      setMessage("Could not load planner data. Check the passcode or database connection.");
      return;
    }
    setState(await response.json());
  }

  useEffect(() => {
    if (!unlocked) return;
    loadState();
  }, [unlocked]);

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode: enteredCode.trim(), travelerId: loginTraveler })
    });

    if (response.ok) {
      setActiveTraveler(loginTraveler);
      window.localStorage.setItem("pondi-active-traveler", loginTraveler);
      setUnlocked(true);
      setMessage("");
    } else {
      setMessage("That passcode does not match the trip.");
    }
  }

  async function submitOption(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeTraveler) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");

    const payload = {
      category: activeCategory,
      name: String(form.get("name") ?? ""),
      location: String(form.get("location") ?? ""),
      link: String(form.get("link") ?? ""),
      description: String(form.get("description") ?? ""),
      famousFor: String(form.get("famousFor") ?? ""),
      notes: String(form.get("notes") ?? ""),
      totalCost: form.get("totalCost") ? Number(form.get("totalCost")) : null,
      perPersonCost: form.get("perPersonCost") ? Number(form.get("perPersonCost")) : null,
      capacityNotes: String(form.get("capacityNotes") ?? ""),
      createdBy: activeTraveler
    };

    const response = await fetch(editingOption ? `/api/options/${editingOption.id}` : "/api/options", {
      method: editingOption ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setBusy(false);
    if (!response.ok) {
      setMessage(editingOption ? "Could not update that option." : "Could not add that option. Check the required fields.");
      return;
    }

    event.currentTarget.reset();
    setEditingOption(null);
    setOptionModalOpen(false);
    setMessage(editingOption ? "Option updated for the group." : "Option added for the group.");
    await loadState();
  }

  function startEditOption(option: RankedOption) {
    setActiveCategory(option.category);
    setActivePage("plan");
    setEditingOption(option);
    setOptionModalOpen(true);
  }

  function openAddOption() {
    setEditingOption(null);
    setOptionModalOpen(true);
  }

  async function deleteTripOption(optionId: string) {
    setBusy(true);
    const response = await fetch(`/api/options/${optionId}`, { method: "DELETE" });
    setBusy(false);
    setMessage(response.ok ? "Option deleted." : "Could not delete that option.");
    await loadState();
  }

  async function rate(optionId: string, stars: number) {
    if (!activeTraveler) return;
    setBusy(true);
    await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId, travelerId: activeTraveler, stars, comment: "" })
    });
    setBusy(false);
    await loadState();
  }

  async function clearRating(optionId: string) {
    if (!activeTraveler) return;
    setBusy(true);
    await fetch("/api/ratings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId, travelerId: activeTraveler })
    });
    setBusy(false);
    await loadState();
  }

  async function updatePlacePhotos(option: RankedOption, photoUrls: string[]) {
    if (!activeTravelerRecord?.isOrganizer) return;
    setBusy(true);
    const response = await fetch(`/api/options/${option.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coverImageUrl: photoUrls[0] ?? "",
        photoUrls
      })
    });
    setBusy(false);
    setMessage(response.ok ? "Photos updated." : "Could not update photos.");
    await loadState();
  }

  async function saveCandidate(itineraryId: string) {
    setBusy(true);
    await fetch("/api/itinerary/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itineraryId })
    });
    setBusy(false);
    setMessage("Saved itinerary refreshed.");
    await loadState();
  }

  async function updateTravelerDetails(travelerId: string, input: Partial<Omit<Traveler, "id" | "isOrganizer">>) {
    setBusy(true);
    const response = await fetch(`/api/travelers/${travelerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });
    setBusy(false);
    setMessage(response.ok ? "Traveler updated." : "Could not update traveler.");
    await loadState();
  }

  if (!unlocked) {
    return (
      <main className="min-h-screen px-4 py-8 sm:grid sm:place-items-center">
        <Card className="mx-auto max-w-xl overflow-hidden">
          <div className="passport-paper border-b border-border p-6">
            <Badge variant="highlight">Private trip pass</Badge>
            <h1 className="mt-4 text-4xl font-black leading-none text-primary">Pondi Polama</h1>
            <p className="mt-3 text-sm leading-6 text-mutedText">Unlock the Pondicherry group command center for August 1-4, 2026.</p>
          </div>
          <CardContent className="p-6">
            <form onSubmit={unlock} className="grid gap-4">
              <FieldLabel>
                Your name
                <Select value={loginTraveler} onChange={(event) => setLoginTraveler(event.target.value)}>
                  {createSeedTravelers().map((traveler) => (
                    <option key={traveler.id} value={traveler.id}>
                      {traveler.name}
                    </option>
                  ))}
                </Select>
              </FieldLabel>
              <FieldLabel>
                Shared passcode
                <div className="flex gap-2">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-muted/45 text-primary">
                    <Lock size={17} />
                  </div>
                  <Input id="passcode" value={enteredCode} onChange={(event) => setEnteredCode(event.target.value)} />
                  <Button type="submit">Enter</Button>
                </div>
              </FieldLabel>
            </form>
            {message ? <p className="mt-4 rounded-lg bg-highlight/10 p-3 text-sm font-bold text-highlight">{message}</p> : null}
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!state) {
    return (
      <main className="grid min-h-screen place-items-center text-primary">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-white px-5 py-4 shadow-coastal">
          <RefreshCw className="animate-spin" />
          Loading trip passport
        </div>
      </main>
    );
  }

  const stayOptions = state.rankedOptions.filter((option) => option.category === "stay");
  const totalStayBudget = stayOptions.reduce((total, option) => total + (option.totalCost ?? 0), 0);

  return (
    <main className="min-h-screen bg-[#FBF8F1] pb-24 text-[#0F3331] lg:pb-8">
      <HeaderNav
        activePage={activePage}
        setActivePage={setActivePage}
        travelers={state.travelers}
        activeTraveler={activeTravelerRecord}
        onAdd={openAddOption}
      />

      {activePage === "dashboard" ? (
        <>
          <PondicherryHero travelers={state.travelers} setActivePage={setActivePage} />
          <LandingCategoryCards state={state} setActivePage={setActivePage} setActiveCategory={setActiveCategory} />
        </>
      ) : null}

      <div className={cn("mx-auto max-w-[1500px] px-4 sm:px-8 lg:px-12", activePage === "dashboard" && "hidden")}>
        <div className="min-w-0 space-y-5">
          <header id="settings" className="flex flex-col gap-3 rounded-[1.25rem] border border-[#E9E2D6] bg-white/80 p-4 shadow-ticket backdrop-blur md:flex-row md:items-end md:justify-between">
            <div>
              <Badge variant="secondary">Coastal command center</Badge>
              <p className="mt-2 text-sm text-mutedText">Pick your name, rate options, and let the group plan settle itself.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_auto]">
              <div className="rounded-lg border border-border bg-white px-3 py-2">
                <p className="text-xs font-bold uppercase tracking-wide text-mutedText">Signed in as</p>
                <p className="text-sm font-black text-primary">{activeTravelerRecord?.name ?? "Traveler"}</p>
              </div>
              <Button type="button" variant="outline" size="icon" onClick={loadState} aria-label="Refresh planner">
                <RefreshCw size={18} />
              </Button>
            </div>
          </header>

          <section id="plan" className={cn("grid gap-5", activePage !== "plan" && "hidden")}>
            <Card>
              <CardHeader>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <PageHeader eyebrow="Coastal map" title="Places and group ratings" description="Saved travel cards with recommendations, best times, map links, constraints, photos, and group stars." />
                  <Button type="button" onClick={openAddOption} className="w-full sm:w-fit">
                    <Plus size={17} />
                    Add Place
                  </Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
                  {categories.map((category) => {
                    const Icon = categoryIcons[category];
                    return (
                      <Button
                        key={category}
                        type="button"
                        variant={category === activeCategory ? "secondary" : "outline"}
                        className="justify-between"
                        onClick={() => setActiveCategory(category)}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Icon size={16} />
                          {categoryLabels[category]}
                        </span>
                        <Badge variant={category === activeCategory ? "outline" : "secondary"}>{state.options.filter((option) => option.category === category).length}</Badge>
                      </Button>
                    );
                  })}
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-3">
                  {visibleOptions.length === 0 ? (
                    <EmptyState icon={MapPin} title="No plans added yet" description="Start building your Pondicherry itinerary by adding the first option in this category." />
                  ) : (
                    visibleOptions.map((option) => (
                      <TripOptionCard
                        key={option.id}
                        option={option}
                        ratings={state.ratings}
                        activeTraveler={activeTraveler}
                        busy={busy}
                        onRate={rate}
                        onClearRating={clearRating}
                        onEdit={startEditOption}
                        onDelete={deleteTripOption}
                        canManagePhotos={Boolean(activeTravelerRecord?.isOrganizer)}
                        onUpdatePhotos={updatePlacePhotos}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <section id="itinerary" className="hidden">
              <Card>
                <CardHeader>
                  <PageHeader eyebrow="Itinerary timeline" title="Day-wise candidate plans" description="Generated from group ratings, must-have categories, attendance, and practical trip flow." />
                  {state.savedItinerary ? (
                    <div className="flex items-center gap-2 rounded-lg bg-secondary/10 p-3 text-sm font-bold text-secondary">
                      <Check size={18} />
                      Saved: {state.savedItinerary.name}
                    </div>
                  ) : null}
                </CardHeader>
                <CardContent className="grid gap-4">
                  {state.itineraryCandidates.map((candidate) => (
                    <ItineraryTimeline
                      key={candidate.id}
                      candidate={candidate}
                      canSave={Boolean(activeTravelerRecord?.isOrganizer)}
                      busy={busy}
                      onSave={saveCandidate}
                    />
                  ))}
                </CardContent>
              </Card>
            </section>
          </section>

          <section id="itinerary-page" className={cn(activePage !== "itinerary" && "hidden")}>
            <Card>
              <CardHeader>
                <PageHeader eyebrow="Itinerary timeline" title="Day-wise candidate plans" description="Generated from group ratings, must-have categories, attendance, and practical trip flow." />
                {state.savedItinerary ? (
                  <div className="flex items-center gap-2 rounded-lg bg-secondary/10 p-3 text-sm font-bold text-secondary">
                    <Check size={18} />
                    Saved: {state.savedItinerary.name}
                  </div>
                ) : null}
              </CardHeader>
              <CardContent className="grid gap-4">
                {state.itineraryCandidates.map((candidate) => (
                  <ItineraryTimeline
                    key={candidate.id}
                    candidate={candidate}
                    canSave={Boolean(activeTravelerRecord?.isOrganizer)}
                    busy={busy}
                    onSave={saveCandidate}
                  />
                ))}
              </CardContent>
            </Card>
          </section>

          <section id="bookings" className={cn("grid gap-5 xl:grid-cols-2", activePage !== "bookings" && "hidden")}>
            <StaySection stayOptions={stayOptions} totalStayBudget={totalStayBudget} />
            <TransportSection />
          </section>

          <section id="expenses" className={cn("grid gap-5", activePage !== "expenses" && "hidden")}>
            <ComingSoonSection
              title="Expenses"
              description="Settlements, paid-by tracking, per-person splits, and shared budget summaries will live here once the travel plan is locked."
              icon={CreditCard}
            />
          </section>

          <section id="group" className={cn(activePage !== "group" && "hidden")}>
            <GroupMembers travelers={state.travelers} onUpdateTraveler={updateTravelerDetails} busy={busy} />
          </section>

          <section id="packing" className={cn("grid gap-5", activePage !== "packing" && "hidden")} >
            <PackingChecklist checkedPacking={checkedPacking} setCheckedPacking={setCheckedPacking} />
          </section>

          <section id="notes" className={cn(activePage !== "notes" && "hidden")}>
            <LocalCrudSection
              storageKey="pondi-notes"
              title="Notes"
              description="Create, edit, complete, and delete food ideas, reminders, and tiny group decisions."
              icon={NotebookPen}
              titlePlaceholder="e.g. Try breakfast in White Town"
              detailPlaceholder="Details, links, timing, or context"
              metaPlaceholder="Food, place, reminder, memory"
            />
          </section>

          <section id="memories" className={cn(activePage !== "memories" && "hidden")}>
            <ComingSoonSection
              title="Memories"
              description="Trip photos, favorite moments, quotes, and post-trip notes will live here after the Pondicherry plan is ready."
              icon={Umbrella}
            />
          </section>

          <section id="more" className={cn("grid gap-5 md:grid-cols-2", activePage !== "more" && "hidden")}>
            <Card id="memories">
              <CardHeader>
                <CardTitle>More</CardTitle>
                <CardDescription>Quick access to the quieter trip pages.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-2">
                {(["bookings", "packing", "notes", "settings", "expenses", "memories"] as PageId[]).map((page) => (
                  <Button key={page} type="button" variant="outline" onClick={() => setActivePage(page)}>
                    {page[0].toUpperCase() + page.slice(1)}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </section>

          <section id="settings-page" className={cn(activePage !== "settings" && "hidden")}>
            <Card>
              <CardHeader>
                <PageHeader eyebrow="Settings" title="Trip controls" description="Select the active traveler, refresh group data, and manage local-only section data from each page." />
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <TripCard label="Active traveler" value={activeTravelerRecord?.name ?? "Select one"} icon={Users} />
                <TripCard label="Shared database" value="Neon ready" icon={CheckCircle2} />
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
      {optionModalOpen ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-primary/35 p-4 backdrop-blur-sm">
          <Card className="max-h-[92vh] w-full max-w-3xl overflow-auto">
            <CardHeader className="border-b border-border">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Badge variant="highlight">{editingOption ? "Edit travel card" : "New travel card"}</Badge>
                  <CardTitle className="mt-3">{editingOption ? `Edit ${editingOption.name}` : `Add ${categoryLabels[activeCategory]} Place`}</CardTitle>
                  <CardDescription>{categoryHints[activeCategory]} - timings can change, so keep notes editable.</CardDescription>
                </div>
                <Button type="button" variant="outline" onClick={() => { setOptionModalOpen(false); setEditingOption(null); }}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <form key={editingOption?.id ?? `new-${activeCategory}`} className="grid gap-4" onSubmit={submitOption}>
                <div className="grid gap-3 md:grid-cols-2">
                  <FieldLabel>Name<Input name="name" required placeholder="e.g. Villa Shanti" defaultValue={editingOption?.name ?? ""} /></FieldLabel>
                  <FieldLabel>Area / location<Input name="location" required placeholder="e.g. White Town" defaultValue={editingOption?.location ?? ""} /></FieldLabel>
                  <FieldLabel>Map or source link<Input name="link" type="url" placeholder="https://..." defaultValue={editingOption?.link ?? ""} /></FieldLabel>
                  <FieldLabel>Cuisine / type<Input name="description" placeholder="Cafe, boutique, temple, beach..." defaultValue={editingOption?.description ?? ""} /></FieldLabel>
                  <FieldLabel>Best time to visit<Input name="famousFor" placeholder="Breakfast / brunch, sunset, evening..." defaultValue={editingOption?.famousFor ?? ""} /></FieldLabel>
                  <FieldLabel>Recommendations / constraints<Input name="notes" placeholder="What to try, booking, warnings, last verified..." defaultValue={editingOption?.notes ?? ""} /></FieldLabel>
                  {activeCategory === "stay" ? (
                    <>
                      <FieldLabel>Total cost<Input name="totalCost" type="number" min="0" placeholder="INR" defaultValue={editingOption?.totalCost ?? ""} /></FieldLabel>
                      <FieldLabel>Per-person cost<Input name="perPersonCost" type="number" min="0" placeholder="INR" defaultValue={editingOption?.perPersonCost ?? ""} /></FieldLabel>
                      <FieldLabel>Capacity notes<Input name="capacityNotes" placeholder="Beds, rooms, rules" defaultValue={editingOption?.capacityNotes ?? ""} /></FieldLabel>
                    </>
                  ) : null}
                </div>
                <div className="rounded-lg border border-dashed border-border bg-background/65 p-3 text-sm text-mutedText">
                  Maps links auto-open with Google Maps search when no URL is pasted. Photo storage is local for now; use the photos button on each place card.
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="submit" disabled={busy} className="w-full sm:w-fit">
                    {editingOption ? <Save size={17} /> : <Plus size={17} />}
                    {editingOption ? "Update place" : "Add place"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setOptionModalOpen(false); setEditingOption(null); }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}
      <MobileBottomNav activePage={activePage} setActivePage={setActivePage} />
      {message ? <div className="fixed bottom-24 right-4 z-50 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white shadow-coastal lg:bottom-5">{message}</div> : null}
    </main>
  );
}

function TripOptionCard({
  option,
  ratings,
  activeTraveler,
  busy,
  onRate,
  onClearRating,
  onEdit,
  onDelete,
  canManagePhotos,
  onUpdatePhotos
}: {
  option: RankedOption;
  ratings: Rating[];
  activeTraveler: string;
  busy: boolean;
  onRate: (optionId: string, stars: number) => void;
  onClearRating: (optionId: string) => void;
  onEdit: (option: RankedOption) => void;
  onDelete: (optionId: string) => void;
  canManagePhotos: boolean;
  onUpdatePhotos: (option: RankedOption, photoUrls: string[]) => void;
}) {
  const Icon = categoryIcons[option.category];
  const constraints = constraintsFor(option);
  const priority = priorityFor(option);
  const [photosOpen, setPhotosOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const photos = option.photoUrls ?? [];

  function addPhoto() {
    if (!photoUrl.trim() || !canManagePhotos) return;
    onUpdatePhotos(option, [photoUrl.trim(), ...photos]);
    setPhotoUrl("");
    setPhotosOpen(true);
  }

  return (
    <Card className={cn("shadow-ticket", option.category === "stay" && "bg-gradient-to-br from-white to-background")}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge variant="secondary">
                <Icon size={13} className="mr-1" />
                {categoryLabels[option.category]}
              </Badge>
              <Badge variant={priority === "Must Visit" ? "accent" : priority === "Optional" ? "outline" : "highlight"}>{priority}</Badge>
              {option.famousFor ? <Badge variant="outline">Best: {option.famousFor}</Badge> : null}
            </div>
            <h3 className="text-xl font-black text-primary">{option.name}</h3>
            <p className="mt-1 flex items-center gap-2 text-sm text-mutedText">
              <MapPin size={15} />
              {option.location}
            </p>
            <p className="mt-3 text-sm font-bold text-primary">{option.description || "Travel place"}</p>
            <p className="mt-1 text-sm leading-6 text-text">{option.notes || "No recommendations yet."}</p>
            {constraints.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {constraints.map((constraint) => (
                  <Badge key={constraint} variant="highlight">{constraint}</Badge>
                ))}
              </div>
            ) : null}
            {option.category === "stay" ? (
              <p className="mt-2 text-sm font-bold text-secondary">
                Total {money(option.totalCost)} - Per person {money(option.perPersonCost)} - {option.capacityNotes || "Capacity TBD"}
              </p>
            ) : null}
          </div>
          <div className="shrink-0 rounded-lg border border-border bg-background/70 p-3 text-center">
            <p className="text-3xl font-black text-accent">{option.averageRating ? option.averageRating.toFixed(1) : "-"}</p>
            <p className="text-xs font-bold text-mutedText">{option.ratingCount} ratings</p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={mapUrlFor(option)} target="_blank" rel="noreferrer">Open Map</a>
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setPhotosOpen((open) => !open)}>
              {photos.length ? "View Photos" : canManagePhotos ? "Add Photos" : "Photos"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => onEdit(option)}>
              <Edit2 size={14} />
              Edit
            </Button>
            <Button type="button" variant="stamp" size="sm" disabled={busy} onClick={() => onDelete(option.id)}>
              <Trash2 size={14} />
              Delete
            </Button>
          </div>
          <div className="flex items-center gap-1" aria-label={`Rate ${option.name}`}>
            {[1, 2, 3, 4, 5].map((star) => {
              const selected = ratingFor(ratings, activeTraveler, option.id) >= star;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => onRate(option.id, star)}
                  className={cn("grid h-9 w-9 place-items-center rounded-md text-mutedText hover:bg-muted/55", selected && "text-accent")}
                >
                  <Star size={18} fill={selected ? "currentColor" : "none"} />
                </button>
              );
            })}
            {ratingFor(ratings, activeTraveler, option.id) ? (
              <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => onClearRating(option.id)}>
                Clear
              </Button>
            ) : null}
          </div>
        </div>
        {photosOpen ? (
          <div className="mt-4 rounded-lg border border-dashed border-border bg-background/65 p-4">
            {canManagePhotos ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input value={photoUrl} onChange={(event) => setPhotoUrl(event.target.value)} placeholder="Paste image URL for this place" />
                <Button type="button" onClick={addPhoto}>Add Photo</Button>
              </div>
            ) : null}
            {photos.length ? (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((photo) => (
                  <div key={photo} className="overflow-hidden rounded-lg border border-border bg-white">
                    <img src={photo} alt={`${option.name} memory`} className="h-28 w-full object-cover" />
                    {canManagePhotos ? (
                      <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => onUpdatePhotos(option, photos.filter((item) => item !== photo))}>
                        Remove
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-mutedText">
                {canManagePhotos ? "No photos yet. Add your first memory from this place." : "No photos yet. Organizers will add pictures for this place."}
              </p>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ItineraryTimeline({
  candidate,
  canSave,
  busy,
  onSave
}: {
  candidate: ItineraryCandidate;
  canSave: boolean;
  busy: boolean;
  onSave: (itineraryId: string) => void;
}) {
  return (
    <Card className="shadow-ticket">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{candidate.name}</CardTitle>
            <CardDescription>{candidate.summary}</CardDescription>
          </div>
          {canSave ? (
            <Button type="button" variant="accent" size="sm" onClick={() => onSave(candidate.id)} disabled={busy}>
              <Save size={15} />
              Save
            </Button>
          ) : null}
        </div>
        {candidate.warnings.length ? (
          <div className="rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm font-bold text-accent">{candidate.warnings.join(" ")}</div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-5">
        {candidate.days.map((day) => (
          <div key={day.date} className="relative pl-7">
            <div className="absolute left-2 top-2 h-full w-px bg-border" />
            <div className="absolute left-0 top-1 grid h-4 w-4 place-items-center rounded-full bg-secondary ring-4 ring-secondary/15" />
            <h4 className="font-black text-primary">{prettyDate(day.date, "long")} - {day.headcount} people</h4>
            <div className="mt-3 grid gap-2">
              {day.stops.length ? (
                day.stops.map((stop) => (
                  <div key={`${candidate.id}-${day.date}-${stop.optionId}`} className="rounded-lg border border-border bg-background/55 p-3">
                    <div className="grid gap-2 sm:grid-cols-[120px_1fr]">
                      <div>
                        <span className="block text-sm font-black text-accent">Reach {stop.arrivalTime ?? stop.time}</span>
                        <span className="mt-1 block text-xs font-bold text-mutedText">{stop.commuteDuration ?? "Estimate TBD"} - {stop.commuteDistance ?? "-"}</span>
                      </div>
                      <div>
                        <p className="font-black text-primary">{stop.optionName}</p>
                        <p className="text-sm text-mutedText">{categoryLabels[stop.category]} - {stop.location}</p>
                        <p className="mt-1 text-xs leading-5 text-mutedText">{stop.reason} Commute is estimated from known Pondicherry areas; verify live traffic before finalizing.</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-border bg-white/70 p-3 text-sm text-mutedText">Open slot for rest, travel, or a late group decision.</p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function StaySection({ stayOptions, totalStayBudget }: { stayOptions: RankedOption[]; totalStayBudget: number }) {
  return (
    <Card>
      <CardHeader>
        <PageHeader eyebrow="Hotel key cards" title="Stay / hotel details" description="Stay options use the same shared option pool, styled like boutique villa key cards." />
      </CardHeader>
      <CardContent className="grid gap-3">
        {stayOptions.length === 0 ? (
          <EmptyState icon={Hotel} title="No stays saved yet" description="Add your villa, hostel, hotel, or beach house from the Stay tab." />
        ) : (
          stayOptions.map((stay) => (
            <div key={stay.id} className="rounded-lg bg-primary p-4 text-white shadow-ticket">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-white/65">Boutique stay card</p>
                  <h3 className="mt-2 text-xl font-black">{stay.name}</h3>
                  <p className="mt-1 text-sm text-white/75">{stay.location}</p>
                </div>
                <Hotel />
              </div>
              <Separator className="my-4 bg-white/18" />
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <span>Total: {money(stay.totalCost)}</span>
                <span>Per person: {money(stay.perPersonCost)}</span>
                <span>Check-in: TBD</span>
                <span>Check-out: TBD</span>
              </div>
              <p className="mt-3 text-sm text-white/75">{stay.capacityNotes || "Room details and booking ID can live in notes for v1."}</p>
            </div>
          ))
        )}
        <div className="rounded-lg border border-border bg-background/65 p-4">
          <p className="text-sm font-bold text-mutedText">Stay budget from listed options</p>
          <p className="mt-1 text-2xl font-black text-primary">{money(totalStayBudget || null)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TransportSection() {
  const confirmedTrips = [
    {
      title: "Hyderabad to Pondicherry",
      travelers: "Main HYD group",
      date: "Aug 1, 2026",
      time: "11:45 AM - 1:40 PM",
      duration: "1 hr 55 min",
      route: "HYD - PNY",
      operator: "IndiGo",
      note: "Nonstop"
    },
    {
      title: "Pondicherry to Hyderabad",
      travelers: "Main HYD return group",
      date: "Aug 4, 2026",
      time: "5:30 PM - 7:20 PM",
      duration: "1 hr 50 min",
      route: "PNY - HYD",
      operator: "IndiGo",
      note: "Return flight"
    },
    {
      title: "Sadana return",
      travelers: "Sadana",
      date: "Aug 3, 2026",
      time: "Time to confirm",
      duration: "Route to confirm",
      route: "PNY - HYD",
      operator: "Flight details pending",
      note: "Leaves one day early"
    }
  ];
  const timingQuestions = [
    "Bhavya: Bangalore to Pondicherry arrival time on Aug 2, and Pondicherry to Bangalore departure time on Aug 4.",
    "Siva Prasad: Bangalore to Pondicherry arrival time on Aug 2, and Pondicherry to Bangalore departure time on Aug 4.",
    "Kusuma: Bangalore to Pondicherry arrival time on Aug 2, and Pondicherry to Bangalore departure time on Aug 4.",
    "Anirudh: Pondicherry to Hyderabad departure time on Aug 4."
  ];

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader>
          <PageHeader eyebrow="Boarding passes" title="Transport / tickets" description="Confirmed flight windows and timing questions needed before the itinerary can be finalized." />
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 lg:grid-cols-3">
            {confirmedTrips.map((trip) => (
              <div key={`${trip.title}-${trip.date}`} className="ticket-cut rounded-lg border border-dashed border-border bg-white p-4 shadow-ticket">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge variant="outline">{trip.operator}</Badge>
                    <h3 className="mt-3 text-lg font-black text-primary">{trip.title}</h3>
                    <p className="mt-1 text-sm text-mutedText">{trip.travelers} - {trip.date}</p>
                  </div>
                  <Plane className="text-secondary" size={28} />
                </div>
                <Separator className="my-4 border-dashed" />
                <div className="grid gap-2 text-sm">
                  <span className="font-black text-primary">{trip.time}</span>
                  <span>{trip.duration} - {trip.route}</span>
                  <span className="text-mutedText">{trip.note}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-accent/25 bg-accent/10 p-4">
            <div className="mb-3 flex items-center gap-2 font-black text-primary">
              <AlertCircle size={18} className="text-accent" />
              Timings to collect individually
            </div>
            <div className="grid gap-2">
              {timingQuestions.map((question) => (
                <p key={question} className="rounded-md bg-white/70 p-3 text-sm leading-6 text-mutedText">{question}</p>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      <LocalCrudSection
        storageKey="pondi-transport"
        title="Transport Items"
        description="Create, edit, complete, and delete train, bus, cab, flight, or rental-bike records."
        icon={Train}
        titlePlaceholder="e.g. Chennai to Pondicherry cab"
        detailPlaceholder="Pickup, driver, passenger, route details"
        metaPlaceholder="Date/time or PNR"
        amountPlaceholder="Cost"
      />
    </div>
  );
}

function ComingSoonSection({ title, description, icon: Icon }: { title: string; description: string; icon: React.ElementType }) {
  return (
    <Card>
      <CardHeader>
        <PageHeader eyebrow="Coming soon" title={title} description={description} />
      </CardHeader>
      <CardContent>
        <div className="grid place-items-center rounded-lg border border-dashed border-border bg-background/65 p-10 text-center">
          <Icon className="mb-4 text-accent" size={34} />
          <p className="text-2xl font-black text-primary">{title} is coming soon</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-mutedText">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function GroupMembers({
  travelers,
  onUpdateTraveler,
  busy
}: {
  travelers: Traveler[];
  onUpdateTraveler: (travelerId: string, input: Partial<Omit<Traveler, "id" | "isOrganizer">>) => void;
  busy: boolean;
}) {
  const [editingTraveler, setEditingTraveler] = useState<Traveler | null>(null);

  function submitTraveler(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingTraveler) return;
    const form = new FormData(event.currentTarget);
    const attendance = tripDates.filter((date) => form.get(date) === "on");
    onUpdateTraveler(editingTraveler.id, {
      name: String(form.get("name") ?? editingTraveler.name),
      age: Number(form.get("age") ?? editingTraveler.age),
      gender: form.get("gender") === "Male" ? "Male" : "Female",
      attendance
    });
    setEditingTraveler(null);
  }

  return (
    <div className="grid gap-5">
      <Card id="group">
        <CardHeader>
          <PageHeader eyebrow="Travel crew" title="Group members" description="Edit traveler details and day-wise attendance for the Pondicherry trip." />
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {travelers.map((traveler) => (
            <MemberCard key={traveler.id} traveler={traveler} onEdit={() => setEditingTraveler(traveler)} />
          ))}
        </CardContent>
      </Card>
      {editingTraveler ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-primary/35 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-xl">
            <CardHeader className="border-b border-border">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge variant="highlight">Edit traveler</Badge>
                  <CardTitle className="mt-3">{editingTraveler.name}</CardTitle>
                  <CardDescription>Update profile and attendance. Organizer status stays hidden and unchanged.</CardDescription>
                </div>
                <Button type="button" variant="outline" onClick={() => setEditingTraveler(null)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <form key={editingTraveler.id} onSubmit={submitTraveler} className="grid gap-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FieldLabel>Name<Input name="name" required defaultValue={editingTraveler.name} /></FieldLabel>
                  <FieldLabel>Age<Input name="age" type="number" min="0" max="120" required defaultValue={editingTraveler.age} /></FieldLabel>
                  <FieldLabel>
                    Gender
                    <Select name="gender" defaultValue={editingTraveler.gender}>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                    </Select>
                  </FieldLabel>
                </div>
                <div className="rounded-lg border border-border bg-background/55 p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-mutedText">Attendance</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {tripDates.map((date) => (
                      <label key={date} className="flex items-center gap-3 rounded-lg border border-border bg-white p-3 text-sm font-bold text-primary">
                        <Checkbox name={date} defaultChecked={editingTraveler.attendance.includes(date)} />
                        {prettyDate(date, "long")}
                      </label>
                    ))}
                  </div>
                </div>
                <Button type="submit" disabled={busy} className="w-full sm:w-fit">
                  <Save size={16} />
                  Save traveler
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function MemberCard({ traveler, onEdit }: { traveler: Traveler; onEdit: () => void }) {
  const initials = traveler.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="rounded-lg border border-border bg-white p-4 shadow-ticket">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-secondary/12 font-black text-secondary">{initials}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-black text-primary">{traveler.name}</h3>
          </div>
          <p className="mt-1 text-sm text-mutedText">
            Age {traveler.age} - {traveler.gender} - {traveler.attendance.length}/4 trip days
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {traveler.attendance.map((date) => (
              <Badge key={date} variant="outline">{prettyDate(date)}</Badge>
            ))}
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onEdit}>
          <Edit2 size={14} />
          Edit
        </Button>
      </div>
    </div>
  );
}

function PackingChecklist({
  checkedPacking,
  setCheckedPacking
}: {
  checkedPacking: Record<string, boolean>;
  setCheckedPacking: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader>
          <PageHeader eyebrow="Packing" title="Grouped checklist" description="A mobile-friendly checklist for documents, beach items, electronics, and shared group items." />
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {packingGroups.map(([group, items]) => (
            <div key={group} className="rounded-lg border border-border bg-white p-4">
              <h3 className="mb-3 font-black text-primary">{group}</h3>
              <div className="grid gap-3">
                {items.map((item) => (
                  <label key={item} className="flex items-center gap-3 text-sm">
                    <Checkbox
                      checked={Boolean(checkedPacking[item])}
                      onChange={(event) => setCheckedPacking((current) => ({ ...current, [item]: event.currentTarget.checked }))}
                    />
                    <span className={cn("font-medium text-text", checkedPacking[item] && "text-mutedText line-through")}>{item}</span>
                    <Badge variant="outline" className="ml-auto">Group</Badge>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <LocalCrudSection
        storageKey="pondi-packing"
        title="Packing Items"
        description="Create, edit, complete, and delete custom packing tasks."
        icon={PackageCheck}
        titlePlaceholder="e.g. Beach mat"
        detailPlaceholder="Who brings it or where it is packed"
        metaPlaceholder="Category or assigned person"
      />
    </div>
  );
}
