
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, value] = line.split('=');
  if (key && value) acc[key.trim()] = value.trim();
  return acc;
}, {});

async function test() {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_ANON_KEY;
  console.log('Testing connection to:', url);
  const supabase = createClient(url, key);
  
  try {
    const start = Date.now();
    console.log('Starting fetch...');
    const { data, error } = await supabase.auth.getUser('invalid-token');
    console.log('Response time:', Date.now() - start, 'ms');
    console.log('Error (expected):', error?.message);
  } catch (e) {
    console.error('Fetch failed:', e);
  }
}

test();
