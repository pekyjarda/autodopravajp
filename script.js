
(function(){
  var pricePerKm = 11; // Kč
  var waitPerHour = 220; // Kč
  var km = document.getElementById('km');
  var wait = document.getElementById('wait');
  var estimateEl = document.getElementById('estimate');
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  function parseNum(v){
    if (!v) return 0;
    v = String(v).replace(',', '.').trim();
    var n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }
  function fmt(n){
    try {
      return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(n);
    } catch(e){
      return Math.round(n) + ' Kč';
    }
  }
  function recalc(){
    var d = parseNum(km && km.value);
    var w = parseNum(wait && wait.value);
    var est = Math.max(0, d * pricePerKm + w * waitPerHour);
    if (estimateEl) estimateEl.textContent = fmt(est);
  }
  if (km) km.addEventListener('input', recalc);
  if (wait) wait.addEventListener('input', recalc);
  recalc();
})();
