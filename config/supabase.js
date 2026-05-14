import { createClient } from "@supabase/supabase-js";


export const supabase = createClient(
  "https://bwglgjteqloufayiaadv.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3Z2xnanRlcWxvdWZheWlhYWR2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ5Nzg5MSwiZXhwIjoyMDcxMDczODkxfQ.DHN_CAuWSo0zD3JxZwCA5m5-laqULtNEZn0iu-Ywvlw"
);
