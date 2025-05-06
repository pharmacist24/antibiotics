document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('antibioticForm');
  const submitBtn = document.getElementById('submitBtn');
  const loader = document.getElementById('loader');
  const formMessage = document.getElementById('formMessage');
  const addBtn = document.getElementById('addAntibioticBtn');
  const container = document.getElementById('antibioticsContainer');
  
  // 🔴 REPLACE WITH YOUR ACTUAL DEPLOYMENT URL
  const scriptURL = 'https://script.google.com/macros/s/AKfycbyINo1Ym1uKIuJq6qmyaabCCUruzFUgTkXKdp6Hoa5myMTFPmzYbzSXkUmesFuBeJzO/exec';

  // Add antibiotic entry
  addBtn.addEventListener('click', () => {
    const newEntry = container.firstElementChild.cloneNode(true);
    newEntry.querySelectorAll('input, select').forEach(el => {
      if (el.tagName === 'SELECT') el.selectedIndex = 0;
      else el.value = '';
    });
    container.appendChild(newEntry);
    updateAntibioticsCount();
  });

  // Remove entry
  container.addEventListener('click', e => {
    if (e.target.classList.contains('remove-btn')) {
      const entries = document.querySelectorAll('.antibiotic-entry');
      if (entries.length > 1) {
        e.target.closest('.antibiotic-entry').remove();
        updateAntibioticsCount();
      }
    }
  });

  // Update antibiotics count
  function updateAntibioticsCount() {
    document.getElementById('antibioticsCount').value = 
      document.querySelectorAll('.antibiotic-entry').length;
  }

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    loader.style.display = 'inline-block';
    formMessage.textContent = '';

    try {
      // Validate required fields first
      if (!form.checkValidity()) {
        form.reportValidity();
        throw new Error('الرجاء ملء جميع الحقول المطلوبة');
      }

      const formData = new FormData(form);
      const params = new URLSearchParams(formData);

      const response = await fetch(scriptURL, {
        method: 'POST',
        body: params,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        mode: 'no-cors', // 🔴 Important change here
        redirect: 'follow'
      });

      // Handle redirect for no-cors mode
      if (response.redirected) {
        window.location.href = response.url;
        return;
      }

      // Handle success
      formMessage.textContent = '✅ تم حفظ البيانات بنجاح';
      formMessage.style.color = '#00ffea';
      form.reset();
      document.querySelectorAll('.antibiotic-entry:not(:first-child)').forEach(el => el.remove());
      updateAntibioticsCount();

    } catch (error) {
      console.error('Error:', error);
      formMessage.textContent = `❌ فشل: ${error.message}`;
      formMessage.style.color = '#ff4444';
    } finally {
      submitBtn.disabled = false;
      loader.style.display = 'none';
    }
  });

  // Initial count
  updateAntibioticsCount();
});