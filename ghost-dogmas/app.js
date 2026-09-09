/**
 * Ghost Dogmas: The Quiet Sanctuary - Interactive Engine
 * Author: Mario Botha
 * Handles: Pay-What-You-Want pricing calculator, Custom contribution input,
 * Video lightbox modal, Instant checkout modal, FAQ accordion, and scroll animations.
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. DUAL CONTRIBUTION INPUT SYNCHRONIZATION
  // ==========================================
  const heroInput = document.getElementById('heroCustomAmount');
  const mainInput = document.getElementById('customAmount');
  const totalDisplay = document.getElementById('totalDisplay');
  const modalTotalDisplay = document.getElementById('modalTotalDisplay');
  const modalZarDisplay = document.getElementById('modalZarDisplay');
  const paypalLinkBtn = document.getElementById('paypalLinkBtn');
  const paypalBtnAmount = document.getElementById('paypalBtnAmount');
  const eftZarTotal = document.getElementById('eftZarTotal');
  const deliveryEmail = document.getElementById('deliveryEmail');
  const eftRefDisplay = document.getElementById('eftRefDisplay');
  const eftSuccessRef = document.getElementById('eftSuccessRef');
  const paypalRefDisplay = document.getElementById('paypalRefDisplay');
  const paypalZarDisplay = document.getElementById('paypalZarDisplay');

  // Dynamic USD to ZAR rough conversion (~18.5)
  const USD_TO_ZAR_RATE = 18.5;

  function syncAmount(val) {
    const raw = parseFloat(val);
    const amount = isNaN(raw) ? 0 : Math.max(0, raw);
    const formattedUsd = `$${amount.toFixed(2)}`;
    const zarVal = Math.round(amount * USD_TO_ZAR_RATE);
    const estimatedZar = `R${zarVal} ZAR`;

    if (heroInput && heroInput.value !== val) heroInput.value = val;
    if (mainInput && mainInput.value !== val) mainInput.value = val;

    if (totalDisplay) totalDisplay.textContent = formattedUsd;
    if (modalTotalDisplay) modalTotalDisplay.textContent = `${formattedUsd} USD`;
    if (modalZarDisplay) modalZarDisplay.textContent = `≈ ${estimatedZar}`;
    if (paypalBtnAmount) paypalBtnAmount.textContent = formattedUsd;
    if (paypalZarDisplay) paypalZarDisplay.textContent = `≈ ${estimatedZar}`;
    if (eftZarTotal) eftZarTotal.textContent = estimatedZar;

    // Update dynamic PayPal.me URI
    if (paypalLinkBtn) {
      paypalLinkBtn.href = amount > 0 
        ? `https://www.paypal.me/mariobotha/${amount}` 
        : `https://www.paypal.me/mariobotha`;
    }
  }

  if (heroInput) heroInput.addEventListener('input', (e) => syncAmount(e.target.value));
  if (mainInput) mainInput.addEventListener('input', (e) => syncAmount(e.target.value));

  // Sync reference from email input
  if (deliveryEmail) {
    deliveryEmail.addEventListener('input', (e) => {
      const email = e.target.value.trim();
      const prefix = email ? email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') : 'YourName';
      const ref = `GD-${prefix}`;
      if (eftRefDisplay) eftRefDisplay.textContent = ref;
      if (eftSuccessRef) eftSuccessRef.textContent = ref;
      if (paypalRefDisplay) paypalRefDisplay.textContent = ref;
    });
  }

  // Initial Sync to empty/un-anchored placeholder
  syncAmount('');

  // ==========================================
  // PAYMENT METHOD TABS (PAYPAL VS SA EFT)
  // ==========================================
  const tabBtnPaypal = document.getElementById('tabBtnPaypal');
  const tabBtnEft = document.getElementById('tabBtnEft');
  const panelPaypal = document.getElementById('panelPaypal');
  const panelEft = document.getElementById('panelEft');

  if (tabBtnPaypal && tabBtnEft) {
    tabBtnPaypal.addEventListener('click', () => {
      tabBtnPaypal.classList.add('active');
      tabBtnEft.classList.remove('active');
      if (panelPaypal) panelPaypal.classList.remove('hidden');
      if (panelEft) panelEft.classList.add('hidden');
    });

    tabBtnEft.addEventListener('click', () => {
      tabBtnEft.classList.add('active');
      tabBtnPaypal.classList.remove('active');
      if (panelEft) panelEft.classList.remove('hidden');
      if (panelPaypal) panelPaypal.classList.add('hidden');
    });
  }

  // Copy Banking Details Button
  const copyBankBtn = document.getElementById('copyBankBtn');
  const copyBankText = document.getElementById('copyBankText');

  if (copyBankBtn) {
    copyBankBtn.addEventListener('click', () => {
      const ref = (eftRefDisplay && eftRefDisplay.textContent) || 'GD-YourName';
      const bankDetails = `Bank: Capitec Bank\nAccount Holder: M Botha\nAccount Number: 1393726257\nBranch Code: 470010\nAccount Type: Savings / Current\nReference: ${ref}`;
      
      if (navigator.clipboard) {
        navigator.clipboard.writeText(bankDetails).then(() => {
          if (copyBankText) copyBankText.textContent = 'Copied to Clipboard!';
          copyBankBtn.classList.add('border-sage', 'text-sage');
          setTimeout(() => {
            if (copyBankText) copyBankText.textContent = 'Copy Banking Details';
            copyBankBtn.classList.remove('border-sage', 'text-sage');
          }, 2500);
        });
      } else {
        alert('Bank details:\n' + bankDetails);
      }
    });
  }

  // EFT Confirmation Handler
  const confirmEftBtn = document.getElementById('confirmEftBtn');
  const eftSubmitWrap = document.getElementById('eftSubmitWrap');
  const eftSuccessNotice = document.getElementById('eftSuccessNotice');

  if (confirmEftBtn) {
    confirmEftBtn.addEventListener('click', () => {
      if (deliveryEmail && !deliveryEmail.value.trim()) {
        deliveryEmail.focus();
        deliveryEmail.classList.add('border-terracotta');
        alert('Please enter your delivery email address above so we know where to send your digital field guide.');
        return;
      }
      if (eftSubmitWrap) eftSubmitWrap.classList.add('hidden');
      if (eftSuccessNotice) eftSuccessNotice.classList.remove('hidden');
    });
  }

  // ==========================================
  // 2. CHECKOUT MODAL & ORDER WORKFLOW
  // ==========================================
  const checkoutBtn = document.getElementById('checkoutBtn');
  const heroCheckoutBtn = document.getElementById('heroCheckoutBtn');
  const checkoutModal = document.getElementById('checkoutModal');
  const checkoutFormStep = document.getElementById('checkoutFormStep');
  let activeModal = null;

  function openCheckoutModal() {
    if (checkoutModal) {
      checkoutModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      const currentVal = (heroInput && heroInput.value) || (mainInput && mainInput.value) || '';
      syncAmount(currentVal);
      activeModal = checkoutModal;
      trapFocus(checkoutModal);
    }
  }

  function closeCheckoutModal() {
    if (checkoutModal) {
      checkoutModal.classList.add('hidden');
      document.body.style.overflow = '';
      if (activeModal === checkoutModal) activeModal = null;
      if (eftSubmitWrap) eftSubmitWrap.classList.remove('hidden');
      if (eftSuccessNotice) eftSuccessNotice.classList.add('hidden');
    }
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', openCheckoutModal);
  }
  if (heroCheckoutBtn) {
    heroCheckoutBtn.addEventListener('click', openCheckoutModal);
  }

  // Dynamic PayPal Click Intercept
  if (paypalLinkBtn) {
    paypalLinkBtn.addEventListener('click', (e) => {
      if (deliveryEmail && !deliveryEmail.value.trim()) {
        deliveryEmail.focus();
        deliveryEmail.classList.add('border-terracotta');
      }
      const raw = parseFloat((heroInput && heroInput.value) || (mainInput && mainInput.value) || 0);
      const amount = isNaN(raw) ? 0 : Math.max(0, raw);
      paypalLinkBtn.href = amount > 0 
        ? `https://www.paypal.me/mariobotha/${amount}` 
        : `https://www.paypal.me/mariobotha`;
    });
  }

  // ==========================================
  // 3. VIDEO LIGHTBOX MODAL (EMBEDDED PLAYER)
  // ==========================================
  const heroVideoTrigger = document.getElementById('heroVideoTrigger');
  const videoModal = document.getElementById('videoModal');
  const videoPlayerFrame = document.getElementById('videoPlayerFrame');

  function openVideoModal() {
    if (videoModal) {
      videoModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      activeModal = videoModal;
      if (videoPlayerFrame && videoPlayerFrame.dataset.src) {
        videoPlayerFrame.src = videoPlayerFrame.dataset.src;
      }
      trapFocus(videoModal);
    }
  }

  function closeVideoModal() {
    if (videoModal) {
      videoModal.classList.add('hidden');
      document.body.style.overflow = '';
      if (activeModal === videoModal) activeModal = null;
      if (videoPlayerFrame) {
        videoPlayerFrame.src = '';
      }
    }
  }

  if (heroVideoTrigger) {
    heroVideoTrigger.addEventListener('click', openVideoModal);
    heroVideoTrigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openVideoModal();
      }
    });
  }

  // ==========================================
  // 4. LEGAL NOTICE MODAL
  // ==========================================
  const legalModal = document.getElementById('legalModal');
  const legalModalTitle = document.getElementById('legalModalTitle');

  document.querySelectorAll('.legal-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const type = link.getAttribute('data-type');
      if (legalModalTitle) {
        legalModalTitle.textContent = type === 'terms' ? 'Terms of Service' : 'Privacy Policy';
      }
      if (legalModal) {
        legalModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        activeModal = legalModal;
        trapFocus(legalModal);
      }
    });
  });

  function closeLegalModal() {
    if (legalModal) {
      legalModal.classList.add('hidden');
      document.body.style.overflow = '';
      if (activeModal === legalModal) activeModal = null;
    }
  }

  // Universal close modal handlers
  function closeAllModals() {
    closeCheckoutModal();
    closeVideoModal();
    closeLegalModal();
  }

  document.querySelectorAll('.close-modal').forEach((btn) => {
    btn.addEventListener('click', closeAllModals);
  });

  [checkoutModal, videoModal, legalModal].forEach((modal) => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeAllModals();
        }
      });
    }
  });

  // Keyboard accessibility: Escape to close, Tab to trap focus
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
    if (e.key === 'Tab' && activeModal) {
      const focusable = activeModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  function trapFocus(modal) {
    setTimeout(() => {
      const firstFocusable = modal.querySelector('button, [href], input');
      if (firstFocusable) firstFocusable.focus();
    }, 50);
  }

  // ==========================================
  // MOBILE NAVIGATION DRAWER TOGGLE
  // ==========================================
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileNavMenu = document.getElementById('mobileNavMenu');

  if (mobileMenuToggle && mobileNavMenu) {
    mobileMenuToggle.addEventListener('click', () => {
      const isOpen = mobileNavMenu.classList.toggle('open');
      mobileMenuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    document.querySelectorAll('.mobile-nav-link').forEach((link) => {
      link.addEventListener('click', () => {
        mobileNavMenu.classList.remove('open');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ==========================================
  // 5. MINIMAL FAQ ACCORDION (CSS GRID RECIPE)
  // ==========================================
  const faqItems = document.querySelectorAll('.faq-clean-item');

  faqItems.forEach((item) => {
    const trigger = item.querySelector('.faq-clean-trigger');

    if (trigger) {
      trigger.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        // Close all other items
        faqItems.forEach((otherItem) => {
          if (otherItem !== item) {
            otherItem.classList.remove('open');
            const otherTrigger = otherItem.querySelector('.faq-clean-trigger');
            if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
          }
        });

        // Toggle current item
        if (isOpen) {
          item.classList.remove('open');
          trigger.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    }
  });

  // ==========================================
  // 6. INTERACTIVE 3D BOOK TILT (EMIL KOWALSKI CRAFT)
  // ==========================================
  const bookScene = document.querySelector('.book-3d-scene');
  const bookContainer = document.querySelector('.book-3d-container');

  if (bookScene && bookContainer && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    bookScene.addEventListener('mousemove', (e) => {
      const rect = bookScene.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      // Fluid restrained tilt (-18 to 18 deg max)
      const rotY = (x / (rect.width / 2)) * 14 - 10;
      const rotX = -(y / (rect.height / 2)) * 10 + 4;
      
      bookContainer.style.transform = `rotateY(${rotY.toFixed(1)}deg) rotateX(${rotX.toFixed(1)}deg) translateY(-6px)`;
    });

    bookScene.addEventListener('mouseleave', () => {
      bookContainer.style.transform = 'rotateY(-16deg) rotateX(5deg) translateY(0px)';
    });
  }

  // ==========================================
  // 7. SCROLL REVEAL ANIMATIONS (WITH STAGGER)
  // ==========================================
  const revealElements = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry, idx) => {
          if (entry.isIntersecting) {
            // Subtle stagger effect if multiple trigger simultaneously
            setTimeout(() => {
              entry.target.classList.add('active');
            }, (idx % 3) * 40);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -25px 0px',
      }
    );

    revealElements.forEach((el) => revealObserver.observe(el));
  } else {
    revealElements.forEach((el) => el.classList.add('active'));
  }

  // Header Elevation on Scroll
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 30) {
        navbar.classList.add('shadow-sm', 'bg-paper/95');
      } else {
        navbar.classList.remove('shadow-sm', 'bg-paper/95');
      }
    });
  }
});
