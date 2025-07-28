// Supabase config. Use *your* project URL and anon key.
const SUPABASE_URL = 'https://tobukpkjtgwjemoxghry.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvYnVrcGtqdGd3amVtb3hnaHJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MDIwOTgsImV4cCI6MjA2OTI3ODA5OH0.pA_gRllWJBBceEIFurMEE8ectLuu2fHwvElZhsst1jY';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.getElementById('who').textContent = sessionStorage.getItem('username')||'User';
document.getElementById('logoutBtn').onclick = ()=>{
  sessionStorage.clear(); location.href = 'login.html';
};
document.getElementById('printBtn').onclick = ()=>window.print();

let customers = [], filtered = [];

function escapeHTML(s){return (s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}

function render(){
  const tbody = document.querySelector('#customerTable tbody');
  tbody.innerHTML = '';
  filtered.forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHTML(r.name)}</td>
      <td>${r.email ? escapeHTML(r.email): '-'}</td>
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
  const {data,error} = await supabase.from('customers').select('*').order('entry_date', {ascending:false});
  if(error){alert('Load error: '+error.message);return;}
  customers = data||[]; filtered = [...customers]; render();
}

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

  const { error } = await supabase.from('customers').insert([
    { name, email: email||null, phone, service, entry_date, return_date }
  ]);
  if(error){
    alert('Error saving data: ' + error.message);
    return;
  }
  f.reset(); loadCustomers();
};

document.getElementById('search').oninput = e=>{
  const q = e.target.value.toLowerCase();
  filtered = q ?
    customers.filter(r =>
      r.name.toLowerCase().includes(q) ||
      (r.email && r.email.toLowerCase().includes(q)) ||
      r.phone.toLowerCase().includes(q) ||
      r.service.toLowerCase().includes(q)
    ) : [...customers];
  render();
};
document.getElementById('refreshBtn').onclick = loadCustomers;
window.onload = loadCustomers;
