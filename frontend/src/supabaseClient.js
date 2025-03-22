import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://sdqofambolbxunvxyzky.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkcW9mYW1ib2xieHVudnh5emt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NTQxNDAsImV4cCI6MjA1ODIzMDE0MH0.-YghPH9v4NjXr9i5x3zoxATSVqtp9hOo3jT2STB4dqg";

const supabase = createClient(SUPABASE_URL,SUPABASE_ANON_KEY);

export default supabase;