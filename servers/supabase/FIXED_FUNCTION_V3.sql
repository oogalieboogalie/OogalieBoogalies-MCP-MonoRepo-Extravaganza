-- FIXED VERSION V3: Handles INSERT/UPDATE/DELETE properly
CREATE OR REPLACE FUNCTION exec_sql_plpgsql(p_sql text, p_params jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
  v_rec record;
  v_wrapped_sql text;
  v_sql_upper text;
BEGIN
  -- Handle parameter substitution if params provided
  IF p_params != '{}'::jsonb THEN
    FOR v_rec IN SELECT * FROM jsonb_each_text(p_params)
    LOOP
      p_sql := replace(p_sql, ':' || v_rec.key, quote_literal(v_rec.value));
    END LOOP;
  END IF;

  -- Normalize SQL for checking (remove leading whitespace, convert to uppercase)
  v_sql_upper := upper(trim(p_sql));

  -- Check if this is a statement that doesn't return rows (DDL or DML without RETURNING)
  IF v_sql_upper ~* '^\s*(CREATE|ALTER|DROP|TRUNCATE|GRANT|REVOKE|INSERT|UPDATE|DELETE)\s'
     AND v_sql_upper !~* 'RETURNING' THEN
    -- Statement doesn't return rows - execute directly
    EXECUTE p_sql;

    RETURN jsonb_build_object(
      'ok', true,
      'rows', '[]'::jsonb,
      'row_count', 0,
      'message', 'Statement executed successfully'
    );
  ELSE
    -- Query statement (SELECT, or INSERT/UPDATE/DELETE with RETURNING) - wrap to get rows
    v_wrapped_sql := format('SELECT COALESCE(json_agg(row_to_json(t)), ''[]''::json)::jsonb FROM (%s) t', p_sql);

    -- Execute the wrapped SQL
    EXECUTE v_wrapped_sql INTO v_result;

    -- Return structured response
    RETURN jsonb_build_object(
      'ok', true,
      'rows', v_result,
      'row_count', jsonb_array_length(v_result)
    );
  END IF;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'ok', false,
    'error', SQLERRM,
    'detail', SQLSTATE,
    'sql', p_sql
  );
END;
$$;

-- Only allow service role to execute
GRANT EXECUTE ON FUNCTION exec_sql_plpgsql TO service_role;
