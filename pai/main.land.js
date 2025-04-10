// main.js

document.getElementById('calculate').addEventListener('click', calculateLandDev);
document.getElementById('exportXls').addEventListener('click', exportToExcel);

def calculateLandDev() {
  const lots = parseFloat(document.getElementById('lots').value) || 0;
  const salePricePerLot = parseCurrency(document.getElementById('salePricePerLot').value);
  const lotSalesRevenue = lots * salePricePerLot;

  const purchasePrice = parseCurrency(document.getElementById('landCost').value);
  const loanAmount = parseCurrency(document.getElementById('loanAmount').value);
  const loanRate = parseFloat(document.getElementById('loanRate').value) / 100;
  const loanTerm = parseInt(document.getElementById('loanTerm').value);
  const monthlyRate = loanRate / 12;
  const monthlyPayment = loanAmount > 0 ? loanAmount * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -loanTerm * 12))) : 0;
  const annualDebtService = monthlyPayment * 12;

  const expenses = ['engineering','permits','sitework','utilities','landscaping','marketing','misc']
    .map(id => parseCurrency(document.getElementById(id).value))
    .reduce((a, b) => a + b, 0);

  const totalCost = purchasePrice + expenses;
  const grossProfit = lotSalesRevenue - totalCost;
  const netProfit = lotSalesRevenue - (totalCost + annualDebtService);

  document.getElementById('results').innerHTML = `
    <table class="w-full text-sm text-left border border-gray-300">
      <thead class="bg-blue-100">
        <tr><th class="px-4 py-2">Metric</th><th class="px-4 py-2">Value</th></tr>
      </thead>
      <tbody>
        <tr><td class="px-4 py-2">Lot Sales Revenue</td><td class="px-4 py-2">$${lotSalesRevenue.toLocaleString()}</td></tr>
        <tr><td class="px-4 py-2">Total Development Cost</td><td class="px-4 py-2">$${totalCost.toLocaleString()}</td></tr>
        <tr><td class="px-4 py-2">Annual Debt Service</td><td class="px-4 py-2">$${annualDebtService.toLocaleString()}</td></tr>
        <tr><td class="px-4 py-2 font-semibold">Gross Profit</td><td class="px-4 py-2 font-semibold text-green-700">$${grossProfit.toLocaleString()}</td></tr>
        <tr><td class="px-4 py-2 font-semibold">Net Profit (After Debt)</td><td class="px-4 py-2 font-semibold text-blue-700">$${netProfit.toLocaleString()}</td></tr>
      </tbody>
    </table>
  `;
}

function parseCurrency(val) {
  if (typeof val !== "string") return +val || 0;
  return +val.replace(/[^0-9.-]+/g, "") || 0;
}

function exportToExcel() {
  const table = document.querySelector('#results table');
  if (!table) return alert('Please calculate the proforma first.');
  const ws = XLSX.utils.table_to_sheet(table);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Land Dev Proforma');
  XLSX.writeFile(wb, 'LandDevelopmentProforma.xlsx');
}
