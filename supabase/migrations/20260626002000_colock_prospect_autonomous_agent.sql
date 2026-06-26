-- Align Colock Prospect autonomous agent follow-up statuses with J+3/J+7.
alter table prospects drop constraint if exists prospects_statut_contact_check;
alter table prospects add constraint prospects_statut_contact_check
  check (statut_contact in ('Nouveau','Contacté','Relance J+3','Relance J+7','Client signé','Supprimé'));
