create table profiles (
  id uuid references auth.users on delete cascade primary key,
  nom text,
  prenom text,
  age integer,
  poids numeric,
  taille numeric,
  sexe text,
  niveau_activite text,
  experience text,
  seances_par_semaine integer,
  duree_seance text,
  lieu_entrainement text,
  blessures text,
  alimentation text,
  sommeil_stress text,
  objectifs text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

alter table profiles enable row level security;

create policy "Utilisateur voit son propre profil"
  on profiles for select using (auth.uid() = id);

create policy "Utilisateur modifie son propre profil"
  on profiles for insert with check (auth.uid() = id);

create policy "Utilisateur met à jour son propre profil"
  on profiles for update using (auth.uid() = id);
