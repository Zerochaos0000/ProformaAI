document.getElementById('calculate').addEventListener('click', calculateProforma);
document.getElementById('exportXls').addEventListener('click', exportToExcel);

function parseNumber(val) {
  if (typeof val !== "string") return +val || 0;
  return +val.replace(/[^0-9.-]+/g, "") || 0;
}

function calculateProforma() {
  const totalLots = parseNumber(document.getElementById('totalLots').value);
  const salePricePerLot = parseNumber(document.getElementById('salePricePerLot').value);
  const annualExpense = parseNumber(document.getElementById('annualExpense').value);
  const loanAmount = parseNumber(document.getElementById('loanAmount').value);
  const interestRate = parseNumber(document.getElementById('loanRate').value) / 100;
  const amortizationYears = parseNumber(document.getElementById('loanAmort').value);
  const purchasePrice = parseNumber(document.getElementById('purchasePrice').value);
  const costOfSale = parseNumber(document.getElementById('costOfSale').value) / 100;
  const lotsPerYear = Math.ceil(totalLots / 5);

  // Loan calculations
  const monthlyRate = interestRate / 12;
  const numPayments = amortizationYears * 12;
  const annualDebtService = loanAmount > 0 ? (loanAmount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -numPayments))) * 12 : 0;

  const revenue = [];
  const cashFlow = [];
  let totalRevenue = 0;

  for (let year = 1; year <= 5; year++) {
    const lotsSold = Math.min(lotsPerYear, totalLots - (lotsPerYear * (year - 1)));
    const yearRevenue = lotsSold * salePricePerLot;
    totalRevenue += yearRevenue;
    const netIncome = yearRevenue - annualExpense - annualDebtService;
    revenue.push(yearRevenue);
    cashFlow.push(netIncome);
  }

  // Metrics
  const totalCashFlow = cashFlow.reduce((a, b) => a + b, 0);
  const irr = ((totalCashFlow / purchasePrice) * 100).toFixed(2);
  const equityMultiple = (totalCashFlow / (purchasePrice - loanAmount)).toFixed(2);

  // Results Output
  let html = `<h3 class="text-xl font-bold mb-3">📊 5-Year Summary</h3>
  <table class="min-w-full text-sm text-left border">
    <thead class="bg-blue-100">
      <tr><th class="px-4 py-2">Year</th><th class="px-4 py-2">Lots Sold</th><th class="px-4 py-2">Revenue</th><th class="px-4 py-2">Cash Flow</th></tr>
    </thead><tbody>`;

  for (let i = 0; i < 5; i++) {
    const lotsThisYear = Math.min(lotsPerYear, totalLots - lotsPerYear * i);
    html += `<tr class="border-t">
      <td class="px-4 py-2">Year ${i + 1}</td>
      <td class="px-4 py-2">${lotsThisYear}</td>
      <td class="px-4 py-2">$${revenue[i].toLocaleString()}</td>
      <td class="px-4 py-2">$${cashFlow[i].toLocaleString()}</td>
    </tr>`;
  }

  html += `</tbody></table>
  <div class="mt-4 text-gray-800">
    <p><strong>Total Revenue:</strong> $${totalRevenue.toLocaleString()}</p>
    <p><strong>Total Cash Flow:</strong> $${totalCashFlow.toLocaleString()}</p>
    <p><strong>Estimated IRR:</strong> ${irr}%</p>
    <p><strong>Equity Multiple:</strong> ${equityMultiple}x</p>
  </div>`;

  document.getElementById('results').innerHTML = html;
}

function exportToExcel() {
  const table = document.querySelector("#results table");
  const ws = XLSX.utils.table_to_sheet(table);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "LandProforma");
  XLSX.writeFile(wb, "LandProforma.xlsx");
}
