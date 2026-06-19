"use client";

import {
  CalendarDays,
  Check,
  Lock,
  MapPin,
  Plus,
  RefreshCw,
  Save,
  Star,
  Users
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
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
  beaches: "Beaches",
  nightlife: "Nightlife"
};

const categoryHints: Record<Category, string> = {
  stay: "Villas, hotels, hostels, beach houses",
  food: "Cafes, Tamil meals, bakeries, seafood",
  shopping: "Markets, boutiques, handicrafts",
  temples: "Culture, history, morning visits",
  beaches: "Sunrise, sunset, walks, water activities",
  nightlife: "Dance pubs, bars, late-night spots"
};

function money(value: number | null) {
  if (value === null || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function ratingFor(ratings: Rating[], travelerId: string, optionId: string) {
  return ratings.find((rating) => rating.travelerId === travelerId && rating.optionId === optionId)?.stars ?? 0;
}

export default function PlannerApp() {
  const [enteredCode, setEnteredCode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [state, setState] = useState<StateResponse | null>(null);
  const [activeTraveler, setActiveTraveler] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("stay");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const activeTravelerRecord = state?.travelers.find((traveler) => traveler.id === activeTraveler);
  const visibleOptions = useMemo(
    () => state?.rankedOptions.filter((option) => option.category === activeCategory) ?? [],
    [activeCategory, state]
  );

  async function loadState() {
    const response = await fetch("/api/state", { cache: "no-store" });
    setState(await response.json());
  }

  useEffect(() => {
    if (!unlocked) return;
    loadState();
  }, [unlocked]);

  useEffect(() => {
    if (!state || activeTraveler) return;
    setActiveTraveler(state.travelers[0]?.id ?? "");
  }, [state, activeTraveler]);

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode: enteredCode.trim() })
    });

    if (response.ok) {
      setUnlocked(true);
      setMessage("");
    } else {
      setMessage("That passcode does not match the trip.");
    }
  }

  async function addNewOption(event: FormEvent<HTMLFormElement>) {
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

    const response = await fetch("/api/options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setBusy(false);
    if (!response.ok) {
      setMessage("Could not add that option. Check the required fields.");
      return;
    }

    event.currentTarget.reset();
    setMessage("Option added for the group.");
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

  if (!unlocked) {
    return (
      <main className="login-shell">
        <section className="login-panel">
          <div className="brand-row">
            <span className="brand-mark">PP</span>
            <span>Pondi Polama</span>
          </div>
          <h1>August 1-4, 2026 trip planner</h1>
          <form onSubmit={unlock} className="login-form">
            <label htmlFor="passcode">Trip passcode</label>
            <div className="passcode-row">
              <Lock size={18} />
              <input id="passcode" value={enteredCode} onChange={(event) => setEnteredCode(event.target.value)} />
              <button type="submit">Enter</button>
            </div>
          </form>
          {message ? <p className="error-text">{message}</p> : null}
        </section>
      </main>
    );
  }

  if (!state) {
    return (
      <main className="loading-shell">
        <RefreshCw className="spin" />
        Loading planner
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <div className="brand-row">
            <span className="brand-mark">PP</span>
            <span>Pondi Polama</span>
          </div>
          <h1>Shared Pondicherry planner</h1>
        </div>
        <div className="topbar-controls">
          <label>
            Traveler
            <select value={activeTraveler} onChange={(event) => setActiveTraveler(event.target.value)}>
              {state.travelers.map((traveler) => (
                <option key={traveler.id} value={traveler.id}>
                  {traveler.name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="icon-button" onClick={loadState} aria-label="Refresh planner">
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      <section className="stats-grid">
        {tripDates.map((date) => {
          const count = state.travelers.filter((traveler) => traveler.attendance.includes(date)).length;
          return (
            <div key={date} className="stat">
              <CalendarDays size={18} />
              <span>{new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}</span>
              <strong>{count} people</strong>
            </div>
          );
        })}
        <div className="stat">
          <Users size={18} />
          <span>Total group</span>
          <strong>{state.travelers.length} people</strong>
        </div>
      </section>

      <section className="workspace">
        <aside className="sidebar">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={category === activeCategory ? "category active" : "category"}
              onClick={() => setActiveCategory(category)}
            >
              <span>{categoryLabels[category]}</span>
              <small>{state.options.filter((option) => option.category === category).length} options</small>
            </button>
          ))}
        </aside>

        <section className="options-panel">
          <div className="section-heading">
            <div>
              <h2>{categoryLabels[activeCategory]}</h2>
              <p>{categoryHints[activeCategory]}</p>
            </div>
            <span className="pill">{visibleOptions.length} ranked</span>
          </div>

          <form className="add-form" onSubmit={addNewOption}>
            <div className="form-grid">
              <label>
                Name
                <input name="name" required placeholder="e.g. Villa Shanti" />
              </label>
              <label>
                Area / location
                <input name="location" required placeholder="e.g. White Town" />
              </label>
              <label>
                Link
                <input name="link" type="url" placeholder="https://..." />
              </label>
              <label>
                What it serves / offers
                <input name="description" placeholder="Cuisine, rooms, activities..." />
              </label>
              <label>
                Famous for
                <input name="famousFor" placeholder="Why people go here" />
              </label>
              <label>
                Notes
                <input name="notes" placeholder="Timing, dress code, booking notes..." />
              </label>
              {activeCategory === "stay" ? (
                <>
                  <label>
                    Total cost
                    <input name="totalCost" type="number" min="0" placeholder="INR" />
                  </label>
                  <label>
                    Per-person cost
                    <input name="perPersonCost" type="number" min="0" placeholder="INR" />
                  </label>
                  <label>
                    Capacity notes
                    <input name="capacityNotes" placeholder="Beds, rooms, rules" />
                  </label>
                </>
              ) : null}
            </div>
            <button type="submit" disabled={busy}>
              <Plus size={17} />
              Add option
            </button>
          </form>

          <div className="option-list">
            {visibleOptions.length === 0 ? (
              <div className="empty-state">No options yet. Add the first one for this category.</div>
            ) : (
              visibleOptions.map((option) => (
                <article className="option-card" key={option.id}>
                  <div className="option-main">
                    <div>
                      <h3>{option.name}</h3>
                      <p className="location">
                        <MapPin size={15} />
                        {option.location}
                      </p>
                    </div>
                    <div className="rating-summary">
                      <strong>{option.averageRating ? option.averageRating.toFixed(1) : "-"}</strong>
                      <span>{option.ratingCount} ratings</span>
                    </div>
                  </div>
                  <p>{option.description || option.famousFor || option.notes || "No notes yet."}</p>
                  {option.famousFor ? <p className="muted">Famous for: {option.famousFor}</p> : null}
                  {option.category === "stay" ? (
                    <p className="cost-line">
                      Total {money(option.totalCost)} · Per person {money(option.perPersonCost)} · {option.capacityNotes || "Capacity TBD"}
                    </p>
                  ) : null}
                  <div className="card-footer">
                    {option.link ? (
                      <a href={option.link} target="_blank" rel="noreferrer">
                        Open link
                      </a>
                    ) : (
                      <span />
                    )}
                    <div className="stars" aria-label={`Rate ${option.name}`}>
                      {[1, 2, 3, 4, 5].map((star) => {
                        const selected = ratingFor(state.ratings, activeTraveler, option.id) >= star;
                        return (
                          <button key={star} type="button" onClick={() => rate(option.id, star)} className={selected ? "selected" : ""}>
                            <Star size={18} fill={selected ? "currentColor" : "none"} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="itinerary-panel">
          <div className="section-heading">
            <div>
              <h2>Itinerary Lab</h2>
              <p>Organizer-triggered candidates from live rankings.</p>
            </div>
            {activeTravelerRecord?.isOrganizer ? <span className="pill organizer">Organizer</span> : null}
          </div>

          {state.savedItinerary ? (
            <div className="saved-banner">
              <Check size={18} />
              Saved: {state.savedItinerary.name}
            </div>
          ) : null}

          <div className="candidate-stack">
            {state.itineraryCandidates.map((candidate) => (
              <article className="candidate" key={candidate.id}>
                <div className="candidate-head">
                  <div>
                    <h3>{candidate.name}</h3>
                    <p>{candidate.summary}</p>
                  </div>
                  {activeTravelerRecord?.isOrganizer ? (
                    <button type="button" onClick={() => saveCandidate(candidate.id)} disabled={busy}>
                      <Save size={16} />
                      Save
                    </button>
                  ) : null}
                </div>
                {candidate.warnings.length ? (
                  <div className="warning">{candidate.warnings.join(" ")}</div>
                ) : null}
                {candidate.days.map((day) => (
                  <div key={day.date} className="day-block">
                    <h4>
                      {new Date(`${day.date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric" })} ·{" "}
                      {day.headcount} people
                    </h4>
                    {day.stops.length ? (
                      day.stops.map((stop) => (
                        <div key={`${candidate.id}-${day.date}-${stop.optionId}`} className="stop-row">
                          <span>{stop.time}</span>
                          <strong>{stop.optionName}</strong>
                          <small>{categoryLabels[stop.category]} · {stop.location}</small>
                        </div>
                      ))
                    ) : (
                      <p className="muted">Open slot for rest, travel, or a late group decision.</p>
                    )}
                  </div>
                ))}
              </article>
            ))}
          </div>
        </section>
      </section>
      {message ? <div className="toast">{message}</div> : null}
    </main>
  );
}
