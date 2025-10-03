import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://fhszivqrczaeosawhfnu.supabase.co';
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoc3ppdnFyY3phZW9zYXdoZm51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMzIwODAsImV4cCI6MjA3NDgwODA4MH0.svtb3zFibMhfRNu2L7EMAAQE6fHTDV0qfE4BRveuJOw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);