/* Sangam Skin — content protection (deterrent layer).
   Blocks the context menu, text selection copying, and image dragging.
   Form fields stay fully usable so the quiz and any future inputs work. */
(function () {
  'use strict';

  var isFormField = function (el) {
    return !!(el && el.closest && el.closest('input, textarea, select, [contenteditable]'));
  };

  document.addEventListener('contextmenu', function (e) {
    if (!isFormField(e.target)) e.preventDefault();
  });

  ['copy', 'cut'].forEach(function (type) {
    document.addEventListener(type, function (e) {
      if (!isFormField(e.target)) e.preventDefault();
    });
  });

  document.addEventListener('dragstart', function (e) {
    if (e.target && (e.target.tagName === 'IMG' || e.target.tagName === 'A')) e.preventDefault();
  });
})();
