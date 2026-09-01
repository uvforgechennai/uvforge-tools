/* ============================================================
   UV Forge Tools — shared logic, loaded on every page.
   Contains: FAQ accordion + auto JSON-LD, INR formatting,
   Indian number-to-words, and small DOM helpers reused by tools.
   ============================================================ */

/* ---- Persistent sidebar (all tools, grouped) injected on every page ----
   Restructures header + main + footer into a sidebar/content shell. Purely
   a DOM move at DOMContentLoaded time (after each page's own inline script
   has already run), so it never touches element IDs, event bindings, or
   per-page state — safe on every tool page. Adding tool #11: just add it
   to the right group below (or a new group) — every page's sidebar updates
   automatically, no per-page HTML edits needed. */
var UV_TOOL_GROUPS = [
  { category: 'Finance Calculators', tools: [
    { name: 'EMI Calculator', url: '/emi-calculator.html' },
    { name: 'SIP Calculator', url: '/sip-calculator.html' },
    { name: 'HRA Exemption Calculator', url: '/hra-calculator.html' }
  ]},
  { category: 'Documents & Invoices', tools: [
    { name: 'GST Invoice Generator', url: '/gst-invoice.html' },
    { name: 'Salary Slip Generator', url: '/salary-slip.html' },
    { name: 'Rent Receipt Generator', url: '/rent-receipt.html' }
  ]},
  { category: 'Everyday Utilities', tools: [
    { name: 'Age Calculator', url: '/age-calculator.html' },
    { name: 'WhatsApp Formatter', url: '/whatsapp-formatter.html' },
    { name: 'Number to Words', url: '/number-to-words.html' },
    { name: 'QR Code Generator', url: '/qr-generator.html' }
  ]}
];

(function initSidebar(){
  document.addEventListener('DOMContentLoaded', function(){
    var header = document.querySelector('header.site-header');
    var main = document.querySelector('main');
    if(!header || !main) return;

    function normalize(path){
      path = path.replace(/index\.html$/, '').replace(/\.html$/, '');
      return path === '' ? '/' : path;
    }
    var current = normalize(window.location.pathname);

    var sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';
    sidebar.id = 'sidebar';

    var html = '<a href="/" class="sidebar-home' + (current === '/' ? ' active' : '') + '">🏠 All Tools</a>';
    UV_TOOL_GROUPS.forEach(function(group){
      html += '<div class="sidebar-group"><div class="sidebar-heading">' + group.category + '</div>';
      group.tools.forEach(function(tool){
        var active = normalize(tool.url) === current ? ' active' : '';
        html += '<a href="' + tool.url + '" class="sidebar-link' + active + '">' + tool.name + '</a>';
      });
      html += '</div>';
    });
    sidebar.innerHTML = html;

    var overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.onclick = function(){ sidebar.classList.remove('open'); overlay.classList.remove('show'); };

    var content = document.createElement('div');
    content.className = 'app-content';

    var shell = document.createElement('div');
    shell.className = 'app-shell';
    shell.appendChild(sidebar);
    shell.appendChild(content);

    var footer = document.querySelector('footer.site-footer');
    content.appendChild(main);
    if(footer) content.appendChild(footer);
    header.insertAdjacentElement('afterend', shell);
    document.body.appendChild(overlay);

    var toggle = document.createElement('button');
    toggle.className = 'sidebar-toggle';
    toggle.setAttribute('aria-label', 'Toggle tools menu');
    toggle.innerHTML = '☰';
    toggle.onclick = function(){
      sidebar.classList.toggle('open');
      overlay.classList.toggle('show');
    };
    var headerInner = header.querySelector('.header-inner');
    if(headerInner) headerInner.insertBefore(toggle, headerInner.firstChild);
  });
})();

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

/* ---- Same as formatINR but "Rs." instead of "₹" — pdf-lib's built-in
   fonts use WinAnsi encoding and cannot render the ₹ glyph at all, so any
   PDF text built with formatINR() throws "WinAnsi cannot encode ₹" mid-save.
   Use this instead of formatINR() anywhere text is drawn into a PDF. ---- */
function formatINRForPdf(num, decimals){
  if(isNaN(num)) return 'Rs. 0';
  decimals = decimals || 0;
  return 'Rs. ' + Number(num).toLocaleString('en-IN', {
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
