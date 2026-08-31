/* ============================================================
   UV Forge Tools — shared PDF generation (pdf-lib, all in-browser).
   Every generated PDF gets the same header (logo + tools.uvforge.in)
   and footer (credit line + page number). No file ever touches a server.
   Requires pdf-lib to be loaded on the page before this file.
   ============================================================ */

var UV_LOGO_URL = 'https://i.ibb.co/tTSHgc6J/uvforge-logo-trimmed.png';
var UV_PAGE_SIZE = [595.28, 841.89]; // A4 in points
var UV_MARGIN = 40;

/* pdf-lib's built-in fonts (Helvetica etc.) use WinAnsi encoding — Latin-1
   only. Any character outside that range (₹, curly quotes, em dashes,
   emoji...) throws and aborts the whole PDF. This can happen with our own
   text (₹ from formatINR) or with anything a user types into a name/address/
   item-description field, so every string drawn into a PDF goes through
   this first: swap the common cases to a safe equivalent, strip the rest. */
function pdfSafeText(str){
  str = String(str);
  str = str.replace(/₹/g, 'Rs. ')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...');
  return str.replace(/[^\x00-\xFF]/g, '?');
}

async function uvPdfCreate(){
  var PDFDocument = PDFLib.PDFDocument, StandardFonts = PDFLib.StandardFonts;
  var doc = await PDFDocument.create();
  var font = await doc.embedFont(StandardFonts.Helvetica);
  var fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  var logoImage = null;
  try{
    var logoBytes = await fetch(UV_LOGO_URL).then(function(r){ return r.arrayBuffer(); });
    logoImage = await doc.embedPng(logoBytes);
  }catch(e){ /* logo is optional — PDF still generates fine without it */ }
  return { doc: doc, font: font, fontBold: fontBold, logoImage: logoImage, pages: [] };
}

function uvPdfAddPage(ctx){
  var rgb = PDFLib.rgb;
  var blue = rgb(0.145, 0.388, 0.922);
  var border = rgb(0.886, 0.910, 0.941);
  var muted = rgb(0.392, 0.455, 0.545);

  var page = ctx.doc.addPage(UV_PAGE_SIZE);
  var size = page.getSize();
  var width = size.width, height = size.height;
  var margin = UV_MARGIN;

  if(ctx.logoImage){
    var dims = ctx.logoImage.scaleToFit(90, 26);
    page.drawImage(ctx.logoImage, { x: margin, y: height - margin - dims.height + 8, width: dims.width, height: dims.height });
  } else {
    page.drawText('UV Forge', { x: margin, y: height - margin, size: 14, font: ctx.fontBold, color: blue });
  }
  var urlText = 'tools.uvforge.in';
  var urlW = ctx.font.widthOfTextAtSize(urlText, 11);
  page.drawText(urlText, { x: width - margin - urlW, y: height - margin, size: 11, font: ctx.font, color: blue });
  page.drawLine({ start: { x: margin, y: height - margin - 14 }, end: { x: width - margin, y: height - margin - 14 }, thickness: 1, color: border });

  var footerText = 'Generated free at tools.uvforge.in';
  var fw = ctx.font.widthOfTextAtSize(footerText, 9);
  page.drawText(footerText, { x: (width - fw) / 2, y: 20, size: 9, font: ctx.font, color: muted });

  ctx.pages.push(page);
  return {
    page: page, margin: margin, width: width, height: height,
    contentTop: height - margin - 34,
    contentBottom: margin + 24
  };
}

/* Draws a simple table starting at (x, startY). Adds new pages automatically
   when content runs out of room, repeating the header row on each new page.
   columns: [{ header, width, align }]  rows: [[cell, cell, ...], ...]
   Returns the last { page, y, layout } used, so callers can keep drawing. */
function uvPdfDrawTable(ctx, layout, x, startY, columns, rows){
  var rgb = PDFLib.rgb;
  var text = rgb(0.059, 0.09, 0.165);
  var muted = rgb(0.392, 0.455, 0.545);
  var headerBg = rgb(0.937, 0.965, 1);
  var rowH = 22;

  function drawHeader(page, y){
    page.drawRectangle({ x: x, y: y - rowH + 6, width: columns.reduce(function(a,c){return a+c.width;},0), height: rowH, color: headerBg });
    var cx = x;
    columns.forEach(function(col){
      var tw = ctx.fontBold.widthOfTextAtSize(col.header, 9);
      var tx = col.align === 'right' ? cx + col.width - tw - 6 : cx + 6;
      page.drawText(col.header, { x: tx, y: y - rowH + 13, size: 9, font: ctx.fontBold, color: muted });
      cx += col.width;
    });
    return y - rowH;
  }

  var page = layout.page, y = startY;
  y = drawHeader(page, y);

  for(var r = 0; r < rows.length; r++){
    if(y - rowH < layout.contentBottom){
      layout = uvPdfAddPage(ctx);
      page = layout.page;
      y = layout.contentTop;
      y = drawHeader(page, y);
    }
    var cx = x;
    rows[r].forEach(function(cell, i){
      var col = columns[i];
      var s = pdfSafeText(cell);
      var tw = ctx.font.widthOfTextAtSize(s, 9.5);
      var tx = col.align === 'right' ? cx + col.width - tw - 6 : cx + 6;
      page.drawText(s, { x: tx, y: y - rowH + 14, size: 9.5, font: ctx.font, color: text });
      cx += col.width;
    });
    page.drawLine({ start: { x: x, y: y - rowH }, end: { x: x + columns.reduce(function(a,c){return a+c.width;},0), y: y - rowH }, thickness: 0.5, color: rgb(0.906,0.92,0.941) });
    y -= rowH;
  }
  return { page: page, y: y, layout: layout };
}

async function uvPdfDownload(ctx, filename){
  var pages = ctx.doc.getPages();
  var rgb = PDFLib.rgb;
  var muted = rgb(0.392, 0.455, 0.545);
  pages.forEach(function(page, i){
    var size = page.getSize();
    var t = 'Page ' + (i + 1) + ' of ' + pages.length;
    var w = ctx.font.widthOfTextAtSize(t, 9);
    page.drawText(t, { x: size.width - UV_MARGIN - w, y: 20, size: 9, font: ctx.font, color: muted });
  });
  var bytes = await ctx.doc.save();
  var blob = new Blob([bytes], { type: 'application/pdf' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(function(){ URL.revokeObjectURL(url); }, 2000);
}
