-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Update schedules table to include pg_cron_job_id
ALTER TABLE schedules 
  DROP COLUMN IF EXISTS aws_rule_arn,
  DROP COLUMN IF EXISTS aws_rule_name,
  ADD COLUMN IF NOT EXISTS pg_cron_job_id BIGINT;

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_value(value TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(
    pgp_sym_encrypt(
      value,
      current_setting('app.encryption_key', true)
    ),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt sensitive data
CREATE OR REPLACE FUNCTION decrypt_value(encrypted_value TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(
    decode(encrypted_value, 'base64'),
    current_setting('app.encryption_key', true)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a pg_cron job for a schedule
CREATE OR REPLACE FUNCTION create_schedule_cron_job(
  p_schedule_id UUID,
  p_cron_expression TEXT,
  p_edge_function_url TEXT
)
RETURNS BIGINT AS $$
DECLARE
  v_job_id BIGINT;
  v_job_name TEXT;
  v_command TEXT;
BEGIN
  -- Generate unique job name
  v_job_name := 'schedule_' || p_schedule_id;
  
  -- Create HTTP request command to call edge function
  v_command := format(
    'SELECT net.http_post(
      url:=''%s'',
      headers:=''{"Content-Type": "application/json", "Authorization": "Bearer " || current_setting(''''supabase.service_role_key'''', true) || ""}''::jsonb,
      body:=''{"scheduleId": "%s"}''::jsonb
    )',
    p_edge_function_url,
    p_schedule_id
  );
  
  -- Schedule the job using pg_cron
  v_job_id := cron.schedule(
    v_job_name,
    p_cron_expression,
    v_command
  );
  
  -- Update schedule with job_id
  UPDATE schedules
  SET pg_cron_job_id = v_job_id
  WHERE id = p_schedule_id;
  
  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete a pg_cron job
CREATE OR REPLACE FUNCTION delete_schedule_cron_job(p_job_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(p_job_id);
    RETURN true;
  END IF;
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update a pg_cron job
CREATE OR REPLACE FUNCTION update_schedule_cron_job(
  p_job_id BIGINT,
  p_cron_expression TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_job_record RECORD;
BEGIN
  IF p_job_id IS NOT NULL THEN
    -- Get current job details
    SELECT * INTO v_job_record
    FROM cron.job
    WHERE jobid = p_job_id;
    
    IF FOUND THEN
      -- Delete old job
      PERFORM cron.unschedule(p_job_id);
      
      -- Create new job with updated schedule
      RETURN cron.schedule(
        v_job_record.jobname,
        p_cron_expression,
        v_job_record.command
      ) IS NOT NULL;
    END IF;
  END IF;
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically delete cron job when schedule is deleted
CREATE OR REPLACE FUNCTION trigger_delete_schedule_cron_job()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.pg_cron_job_id IS NOT NULL THEN
    PERFORM delete_schedule_cron_job(OLD.pg_cron_job_id);
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_schedule_delete ON schedules;
CREATE TRIGGER on_schedule_delete
  BEFORE DELETE ON schedules
  FOR EACH ROW
  EXECUTE FUNCTION trigger_delete_schedule_cron_job();

-- Trigger to handle schedule activation/deactivation
CREATE OR REPLACE FUNCTION trigger_schedule_active_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_active = true AND NEW.is_active = false THEN
    -- Deactivating: delete cron job
    PERFORM delete_schedule_cron_job(OLD.pg_cron_job_id);
    NEW.pg_cron_job_id := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_schedule_active_change ON schedules;
CREATE TRIGGER on_schedule_active_change
  BEFORE UPDATE OF is_active ON schedules
  FOR EACH ROW
  WHEN (OLD.is_active IS DISTINCT FROM NEW.is_active)
  EXECUTE FUNCTION trigger_schedule_active_change();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA cron TO postgres;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_schedules_pg_cron_job_id 
  ON schedules(pg_cron_job_id) 
  WHERE pg_cron_job_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_schedules_is_active 
  ON schedules(is_active) 
  WHERE is_active = true;

-- Add helpful comments
COMMENT ON FUNCTION create_schedule_cron_job IS 
  'Creates a pg_cron job that calls the execute-reservation Edge Function';

COMMENT ON FUNCTION delete_schedule_cron_job IS 
  'Removes a pg_cron job by its ID';

COMMENT ON FUNCTION update_schedule_cron_job IS 
  'Updates the schedule of an existing pg_cron job';

COMMENT ON FUNCTION encrypt_value IS 
  'Encrypts sensitive data using pgcrypto';

COMMENT ON FUNCTION decrypt_value IS 
  'Decrypts sensitive data encrypted with encrypt_value';
