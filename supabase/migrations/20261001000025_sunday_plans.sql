-- Weeks start on Sunday. Until the tick function is redeployed, an old Monday-first build could still plan a
-- Monday week and double every chore; refuse it here. NOT VALID: only new plans are checked, history is kept.
alter table plans add constraint plans_week_starts_sunday check (extract(dow from week_start) = 0) not valid;
