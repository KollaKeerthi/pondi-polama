import { neon } from "@neondatabase/serverless";
import { promises as fs } from "fs";
import path from "path";
import { createInitialState, createSeedOptions } from "./seed";
import { ItineraryCandidate, Rating, Traveler, TripOption, TripState } from "./types";

const dataPath = path.join(process.cwd(), "trip-data.json");

function id(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function cleanNumber(value: number | null | undefined) {
  return value === undefined || Number.isNaN(value) ? null : value;
}

function syncSeedTravelers(state: TripState): TripState {
  return {
    ...state,
    travelers: createInitialState().travelers
  };
}

function syncSeedOptions(state: TripState): TripState {
  const seedOptions = createSeedOptions();
  const userOptions = state.options.filter((option) => !option.id.startsWith("seed-"));

  return {
    ...state,
    options: [...seedOptions, ...userOptions]
  };
}

async function localState(): Promise<TripState> {
  try {
    const state = syncSeedOptions(syncSeedTravelers(JSON.parse(await fs.readFile(dataPath, "utf8")) as TripState));
    await fs.writeFile(dataPath, JSON.stringify(state, null, 2));
    return state;
  } catch {
    const initial = createInitialState();
    await fs.writeFile(dataPath, JSON.stringify(initial, null, 2));
    return initial;
  }
}

async function writeLocalState(state: TripState) {
  await fs.writeFile(dataPath, JSON.stringify(state, null, 2));
}

function db() {
  return process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
}

async function ensureDb() {
  const sql = db();
  if (!sql) return null;

  await sql`
    create table if not exists travelers (
      id text primary key,
      name text not null,
      age integer not null default 0,
      gender text not null default '',
      is_organizer boolean not null default false,
      attendance jsonb not null
    )
  `;
  await sql`alter table travelers add column if not exists age integer not null default 0`;
  await sql`alter table travelers add column if not exists gender text not null default ''`;
  await sql`
    create table if not exists options (
      id text primary key,
      category text not null,
      name text not null,
      location text not null,
      link text not null default '',
      description text not null default '',
      famous_for text not null default '',
      notes text not null default '',
      total_cost numeric,
      per_person_cost numeric,
      capacity_notes text not null default '',
      created_by text not null,
      created_at text not null
    )
  `;
  await sql`
    create table if not exists ratings (
      id text primary key,
      option_id text not null references options(id) on delete cascade,
      traveler_id text not null references travelers(id) on delete cascade,
      stars integer not null check (stars between 1 and 5),
      comment text not null default '',
      unique(option_id, traveler_id)
    )
  `;
  await sql`
    create table if not exists saved_itinerary (
      id integer primary key default 1,
      itinerary jsonb not null
    )
  `;

  for (const traveler of createInitialState().travelers) {
    await sql`
      insert into travelers (id, name, age, gender, is_organizer, attendance)
      values (
        ${traveler.id},
        ${traveler.name},
        ${traveler.age},
        ${traveler.gender},
        ${traveler.isOrganizer},
        ${JSON.stringify(traveler.attendance)}::jsonb
      )
      on conflict (id) do update set
        name = excluded.name,
        age = excluded.age,
        gender = excluded.gender,
        is_organizer = excluded.is_organizer,
        attendance = excluded.attendance
    `;
  }

  for (const option of createSeedOptions()) {
    await sql`
      insert into options (
        id, category, name, location, link, description, famous_for, notes,
        total_cost, per_person_cost, capacity_notes, created_by, created_at
      )
      values (
        ${option.id}, ${option.category}, ${option.name}, ${option.location}, ${option.link},
        ${option.description}, ${option.famousFor}, ${option.notes}, ${option.totalCost},
        ${option.perPersonCost}, ${option.capacityNotes}, ${option.createdBy}, ${option.createdAt}
      )
      on conflict (id) do update set
        category = excluded.category,
        name = excluded.name,
        location = excluded.location,
        link = excluded.link,
        description = excluded.description,
        famous_for = excluded.famous_for,
        notes = excluded.notes,
        total_cost = excluded.total_cost,
        per_person_cost = excluded.per_person_cost,
        capacity_notes = excluded.capacity_notes
    `;
  }

  await sql`delete from options where id like 'seed-nightlife-%'`;

  return sql;
}

export async function getState(): Promise<TripState> {
  const sql = await ensureDb();
  if (!sql) return localState();

  const [travelers, options, ratings, saved] = await Promise.all([
    sql`select id, name, age, gender, is_organizer, attendance from travelers order by id`,
    sql`select * from options order by created_at desc`,
    sql`select id, option_id, traveler_id, stars, comment from ratings`,
    sql`select itinerary from saved_itinerary where id = 1`
  ]);

  return {
    travelers: travelers.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      age: Number(row.age),
      gender: row.gender === "Male" ? "Male" : "Female",
      isOrganizer: Boolean(row.is_organizer),
      attendance: row.attendance
    })) as Traveler[],
    options: options.map((row) => ({
      id: String(row.id),
      category: row.category,
      name: String(row.name),
      location: String(row.location),
      link: String(row.link),
      description: String(row.description),
      famousFor: String(row.famous_for),
      notes: String(row.notes),
      totalCost: row.total_cost === null ? null : Number(row.total_cost),
      perPersonCost: row.per_person_cost === null ? null : Number(row.per_person_cost),
      capacityNotes: String(row.capacity_notes),
      createdBy: String(row.created_by),
      createdAt: String(row.created_at)
    })) as TripOption[],
    ratings: ratings.map((row) => ({
      id: String(row.id),
      optionId: String(row.option_id),
      travelerId: String(row.traveler_id),
      stars: Number(row.stars),
      comment: String(row.comment)
    })) as Rating[],
    savedItinerary: saved[0]?.itinerary ?? null
  };
}

export async function addOption(input: Omit<TripOption, "id" | "createdAt">) {
  const option: TripOption = {
    ...input,
    id: id("option"),
    totalCost: cleanNumber(input.totalCost),
    perPersonCost: cleanNumber(input.perPersonCost),
    createdAt: new Date().toISOString()
  };
  const sql = await ensureDb();

  if (!sql) {
    const state = await localState();
    state.options.unshift(option);
    await writeLocalState(state);
    return option;
  }

  await sql`
    insert into options (
      id, category, name, location, link, description, famous_for, notes,
      total_cost, per_person_cost, capacity_notes, created_by, created_at
    )
    values (
      ${option.id}, ${option.category}, ${option.name}, ${option.location}, ${option.link},
      ${option.description}, ${option.famousFor}, ${option.notes}, ${option.totalCost},
      ${option.perPersonCost}, ${option.capacityNotes}, ${option.createdBy}, ${option.createdAt}
    )
  `;
  return option;
}

export async function updateOption(optionId: string, input: Partial<Omit<TripOption, "id" | "createdAt" | "createdBy">>) {
  const sql = await ensureDb();

  if (!sql) {
    const state = await localState();
    const existing = state.options.find((option) => option.id === optionId);
    if (!existing) return null;
    const updated: TripOption = {
      ...existing,
      ...input,
      totalCost: cleanNumber(input.totalCost ?? existing.totalCost),
      perPersonCost: cleanNumber(input.perPersonCost ?? existing.perPersonCost)
    };
    state.options = state.options.map((option) => (option.id === optionId ? updated : option));
    await writeLocalState(state);
    return updated;
  }

  const current = await sql`select * from options where id = ${optionId}`;
  if (current.length === 0) return null;
  const row = current[0];
  const updated = {
    category: input.category ?? row.category,
    name: input.name ?? row.name,
    location: input.location ?? row.location,
    link: input.link ?? row.link,
    description: input.description ?? row.description,
    famousFor: input.famousFor ?? row.famous_for,
    notes: input.notes ?? row.notes,
    totalCost: cleanNumber(input.totalCost ?? (row.total_cost === null ? null : Number(row.total_cost))),
    perPersonCost: cleanNumber(input.perPersonCost ?? (row.per_person_cost === null ? null : Number(row.per_person_cost))),
    capacityNotes: input.capacityNotes ?? row.capacity_notes
  };

  const rows = await sql`
    update options set
      category = ${updated.category},
      name = ${updated.name},
      location = ${updated.location},
      link = ${updated.link},
      description = ${updated.description},
      famous_for = ${updated.famousFor},
      notes = ${updated.notes},
      total_cost = ${updated.totalCost},
      per_person_cost = ${updated.perPersonCost},
      capacity_notes = ${updated.capacityNotes}
    where id = ${optionId}
    returning *
  `;

  const saved = rows[0];
  return {
    id: String(saved.id),
    category: saved.category,
    name: String(saved.name),
    location: String(saved.location),
    link: String(saved.link),
    description: String(saved.description),
    famousFor: String(saved.famous_for),
    notes: String(saved.notes),
    totalCost: saved.total_cost === null ? null : Number(saved.total_cost),
    perPersonCost: saved.per_person_cost === null ? null : Number(saved.per_person_cost),
    capacityNotes: String(saved.capacity_notes),
    createdBy: String(saved.created_by),
    createdAt: String(saved.created_at)
  } as TripOption;
}

export async function deleteOption(optionId: string) {
  const sql = await ensureDb();

  if (!sql) {
    const state = await localState();
    const before = state.options.length;
    state.options = state.options.filter((option) => option.id !== optionId);
    state.ratings = state.ratings.filter((rating) => rating.optionId !== optionId);
    await writeLocalState(state);
    return state.options.length < before;
  }

  const rows = await sql`delete from options where id = ${optionId} returning id`;
  return rows.length > 0;
}

export async function upsertRating(input: Omit<Rating, "id">) {
  const rating: Rating = { ...input, id: id("rating") };
  const sql = await ensureDb();

  if (!sql) {
    const state = await localState();
    state.ratings = state.ratings.filter((item) => !(item.optionId === rating.optionId && item.travelerId === rating.travelerId));
    state.ratings.push(rating);
    await writeLocalState(state);
    return rating;
  }

  await sql`
    insert into ratings (id, option_id, traveler_id, stars, comment)
    values (${rating.id}, ${rating.optionId}, ${rating.travelerId}, ${rating.stars}, ${rating.comment})
    on conflict (option_id, traveler_id)
    do update set stars = excluded.stars, comment = excluded.comment
  `;
  return rating;
}

export async function deleteRating(optionId: string, travelerId: string) {
  const sql = await ensureDb();

  if (!sql) {
    const state = await localState();
    const before = state.ratings.length;
    state.ratings = state.ratings.filter((rating) => !(rating.optionId === optionId && rating.travelerId === travelerId));
    await writeLocalState(state);
    return state.ratings.length < before;
  }

  const rows = await sql`delete from ratings where option_id = ${optionId} and traveler_id = ${travelerId} returning id`;
  return rows.length > 0;
}

export async function saveItinerary(itinerary: ItineraryCandidate) {
  const sql = await ensureDb();

  if (!sql) {
    const state = await localState();
    state.savedItinerary = itinerary;
    await writeLocalState(state);
    return itinerary;
  }

  await sql`
    insert into saved_itinerary (id, itinerary)
    values (1, ${JSON.stringify(itinerary)}::jsonb)
    on conflict (id) do update set itinerary = excluded.itinerary
  `;
  return itinerary;
}
