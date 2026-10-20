-- Roomie has no weekly review step: every plan is generated already locked.
alter table households alter column plan_mode set default 'auto';
update households set plan_mode = 'auto' where plan_mode = 'review';
