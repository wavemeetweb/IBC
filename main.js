/* Supabase configuration */
const SUPABASE_URL  = 'https://euvrtzphbzewxfdfdwkt.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1dnJ0enBoYnpld3hmZGZkd2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MDA5MjgsImV4cCI6MjA2OTE3NjkyOH0.nHNZV8bgzXROLvAaAFhXtIZH44-161XG6t28G342XZk';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* DOM */
const who = document.getElementById('who');
who.textContent = sessionStorage.getItem('username')||'User';

document.getElementById('logout').onclick = ()=>{
  sessionStorage.clear(); location.href='login.html';
};
document.getElementById('print').onclick = ()=>window.print();

/* State */
let rows = [], view = [];

/* Helpers */
const esc = s => s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const tbody = document.querySelector('#tbl tbody');

function draw(){
  tbody.innerHTML='';
  view.forEach(r=>{
    const tr=document.createElement('tr');
    tr.innerHTML = `
      <td>${esc(r.name)}</td>
      <td>${r.email?esc(r.email):'-'}</td>
      <td>${esc(r.phone)}</td>
      <td>${esc(r.service)}</td>
      <td>${r.entry_date||''}</td>
      <td>${r.return_date||''}</td>
      <td><button class="del" onclick="del(${r.id})">Delete</button></td>`;
    tbody.appendChild(tr);
  });
}

async function load(){
  const {data,error} = await sb.from('customers').select('*').order('entry_date',{ascending:false});
  if(error){alert('Load error: '+error.message);return;}
  rows=data; view=[...rows]; draw();
}
window.del = async id=>{
  if(!confirm('Delete this entry?'))return;
  const {error}=await sb.from('customers').delete().eq('id',id);
  if(error) alert(error.message); else load();
};

/* Add entry */
document.getElementById('custForm').onsubmit = async e=>{
  e.preventDefault();
  const f=e.target;
  const name=f.name.value.trim(), phone=f.phone.value.trim(),
        service=f.service.value.trim(), entry=f.entryDate.value;
  if(!name||!phone||!service||!entry){alert('Fill required fields');return;}
  const {error}=await sb.from('customers').insert([{
    name,
    email:f.email.value.trim()||null,
    phone,
    service,
    entry_date:entry,
    return_date:f.returnDate.value||null
  }]);
  if(error){alert('Save error: '+error.message);return;}
  f.reset(); load();
};

/* Search */
document.getElementById('search').oninput = e=>{
  const q=e.target.value.toLowerCase();
  view = q? rows.filter(r=>
    r.name.toLowerCase().includes(q)||
    (r.email&&r.email.toLowerCase().includes(q))||
    r.phone.toLowerCase().includes(q)||
    r.service.toLowerCase().includes(q)
  ): [...rows];
  draw();
};

/* Manual refresh */
document.getElementById('refresh').onclick = load;

/* Initial load */
load();
