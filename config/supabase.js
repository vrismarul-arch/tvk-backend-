import { createClient } from "@supabase/supabase-js";


export const supabase = createClient(
  "https://yhagdvibohwzllsvtfuv.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloYWdkdmlib2h3emxsc3Z0ZnV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTE3NzIyOCwiZXhwIjoyMDg0NzUzMjI4fQ.A5j0EgPwKJXm8qVErLRWf65aWgPo3BLttrY9GnQcyh0"
);
