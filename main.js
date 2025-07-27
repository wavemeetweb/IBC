// Add new customer/service entry
document.getElementById('customerForm').onsubmit = function (e) {
  e.preventDefault();

  const name = e.target.name.value.trim();
  const email = e.target.email.value.trim();  // optional
  const phone = e.target.phone.value.trim();
  const service = e.target.service.value.trim();
  const entryDate = e.target.entryDate.value;
  const returnDate = e.target.returnDate.value; // optional now

  // Validation: required fields (except email and returnDate)
  if (!name || !phone || !service || !entryDate) {
    alert('Please fill in all required fields (Name, Phone, Service, Entry Date).');
    return;
  }

  // If returnDate is provided, validate dates
  if (returnDate) {
    if (new Date(returnDate) < new Date(entryDate)) {
      alert('Return Date cannot be before Entry Date.');
      return;
    }
    const msInDay = 1000 * 60 * 60 * 24;
    const diffDays = (new Date(returnDate) - new Date(entryDate)) / msInDay;
    if (diffDays > 30) {
      alert('Return Date should be within 30 days of Entry Date.');
      return;
    }
  }

  customers.push({
    id: Date.now(),
    name,
    email,
    phone,
    service,
    entryDate,
    returnDate: returnDate || '', // store empty string if not provided
  });

  filteredCustomers = [...customers];
  saveData();
  updateCustomerTable();
  e.target.reset();
};
