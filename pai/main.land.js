document.getElementById("calculate").addEventListener("click", calculateProforma);
document.getElementById("exportPdf").addEventListener("click", () => window.print());
document.getElementById("exportXls").addEventListener("click", exportToExcel);
document.getElementById("autofillDemo")?.addEventListener("click", autofillSample);

function parseCurrency(val) {
  if (typeof val !== "string") return +val || 0;
  return +val.replace(/[^0-9.-]+/g, "") || 0;
}

function calculateProforma() {
  const lots = parseCurrency(document.getElementById("totalLots").value);
  const price = parseCurrency(document.getElementById("avgSalePrice").value);
  const phases = parseCurrency(document.getElementById("phases").value);
  const landCost = parseCurrency(document.getElementById("landCost").value);
  const siteWork = parseCurrency(document.getElementById("siteWork").value);
  const permits = parseCurrency(document.getElementById("permits").value);
  const consultants = parseCurrency(document.getElementById("consultants").value);
  const contingencyPercent = parseCurrency(document.getElementById("contingency").value) / 100;

  const loanAmount = parseCurrency(document.getElementById("loanAmount").value);
  const loanRate = parseCurrency(document.getElementById("loanRate").value) / 100;
  const loanTerm = parseCurrency(document.getElementById("loanTerm").value);

  const startYear = parseCurrency(document.getElementById("startYear").value);
  const growthRate = parseCurrency(document.getElementById("growthRate").value) / 100;

  const totalDevCost = landCost + siteWork + permits + consultants;
  const contingency = totalDevCost * contingencyPercent;
  const totalCost = totalDevCost + contingency;

  const monthlyRate = loanRate / 12;
  const numPayments = loanTerm * 12;
  const annualDebtService =
    loanAmount > 0
      ? (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -numPayments)) * 12
      : 0;

  // Phase logic: assume even distribution across years
  const lotsPerYear = Math.ceil(lots / 5);
  const results = [];
  let cumulativeLots = 0;

  for (let i = 0; i < 5; i++) {
    const year = startYear + i;
    const soldLots = Math.min(lots - cumulativeLots, lotsPerYear);
    cumulativeLots += soldLots;
    const adjustedPrice = price * Math.pow(1 + growthRate, i);
    const revenue = soldLots * adjustedPrice;
    const cashFlow = revenue - (i === 0 ? totalCost : 0) - annualDebtService;

    results.push({ year, revenue, devCost: i === 0 ? totalCost : 0, debt: annualDebtService, cashFlow });
  }

  const summaryHtml = `
    <div class="text-sm border border-gray-300 rounded p-4">
      <h4 class="text-lg font-semibold mb-2">Summary:</h4>
      <p>Total Project Cost: <strong>$${totalCost.toLocaleString()}</strong></p>
      <p>Annual Debt Service: <strong>$${Math.round(annualDebtService).toLocaleString()}</strong></p>
      <p>Total Lots: <strong>${lots}</strong></p>
      <p>Avg Lot Sale Price: <strong>$${price.toLocaleString()}</strong></p>
    </div>`;

  let tableHtml = `
    <table class="w-full mt-6 text-sm text-left border">
      <thead class="bg-blue-100">
        <tr><th class="px-4 py-2">Year</th><th class="px-4 py-2">Revenue</th><th class="px-4 py-2">Development Cost</th><th class="px-4 py-2">Debt Service</th><th class="px-4 py-2">Cash Flow</th></tr>
      </thead><tbody>`;

  results.forEach(r => {
    tableHtml += `<tr class="border-t">
      <td class="px-4 py-2">${r.year}</td>
      <td class="px-4 py-2">$${Math.round(r.revenue).toLocaleString()}</td>
      <td class="px-4 py-2">$${Math.round(r.devCost).toLocaleString()}</td>
      <td class="px-4 py-2">$${Math.round(r.debt).toLocaleString()}</td>
      <td class="px-4 py-2 font-semibold">$${Math.round(r.cashFlow).toLocaleString()}</td>
    </tr>`;
  });

  tableHtml += "</tbody></table>";

  document.getElementById("results").innerHTML = summaryHtml;
  document.getElementById("proformaTable").innerHTML = tableHtml;
}

function exportToExcel() {
  const ws = XLSX.utils.table_to_sheet(document.querySelector("#proformaTable table"));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Land Proforma");
  XLSX.writeFile(wb, "Land_Proforma.xlsx");
}

function autofillSample() {
  document.getElementById("totalLots").value = 100;
  document.getElementById("avgSalePrice").value = "$150,000";
  document.getElementById("phases").value = 3;
  document.getElementById("landCost").value = "$1,000,000";
  document.getElementById("siteWork").value = "$2,000,000";
  document.getElementById("permits").value = "$300,000";
  document.getElementById("consultants").value = "$200,000";
  document.getElementById("contingency").value = 10;
  document.getElementById("loanAmount").value = "$2,500,000";
  document.getElementById("loanRate").value = 5;
  document.getElementById("loanTerm").value = 5;
  document.getElementById("startYear").value = 2025;
  document.getElementById("growthRate").value = 3;
}
