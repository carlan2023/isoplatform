-- ===========================================================================
-- Correct "Safty" → "Safety" and drop the stray "Limited" on the ISO 22000 blurb
-- ===========================================================================
-- Run this in the Supabase SQL editor. Safe to run more than once.
--
-- The public site also corrects this on the way out (lib/copy.ts), so the
-- pages read "Food Safety Management Systems" even before this is applied.
-- This updates the stored row. As of review, the only live occurrence is
-- courses.description for "ISO 22000: Lead Auditor":
--   "Food Safty Management Systems Limited"
-- which should be stored as "Food Safety Management Systems" (no "Limited").
-- ===========================================================================

-- Known ISO 22000 blurb: fix the spelling and drop the stray "Limited".
update public.courses
set description = 'Food Safety Management Systems'
where description ilike 'food safty management systems limited'
   or description ilike 'food safety management systems limited';

-- Any other "Safty" still in a description.
update public.courses
set description = replace(
  replace(replace(description, 'SAFTY', 'SAFETY'), 'Safty', 'Safety'),
  'safty',
  'safety'
)
where description ilike '%safty%';

update public.courses
set title = replace(
  replace(replace(title, 'SAFTY', 'SAFETY'), 'Safty', 'Safety'),
  'safty',
  'safety'
)
where title ilike '%safty%';

update public.courses
set standard = replace(
  replace(replace(standard, 'SAFTY', 'SAFETY'), 'Safty', 'Safety'),
  'safty',
  'safety'
)
where standard ilike '%safty%';
