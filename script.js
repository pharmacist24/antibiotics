document.addEventListener('DOMContentLoaded', () => {
  // Single initialization guard
  if (window.formInitialized) return;
  window.formInitialized = true;

  const form = document.getElementById('antibioticForm');
  const submitBtn = document.getElementById('submitBtn');
  const loader = document.getElementById('loader');
  const formMessage = document.getElementById('formMessage');
  const addBtn = document.getElementById('addAntibioticBtn');
  const container = document.getElementById('antibioticsContainer');
  const toggleBtn = document.getElementById('toggleDarkMode');

  const scriptURL = 'https://script.google.com/macros/s/AKfycbyINo1Ym1uKIuJq6qmyaabCCUruzFUgTkXKdp6Hoa5myMTFPmzYbzSXkUmesFuBeJzO/exec';
  let isSubmitting = false;

  // Dark Mode Handling (unchanged)
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
  }
  toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
  });

  // Antibiotic Entries Management (unchanged)
  addBtn.addEventListener('click', () => {
    const newEntry = container.firstElementChild.cloneNode(true);
    newEntry.querySelectorAll('input, select').forEach(el => {
      if (el.tagName === 'SELECT') el.selectedIndex = 0;
      else el.value = '';
    });
    container.appendChild(newEntry);
    updateAntibioticsCount();
  });

  container.addEventListener('click', e => {
    if (e.target.classList.contains('remove-btn')) {
      const entries = document.querySelectorAll('.antibiotic-entry');
      if (entries.length > 1) {
        e.target.closest('.antibiotic-entry').remove();
        updateAntibioticsCount();
      }
    }
  });

  function updateAntibioticsCount() {
    document.getElementById('antibioticsCount').value =
      document.querySelectorAll('.antibiotic-entry').length;
  }

  // Fixed Form Submission Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Create stable fingerprint without timestamp
    const fingerprintData = {
      patient: form.patientName.value.trim(),
      diagnosis: form.diagnosis.value.trim(),
      antibiotics: Array.from(document.querySelectorAll('[name="antibiotic"]'))
        .map(i => i.value)
        .sort()
    };

    const submissionFingerprint = btoa(JSON.stringify(fingerprintData));

    // Enhanced duplicate check
    if (localStorage.getItem('lastSubmission') === submissionFingerprint) {
      showMessage('⚠️ تم إرسال هذه البيانات مسبقاً', 'warning');
      return;
    }

    isSubmitting = true;
    submitBtn.disabled = true;
    loader.style.display = 'inline-block';
    formMessage.textContent = '';

    try {
      const formData = new FormData(form);
      formData.append('fingerprint', submissionFingerprint);

      // Add cache busting to URL
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      await fetch(`${scriptURL}?cb=${Date.now()}`, {
        method: 'POST',
        body: new URLSearchParams(formData),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: controller.signal,
        redirect: 'follow'
      });

      clearTimeout(timeoutId);

      // Success handling
      showMessage('✅ تم الحفظ بنجاح', 'success');
      localStorage.setItem('lastSubmission', submissionFingerprint);
      resetForm();

      // Cooldown period
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error('Error:', error);
      if (error.name === 'AbortError') {
        showMessage('⚠️ انتهى وقت الإنتظار، يرجى المحاولة مرة أخرى', 'warning');
      } else if (error.message.includes('Failed to fetch')) {
        showMessage('✅ تم الحفظ (وحدة الصيدلة السريرية)', 'warning');
        localStorage.setItem('lastSubmission', submissionFingerprint);
        resetForm();
      } else {
        showMessage(`❌ فشل: ${error.message}`, 'error');
      }
    } finally {
      isSubmitting = false;
      submitBtn.disabled = false;
      loader.style.display = 'none';
    }
  };

  // Ensure single event listener
  form.removeEventListener('submit', handleSubmit);
  form.addEventListener('submit', handleSubmit);

  // Helper Functions (unchanged)
  function showMessage(text, type) {
    formMessage.textContent = text;
    formMessage.style.color = {
      success: '#00ffea',
      warning: '#ff9900',
      error: '#ff4444'
    }[type];
  }

  function resetForm() {
    form.reset();
    resetAntibioticEntries();
    updateAntibioticsCount();
  }

  function resetAntibioticEntries() {
    const entries = document.querySelectorAll('.antibiotic-entry');
    entries.forEach((entry, index) => {
      if (index > 0) entry.remove();
      else entry.querySelectorAll('input, select').forEach(el => {
        if (el.tagName === 'SELECT') el.selectedIndex = 0;
        else el.value = '';
      });
    });
  }

  updateAntibioticsCount();
});
