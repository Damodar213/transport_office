-- Transport Office - Supabase schema
-- Generated to match backend at commit c2e07f1

set check_function_bodies = off;

-- 1) Core users and roles
create table if not exists users (
  id serial primary key,
  user_id varchar(50) unique not null,
  password_hash text not null,
  role varchar(20) not null check (role in ('admin','supplier','buyer')),
  email varchar(255),
  name varchar(100),
  mobile varchar(20),
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

create table if not exists admins (
  id serial primary key,
  user_id varchar(50) unique not null,
  password_hash text not null,
  name varchar(100),
  email varchar(255),
  mobile varchar(20),
  role varchar(20) not null default 'admin',
  permissions text[] default array['all'],
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

-- 2) Parties
create table if not exists suppliers (
  id serial primary key,
  user_id varchar(50) unique not null references users(user_id) on delete cascade,
  company_name varchar(255),
  contact_person varchar(100),
  email varchar(255),
  mobile varchar(20),
  whatsapp varchar(20),
  address text,
  city varchar(100),
  state varchar(100),
  pincode varchar(10),
  gst_number varchar(20),
  pan_number varchar(20),
  number_of_vehicles integer default 0,
  is_verified boolean default false,
  is_active boolean default true,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);
create index if not exists idx_suppliers_user_id on suppliers(user_id);

create table if not exists buyers (
  id serial primary key,
  user_id varchar(50) unique not null references users(user_id) on delete cascade,
  company_name varchar(255),
  contact_person varchar(100),
  email varchar(255),
  mobile varchar(20),
  address text,
  city varchar(100),
  state varchar(100),
  pincode varchar(10),
  gst_number varchar(20),
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);
create index if not exists idx_buyers_user_id on buyers(user_id);

-- 3) Fleet
create table if not exists drivers (
  id serial primary key,
  supplier_id text references suppliers(user_id) on delete cascade,
  driver_name varchar(100) not null,
  mobile varchar(20) not null,
  license_number varchar(50) unique not null,
  license_document_url text,
  aadhaar_number varchar(20),
  experience_years integer,
  is_active boolean default true,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

create table if not exists trucks (
  id serial primary key,
  supplier_id text references suppliers(user_id) on delete cascade,
  vehicle_number varchar(20) unique not null,
  body_type varchar(50) not null,
  capacity_tons decimal(8,2),
  fuel_type varchar(20),
  registration_number varchar(50),
  insurance_expiry date,
  fitness_expiry date,
  permit_expiry date,
  is_active boolean default true,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

-- 4) Supplier transport orders (renamed to suppliers_vehicle_location)
create table if not exists suppliers_vehicle_location (
  id serial primary key,
  supplier_id text references suppliers(user_id) on delete cascade,
  state varchar(100) not null,
  district varchar(100) not null,
  place varchar(200) not null,
  taluk varchar(100),
  vehicle_number varchar(20) not null,
  body_type varchar(50) not null,
  driver_id integer references drivers(id),
  driver_name varchar(100),
  status varchar(20) default 'pending' check (status in ('pending','confirmed','rejected')),
  admin_notes text,
  admin_action_date timestamp,
  created_at timestamp default current_timestamp,
  submitted_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp,
  recommended_location varchar(255)
);
create index if not exists idx_svl_supplier on suppliers_vehicle_location(supplier_id);
create index if not exists idx_svl_status on suppliers_vehicle_location(status);

create table if not exists confirmed_orders (
  id serial primary key,
  transport_order_id integer references suppliers_vehicle_location(id) on delete cascade,
  supplier_id text references suppliers(user_id) on delete cascade,
  driver_id integer references drivers(id),
  truck_id integer references trucks(id),
  pickup_date date,
  delivery_date date,
  actual_pickup_date timestamp,
  actual_delivery_date timestamp,
  status varchar(20) default 'assigned' check (status in ('assigned','picked_up','in_transit','delivered','cancelled')),
  notes text,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

-- 5) Buyer side orders/requests
create table if not exists buyers_orders (
  id serial primary key,
  buyer_id varchar(50) not null,
  order_number varchar(50) unique not null,
  buyer_company varchar(255),
  buyer_name varchar(100),
  load_type varchar(100) not null,
  from_place varchar(255) not null,
  to_place varchar(255) not null,
  quantity decimal(10,2),
  unit varchar(20),
  status varchar(20) default 'draft' check (status in ('draft','submitted','pending','assigned','confirmed','picked_up','in_transit','delivered','cancelled','rejected')),
  notes text,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

create table if not exists buyer_requests (
  id serial primary key,
  buyer_id varchar(50) not null references buyers(user_id) on delete cascade,
  order_number varchar(50) unique not null,
  load_type varchar(100) not null,
  from_state varchar(100) not null,
  from_district varchar(100) not null,
  from_place varchar(255) not null,
  from_taluk varchar(100),
  to_state varchar(100) not null,
  to_district varchar(100) not null,
  to_place varchar(255) not null,
  to_taluk varchar(100),
  estimated_tons decimal(10,2),
  number_of_goods integer,
  delivery_place varchar(255) not null,
  required_date date,
  special_instructions text,
  supplier_id varchar(50) references suppliers(user_id),
  driver_id integer references drivers(id),
  vehicle_id integer references trucks(id),
  rate decimal(10,2),
  distance_km decimal(8,2),
  status varchar(20) default 'draft' check (status in ('draft','submitted','pending','assigned','confirmed','picked_up','in_transit','delivered','cancelled','rejected')),
  admin_notes text,
  assigned_by varchar(255),
  assigned_at timestamp,
  confirmed_at timestamp,
  pickup_date timestamp,
  delivery_date timestamp,
  estimated_delivery_date timestamp,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);
create index if not exists idx_buyer_requests_buyer on buyer_requests(buyer_id);
create index if not exists idx_buyer_requests_status on buyer_requests(status);

-- 6) Submissions and accepted requests
create table if not exists order_submissions (
  id serial primary key,
  order_id integer not null references buyer_requests(id) on delete cascade,
  supplier_id varchar(50) not null references suppliers(user_id) on delete cascade,
  submitted_by varchar(100) not null,
  submitted_at timestamp default current_timestamp,
  whatsapp_sent boolean default false,
  notification_sent boolean default false,
  status varchar(20) default 'new' check (status in ('new','viewed','responded','confirmed','rejected')),
  driver_id integer references drivers(id),
  vehicle_id integer references trucks(id),
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp,
  unique(order_id, supplier_id)
);
create index if not exists idx_order_submissions_supplier on order_submissions(supplier_id);
create index if not exists idx_order_submissions_status on order_submissions(status);

create table if not exists manual_orders (
  id serial primary key,
  order_number varchar(50) unique not null,
  load_type varchar(100) not null,
  estimated_tons decimal(10,2) not null,
  delivery_place varchar(255) not null,
  from_location varchar(255) default 'Admin Specified Location',
  status varchar(50) default 'pending' check (status in ('pending','assigned','in_progress','completed','cancelled')),
  created_by varchar(100) default 'ADMIN',
  assigned_supplier_id varchar(50),
  assigned_supplier_name varchar(255),
  admin_notes text,
  special_instructions text,
  required_date date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
create index if not exists idx_manual_orders_status on manual_orders(status);
create index if not exists idx_manual_orders_order_number on manual_orders(order_number);
create index if not exists idx_manual_orders_created_at on manual_orders(created_at);

create table if not exists manual_order_submissions (
  id serial primary key,
  order_id integer not null references manual_orders(id) on delete cascade,
  supplier_id varchar(50) not null references suppliers(user_id) on delete cascade,
  submitted_by varchar(100) not null,
  submitted_at timestamp default current_timestamp,
  status varchar(20) default 'new' check (status in ('new','viewed','accepted','rejected')),
  notes text,
  driver_id integer references drivers(id),
  vehicle_id integer references trucks(id),
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);
create index if not exists idx_manual_order_submissions_supplier on manual_order_submissions(supplier_id);

create table if not exists accepted_requests (
  id serial primary key,
  order_submission_id integer not null,
  buyer_id varchar(50),
  supplier_id varchar(50) not null,
  driver_id integer,
  vehicle_id integer,
  order_number varchar(50),
  load_type varchar(100),
  from_state varchar(100),
  from_district varchar(100),
  from_place varchar(255),
  to_state varchar(100),
  to_district varchar(100),
  to_place varchar(255),
  estimated_tons decimal(10,2),
  driver_name varchar(100),
  driver_mobile varchar(20),
  vehicle_number varchar(20),
  vehicle_type varchar(50),
  supplier_company varchar(255),
  status varchar(50) default 'accepted',
  accepted_at timestamp,
  sent_by_admin boolean default false,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);
create index if not exists idx_accepted_requests_buyer on accepted_requests(buyer_id);
create index if not exists idx_accepted_requests_supplier on accepted_requests(supplier_id);
create index if not exists idx_accepted_requests_status on accepted_requests(status);

-- 7) Notifications
create table if not exists notifications (
  id serial primary key,
  type varchar(20) not null,
  title varchar(255) not null,
  message text not null,
  category varchar(50) not null,
  priority varchar(20) not null,
  is_read boolean default false,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

create table if not exists supplier_notifications (
  id serial primary key,
  supplier_id varchar(50) not null,
  type varchar(20) not null,
  title varchar(255) not null,
  message text not null,
  category varchar(50) not null,
  priority varchar(20) not null,
  is_read boolean default false,
  order_id varchar(50),
  driver_id varchar(50),
  vehicle_id varchar(50),
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);
create index if not exists idx_supplier_notifications_supplier on supplier_notifications(supplier_id);

create table if not exists buyer_notifications (
  id serial primary key,
  buyer_id varchar(50) not null,
  type varchar(50) not null,
  title varchar(255) not null,
  message text not null,
  category varchar(50),
  priority varchar(20),
  is_read boolean default false,
  order_id integer,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);
create index if not exists idx_buyer_notifications_buyer on buyer_notifications(buyer_id);













