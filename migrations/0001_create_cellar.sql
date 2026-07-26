-- Durable storage for the cellar.
--
-- `data` holds the full validated record as JSON and is the source of truth.
-- The remaining columns are a projection maintained on every write so that the
-- terroir atlas and cellar insights can aggregate and filter without parsing
-- every row. Keeping one authoritative copy avoids the two drifting apart.

create table if not exists wines (
  id          text primary key,
  legacy_id   integer,
  producer    text not null default '',
  name        text not null,
  vintage     text,
  country     text,
  region      text,
  subregion   text,
  varietal    text,
  style       text,
  occasion    text,
  status      text not null default 'in_cellar',
  quantity    integer not null default 1,
  drunk_date  text,
  data        text not null,
  created_at  text not null,
  updated_at  text not null
);

create index if not exists wines_status_idx   on wines (status);
create index if not exists wines_style_idx    on wines (style);
create index if not exists wines_country_idx  on wines (country);
create index if not exists wines_region_idx   on wines (region);
create index if not exists wines_varietal_idx on wines (varietal);
create index if not exists wines_vintage_idx  on wines (vintage);

-- Legacy ids come from the original wine-catalog.jsx prototype and must stay
-- unique so a repeated import cannot duplicate a bottle.
create unique index if not exists wines_legacy_id_idx
  on wines (legacy_id) where legacy_id is not null;

create table if not exists tasting_events (
  id         text primary key,
  wine_id    text not null,
  date       text not null,
  rating     real,
  data       text not null,
  created_at text not null
);

create index if not exists tasting_events_wine_idx on tasting_events (wine_id);
create index if not exists tasting_events_date_idx on tasting_events (date);

create table if not exists wishlist_items (
  id         text primary key,
  producer   text,
  name       text not null,
  vintage    text,
  region     text,
  priority   text,
  data       text not null,
  created_at text not null,
  updated_at text not null
);
