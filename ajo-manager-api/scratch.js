require('dotenv').config({ path: '/home/weirdsoul/Desktop/ajop-project/ajo-manager-api/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  const groupId = 'b254a06b-bed2-44ee-8ac5-8816934a23d3';
  
  // Get all members for the group
  const { data: members, error: memErr } = await supabase.from('group_members').select('*').eq('group_id', groupId);
  if (memErr) return console.error(memErr);
  
  // Get all existing contributions to avoid duplicates
  const { data: existing, error: extErr } = await supabase.from('contributions').select('member_id').eq('group_id', groupId).eq('cycle_number', 1);
  if (extErr) return console.error(extErr);
  
  const existingMemberIds = existing.map(c => c.member_id);
  
  const inserts = members
    .filter(m => !existingMemberIds.includes(m.id))
    .map(m => ({
      group_id: groupId,
      member_id: m.id,
      cycle_number: 1,
      status: 'pending'
    }));
    
  if (inserts.length > 0) {
    const { data, error } = await supabase.from('contributions').insert(inserts);
    if (error) console.error("Insert error:", error);
    else console.log(`Successfully generated ${inserts.length} missing contributions!`);
  } else {
    console.log("No missing contributions to generate.");
  }
}
fix();
