// --- CONFIG ---
// Replace key with your actual anon public API key from Supabase dashboard if needed
const SUPABASE_URL = 'https://euvrtzphbzewxfdfdwkt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1dnJ0enBoYnpld3hmZGZkd2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MDA5MjgsImV4cCI6MjA2OTE3NjkyOH0.nHNZV8bgzXROLvAaAFhXtIZH44-161XG6t28G342XZk';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- DOM ---
document.getElementById('who').textContent = sessionStorage.getItem('username')||'User';
document.getElementById('logoutBtn').onclick = ()=>{
  sessionStorage.clear(); location.href = 'login.html';
};
document.getElementById('printBtn').onclick = ()=>window.print();

// --- State ---
let customers = [], filtered = [];

// --- Helpers ---
function escapeHTML(s){return (s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function render(){
  const tbody = document.querySelector('#customerTable tbody');
  tbody.innerHTML = '';
  filtered.forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHTML(r.name)}</td>
      <td>${r.email?escapeHTML(r.email):'-'}</td>
      <td>${escapeHTML(r.phone)}</td>
      <td>${escapeHTML(r.service)}</td>
      <td>${r.entry_date||''}</td>
      <td>${r.return_date||''}</td>
      <td><button class="del" onclick="delCustomer(${r.id})">Delete</button></td>
    `;
    tbody.appendChild(tr);
  });
}
window.delCustomer = async function(id){
  if(!confirm('Delete this entry?')) return;
  const {error} = await supabase.from('customers').delete().eq('id',id);
  if(error) alert(error.message); else loadCustomers();
};

async function loadCustomers(){
  const {data,error} = await supabase.from('customers').select('*').order('entry_date',{ascending:false});
  if(error){alert('Load error: '+error.message);return;}
  customers = data||[]; filtered = [...customers]; render();
}

// --- Add entry ---
document.getElementById('custForm').onsubmit = async e=>{
  e.preventDefault();
  const f = e.target;
  const name = f.name.value.trim();
  const email = f.email.value.trim();
  const phone = f.phone.value.trim();
  const service = f.service.value.trim();
  const entry_date = f.entryDate.value;
  const return_date = f.returnDate.value || null;

  if(!name || !phone || !service || !entry_date){
    alert('Please fill all required fields');
    return;
  }

  // (Debug, optional) console.log({name,email,phone,service,entry_date,return_date});

  const { error } = await supabase.from('customers').insert([
    { name, email: email || null, phone, service, entry_date, return_date }
  ]);
  if(error){
    alert('Error saving data: ' + error.message);
    return;
  }
  f.reset();
  loadCustomers();
};

// --- Search ---
document.getElementById('search').oninput = e=>{
  const q = e.target.value.toLowerCase();
  filtered = q?
    customers.filter(r =>
      r.name.toLowerCase().includes(q) ||
      (r.email && r.email.toLowerCase().includes(q)) ||
      r.phone.toLowerCase().includes(q) ||
      r.service.toLowerCase().includes(q)
    ) : [...customers];
  render();
};

// --- Manual refresh button ---
document.getElementById('refreshBtn').onclick = loadCustomers;

// --- Initial Load ---
window.onload = loadCustomers;
