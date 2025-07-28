const SUPABASE_URL = '<YOUR_SUPABASE_URL>';
const SUPABASE_KEY = '<YOUR_ANON_KEY>';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.getElementById('userDisplay').textContent = sessionStorage.getItem('username');

document.getElementById('logoutBtn').onclick = () => {
  sessionStorage.clear();
  location.href = 'login.html';
};

const form = document.getElementById('customerForm');
const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('search');
const refreshBtn = document.getElementById('refreshBtn');

let dataCache = [];

// Immediately prevent default and handle submission correctly
form.addEventListener('submit', async function(e) {
  e.preventDefault();

  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const phone = form.phone.value.trim();
  const service = form.service.value.trim();
  const entry_date = form.entryDate.value;
  const return_date = form.returnDate.value || null;

  if (!name || !phone || !service || !entry_date) {
    alert('Fill all required fields');
    return;
  }

  const { error } = await supabase
    .from('customers')
    .insert([{ name, email: email||null, phone, service, entry_date, return_date }]);

  if (error) {
    alert('Save error: ' + error.message);
    return;
  }

  form.reset();
  loadData();
});

async function loadData() {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('entry_date', { ascending: false });

  if (error) {
    alert('Load error: ' + error.message);
    return;
  }

  dataCache = data;
  renderTable(dataCache);
}

function renderTable(data) {
  tableBody.innerHTML = '';
  data.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.name}</td>
      <td>${r.email||'-'}</td>
      <td>${r.phone}</td>
      <td>${r.service}</td>
      <td>${r.entry_date}</td>
      <td>${r.return_date||''}</td>
      <td><button onclick="deleteRow(${r.id})">Delete</button></td>
    `;
    tableBody.appendChild(tr);
  });
}

window.deleteRow = async function(id) {
  if (!confirm('Delete?')) return;
  const { error } = await supabase.from('customers').delete().eq('id', id);
  if (error) alert('Delete error: ' + error.message);
  else loadData();
};

searchInput.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase();
  const filtered = dataCache.filter(r =>
    r.name.toLowerCase().includes(q) ||
    (r.email && r.email.toLowerCase().includes(q)) ||
    r.phone.toLowerCase().includes(q) ||
    r.service.toLowerCase().includes(q)
  );
  renderTable(filtered);
});

refreshBtn.addEventListener('click', loadData);

// Initial data load
loadData();
