/* ============================================================
   UV Forge Tools — shared logic, loaded on every page.
   Contains: FAQ accordion + auto JSON-LD, INR formatting,
   Indian number-to-words, and small DOM helpers reused by tools.
   ============================================================ */

/* ---- FAQ accordion + auto-generated FAQPage schema ---- */
(function initFaq(){
  document.addEventListener('DOMContentLoaded', function(){
    var items = document.querySelectorAll('.faq-item');
    if(!items.length) return;
    var faqEntities = [];
    items.forEach(function(item){
      var q = item.querySelector('.faq-q');
      var a = item.querySelector('.faq-a');
      if(!q || !a) return;
      q.addEventListener('click', function(){
        item.classList.toggle('open');
      });
      faqEntities.push({
        "@type": "Question",
        "name": q.textContent.trim(),
        "acceptedAnswer": { "@type": "Answer", "text": a.textContent.trim() }
      });
    });
    if(faqEntities.length){
      var ld = document.createElement('script');
      ld.type = 'application/ld+json';
      ld.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqEntities
      });
      document.head.appendChild(ld);
    }
  });
})();

/* ---- Format a number as Indian Rupees, e.g. 1234567 -> ₹12,34,567 ---- */
function formatINR(num, decimals){
  if(isNaN(num)) return '₹0';
  decimals = decimals || 0;
  return '₹' + Number(num).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/* ---- Plain Indian-grouped number, no currency symbol ---- */
function formatIndianNumber(num, decimals){
  decimals = decimals || 0;
  return Number(num).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/* ---- Convert an integer (0 - 999999999999) into Indian-system words ----
   Used by number-to-words.html but kept here for reuse. */
var ONES = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
  'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
var TENS = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

function threeDigitsToWords(n){
  var str = '';
  if(n >= 100){
    str += ONES[Math.floor(n/100)] + ' Hundred ';
    n %= 100;
  }
  if(n >= 20){
    str += TENS[Math.floor(n/10)] + ' ';
    n %= 10;
  }
  if(n > 0){
    str += ONES[n] + ' ';
  }
  return str.trim();
}

function numberToIndianWords(num){
  num = Math.floor(num);
  if(num === 0) return 'Zero';
  if(num < 0) return 'Minus ' + numberToIndianWords(-num);

  var crore = Math.floor(num / 10000000); num %= 10000000;
  var lakh = Math.floor(num / 100000); num %= 100000;
  var thousand = Math.floor(num / 1000); num %= 1000;
  var hundred = num;

  var parts = [];
  if(crore) parts.push(threeDigitsToWords(crore) + ' Crore');
  if(lakh) parts.push(threeDigitsToWords(lakh) + ' Lakh');
  if(thousand) parts.push(threeDigitsToWords(thousand) + ' Thousand');
  if(hundred) parts.push(threeDigitsToWords(hundred));
  return parts.join(' ');
}

/* ---- Copy text to clipboard with a small on-screen confirmation ---- */
function copyToClipboard(text, badgeEl){
  navigator.clipboard.writeText(text).then(function(){
    if(badgeEl){
      badgeEl.classList.add('show');
      setTimeout(function(){ badgeEl.classList.remove('show'); }, 1800);
    }
  }).catch(function(){
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    if(badgeEl){
      badgeEl.classList.add('show');
      setTimeout(function(){ badgeEl.classList.remove('show'); }, 1800);
    }
  });
}

/* ---- Toggle-group helper: wires up a row of buttons to a single active state ----
   Usage: initToggleGroup(el, function(value){ ... }) reads data-value on each button. */
function initToggleGroup(groupEl, onChange){
  var btns = groupEl.querySelectorAll('button');
  btns.forEach(function(btn){
    btn.addEventListener('click', function(){
      btns.forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      onChange(btn.dataset.value);
    });
  });
}
