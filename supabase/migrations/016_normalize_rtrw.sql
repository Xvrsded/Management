-- Normalize RW Table
UPDATE public.rw
SET rw_number = LPAD(REGEXP_REPLACE(rw_number, '[^0-9]', '', 'g'), 3, '0')
WHERE rw_number IS NOT NULL;

-- Normalize RT Table
UPDATE public.rt
SET rt_number = LPAD(REGEXP_REPLACE(rt_number, '[^0-9]', '', 'g'), 3, '0')
WHERE rt_number IS NOT NULL;

-- Normalize citizen_profiles Table
UPDATE public.citizen_profiles
SET 
  rw = LPAD(REGEXP_REPLACE(rw, '[^0-9]', '', 'g'), 3, '0'),
  rt = LPAD(REGEXP_REPLACE(rt, '[^0-9]', '', 'g'), 3, '0')
WHERE rw IS NOT NULL AND rt IS NOT NULL;
