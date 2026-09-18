function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const status = document.getElementById('form-status');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = '';
    status.className = '';

    if (form.botcheck.checked) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
      const formData = new FormData(form);
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      });
      const result = await response.json();

      if (response.status === 200 && result.success) {
        status.textContent = 'Danke für deine Nachricht! Wir melden uns bald bei dir.';
        status.className = 'form-status form-status--success';
        form.reset();
      } else {
        throw new Error(result.message || 'Unbekannter Fehler');
      }
    } catch (err) {
      status.textContent = 'Etwas ist schiefgelaufen. Bitte versuche es später erneut oder schreibe uns direkt per Email.';
      status.className = 'form-status form-status--error';
    } finally {
      submitBtn.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', initContactForm);
