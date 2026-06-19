import { neon } from "@neondatabase/serverless";
import { promises as fs } from "fs";
import path from "path";
import { createInitialState } from "./seed";
import { ItineraryCandidate, Rating, Traveler, TripOption, TripState } from "./types";

const dataPath = path.join(process.cwd(), "trip-data.json");

function id(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function cleanNumber(value: number | null | undefined) {
  return value === undefined || Number.isNaN(value) ? null : value;
}

async function localState(): Promise<TripState> {
  try {
    return JSON.parse(await fs.readFile(dataPath, "utf8")) as TripState;
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
      is_organizer boolean not null default false,
      attendance jsonb not null
    )
  `;
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

  const count = await sql`select count(*)::int as count from travelers`;
  if (Number(count[0].count) === 0) {
    for (const traveler of createInitialState().travelers) {
      await sql`
        insert into travelers (id, name, is_organizer, attendance)
        values (${traveler.id}, ${traveler.name}, ${traveler.isOrganizer}, ${JSON.stringify(traveler.attendance)}::jsonb)
      `;
    }
  }

  return sql;
}

export async function getState(): Promise<TripState> {
  const sql = await ensureDb();
  if (!sql) return localState();

  const [travelers, options, ratings, saved] = await Promise.all([
    sql`select id, name, is_organizer, attendance from travelers order by id`,
    sql`select * from options order by created_at desc`,
    sql`select id, option_id, traveler_id, stars, comment from ratings`,
    sql`select itinerary from saved_itinerary where id = 1`
  ]);

  return {
    travelers: travelers.map((row) => ({
      id: String(row.id),
      name: String(row.name),
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
