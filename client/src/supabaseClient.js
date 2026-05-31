import { createClient } from '@supabase/supabase-js';

// Wpisz tutaj swój URL z Supabase
const supabaseUrl = "https://kbiozjnlldjydtpoacnb.supabase.co";

// Wpisz tutaj swój klucz ANON KEY (publiczny) - NIE service_role!
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiaW96am5sbGRqeWR0cG9hY25iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNTUzMjgsImV4cCI6MjA3NDczMTMyOH0.7T2AWOV6xD9KHocw1IfAVynA5znglZKjdc_TLncgIGE";

export const supabase = createClient(supabaseUrl, supabaseKey);