-- Asignaturas aprobadas + eliminar lógica de créditos
alter table public.university_subjects
  add column if not exists approved boolean not null default false;

alter table public.university_subjects drop column if exists credits;