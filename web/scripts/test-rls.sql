-- ==============================================================================
-- MedAI: Row Level Security (RLS) Verification Script
-- Run in Supabase SQL Editor on a staging/development database.
-- ==============================================================================

do $$
declare
  user_a uuid := '11111111-1111-1111-1111-111111111111';
  user_b uuid := '22222222-2222-2222-2222-222222222222';
  test_report_id uuid;
  selected_rows integer;
  tamper_prevented boolean := false;
begin
  raise notice '=== STARTING MEDAI RLS SECURITY TEST SUITE ===';

  -- 1. Setup mock profiles for user_a and user_b
  insert into auth.users (id, email) values (user_a, 'user_a@test.local') on conflict do nothing;
  insert into auth.users (id, email) values (user_b, 'user_b@test.local') on conflict do nothing;

  -- 2. User A creates a profile and private report
  set local role authenticated;
  perform set_config('request.jwt.claim.sub', user_a::text, true);

  insert into public.profiles (id, full_name, age, biological_sex)
  values (user_a, 'Alice Patient', 29, 'Female')
  on conflict (id) do update set full_name = 'Alice Patient';

  insert into public.reports (user_id, symptom_description, ai_response, is_emergency, is_public)
  values (
    user_a,
    'Mild headache on left temple',
    '{"condition": "Tension Headache", "confidenceLevel": "High"}'::jsonb,
    false,
    false
  )
  returning id into test_report_id;

  raise notice '[PASS] Test 1: User A successfully created profile and private report %', test_report_id;

  -- 3. Switch context to User B: Attempt to read User A profile
  perform set_config('request.jwt.claim.sub', user_b::text, true);

  select count(*) into selected_rows from public.profiles where id = user_a;
  if selected_rows <> 0 then
    raise exception '[FAIL] Test 2: User B was able to view User A profile! Rows: %', selected_rows;
  end if;
  raise notice '[PASS] Test 2: User B cannot view User A profile (0 rows returned)';

  -- 4. User B attempts to read User A private report
  select count(*) into selected_rows from public.reports where id = test_report_id;
  if selected_rows <> 0 then
    raise exception '[FAIL] Test 3: User B was able to view User A private report! Rows: %', selected_rows;
  end if;
  raise notice '[PASS] Test 3: User B cannot view User A private report (0 rows returned)';

  -- 5. User B attempts to UPDATE User A report
  update public.reports set is_public = true where id = test_report_id;
  get diagnostics selected_rows = row_count;
  if selected_rows <> 0 then
    raise exception '[FAIL] Test 4: User B was able to modify User A report!';
  end if;
  raise notice '[PASS] Test 4: User B cannot update User A report (0 rows affected)';

  -- 6. User B attempts to DELETE User A report
  delete from public.reports where id = test_report_id;
  get diagnostics selected_rows = row_count;
  if selected_rows <> 0 then
    raise exception '[FAIL] Test 5: User B was able to delete User A report!';
  end if;
  raise notice '[PASS] Test 5: User B cannot delete User A report (0 rows affected)';

  -- 7. Switch back to User A: Verify tamper protection trigger on immutable columns
  perform set_config('request.jwt.claim.sub', user_a::text, true);

  begin
    update public.reports
    set ai_response = '{"condition": "Fabricated Diagnosis"}'::jsonb
    where id = test_report_id;
  exception when others then
    tamper_prevented := true;
    raise notice '[PASS] Test 6: Tamper protection trigger blocked altering ai_response: %', sqlerrm;
  end;

  if not tamper_prevented then
    raise exception '[FAIL] Test 6: Tamper protection trigger failed to block modifying ai_response!';
  end if;

  -- 8. Verify User A CAN toggle is_public
  update public.reports set is_public = true where id = test_report_id;
  raise notice '[PASS] Test 7: User A successfully toggled report to is_public = true';

  -- 9. User B now views the public report
  perform set_config('request.jwt.claim.sub', user_b::text, true);
  select count(*) into selected_rows from public.reports where id = test_report_id;
  if selected_rows <> 1 then
    raise exception '[FAIL] Test 8: Public report was not viewable by User B!';
  end if;
  raise notice '[PASS] Test 8: Public report is visible to other users (1 row returned)';

  -- 10. Cleanup
  reset role;
  delete from public.reports where id = test_report_id;
  delete from public.profiles where id in (user_a, user_b);
  delete from auth.users where id in (user_a, user_b);

  raise notice '=== ALL RLS SECURITY TESTS PASSED SUCCESSFULLY ===';
end $$;
