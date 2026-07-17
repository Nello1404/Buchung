-- Standard-Ausgabenkategorien anlegen (idempotent). Wird für Bestands-Datenbanken
-- benötigt, die vor Einführung der Kategorien bereits initialisiert waren – dort
-- greift der "nur bei leerer DB"-Seed nicht.
INSERT INTO "ExpenseCategory" ("id", "name", "sortOrder", "active", "createdAt") VALUES
  ('cat_miete',        'Miete',                1, true, now()),
  ('cat_personal',     'Personal',             2, true, now()),
  ('cat_sprit',        'Sprit / Tanken',       3, true, now()),
  ('cat_versicherung', 'Versicherung',         4, true, now()),
  ('cat_marketing',    'Marketing',            5, true, now()),
  ('cat_partner',      'Partner-Aufbereitung', 6, true, now()),
  ('cat_sonstiges',    'Sonstiges',            7, true, now())
ON CONFLICT ("name") DO NOTHING;
