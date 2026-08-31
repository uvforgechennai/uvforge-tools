/* ============================================================
   UV Forge Tools — WhatsApp share.
   Uses the wa.me link format (not the Web Share API) so it works
   consistently on iOS Safari as well as Android Chrome.
   ============================================================ */
function waShare(toolName, resultSummary){
  var msg = toolName + ' — ' + resultSummary + '\n\nTry it free: https://tools.uvforge.in';
  var url = 'https://wa.me/?text=' + encodeURIComponent(msg);
  window.open(url, '_blank', 'noopener');
}
