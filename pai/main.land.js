// main.js for Land Development Proforma

document.getElementById("calculate").addEventListener("click", calculateLandProforma);
document.getElementById("exportXls").addEventListener("click", exportToExcel);

function parseNumber(val) {
  return +val.replace(/[^0-9.-]+/g, '') || 0;
}

function calculateLandProforma() {
  const totalLots = parseNumber(document.getElementById("totalLots").value);
  const avgLotSalePrice = parseNumber(document.getElementById("avgLotSalePrice").value);
  const siteCost = parseNumber(document.getElementById("siteCost").value);
  const engSoftCost = parseNumber(document.getElementById("engSoftCost").value);
  const permitsFees = parseNumber(document.getElementById("permitsFees").value);
  const legalClosing = parseNumber(document.getElementById("legalClosing").value);
  const carryCost = parseNumber(document.getElementById("carryCost").value);
  const marketing = parseNumber(document.getElementById("marketing").value);
  const contingency = parseNumber(document.getElementById("contingency").value);
  const loanAmount = parseNumber(document.getElementById("loanAmount").value);
  const loanRate = parseNumber(document.getElementById("loanRate").value) / 100;
  const amortYears = parseNumber(document.getElementById("loanAmort").value);

  const grossSalesRevenue = totalLots * avgLotSalePrice;
  const totalExpenses = siteCost + engSoftCost + permitsFees + legalClosing + carryCost + marketing + contingency;

  const monthlyRate = loanRate / 12;
  const totalPayments = amortYears * 12;
  const annualDebtService = loanAmount > 0
    ? (loanAmount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -totalPayments))) * 12
    : 0;

  const netProfit = grossSalesRevenue - totalExpenses - annualDebtService;
  const margin = (netProfit / grossSalesRevenue) * 100;

  const resultsHTML = `
    <table class="w-full text-sm text-left border border-gray-300">
      <thead class="bg-blue-100">
        <tr><th class="px-4 py-2">Metric</th><th class="px-4 py-2">Value</th></tr>
      </thead>
      <tbody>
        <tr><td class="px-4 py-2">Total Lots</td><td class="px-4 py-2">${totalLots}</td></tr>
        <tr><td class="px-4 py-2">Average Lot Sale Price</td><td class="px-4 py-2">$${avgLotSalePrice.toLocaleString()}</td></tr>
        <tr><td class="px-4 py-2">Gross Sales Revenue</td><td class="px-4 py-2 font-semibold">$${grossSalesRevenue.toLocaleString()}</td></tr>
        <tr><td class="px-4 py-2">Total Development Costs</td><td class="px-4 py-2">$${totalExpenses.toLocaleString()}</td></tr>
        <tr><td class="px-4 py-2">Annual Debt Service</td><td class="px-4 py-2">$${annualDebtService.toLocaleString(undefined, {maximumFractionDigits: 0})}</td></tr>
        <tr><td class="px-4 py-2 font-bold text-blue-700">Net Profit</td><td class="px-4 py-2 font-bold text-blue-700">$${netProfit.toLocaleString(undefined, {maximumFractionDigits: 0})}</td></tr>
        <tr><td class="px-4 py-2">Profit Margin</td><td class="px-4 py-2">${margin.toFixed(2)}%</td></tr>
      </tbody>
    </table>
  `;

  document.getElementById("results").innerHTML = resultsHTML;
}

function exportToExcel() {
  const ws = XLSX.utils.table_to_sheet(document.querySelector("#results table"));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Land Proforma");
  XLSX.writeFile(wb, "Land_Proforma_Output.xlsx");
}
