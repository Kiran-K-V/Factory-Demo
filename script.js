(() => {
  const doc = document;
  const body = doc.body;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const header = doc.querySelector(".site-header");
  const navToggle = doc.querySelector(".nav-toggle");
  const mainNav = doc.querySelector("#main-nav");
  const navLinks = doc.querySelectorAll('.main-nav a[href^="#"]');
  const revealItems = doc.querySelectorAll(".reveal");
  const parallaxItems = doc.querySelectorAll("[data-parallax]");
  const tiltItems = doc.querySelectorAll("[data-tilt]");
  const ctaForm = doc.querySelector(".cta-form");
  const themeToggle = doc.querySelector(".theme-toggle");

  if (themeToggle) {
    const themeLabel = themeToggle.querySelector(".theme-toggle-label");
    themeToggle.addEventListener("click", () => {
      const isDark = themeToggle.getAttribute("aria-checked") === "true";
      themeToggle.setAttribute("aria-checked", String(!isDark));
      if (themeLabel) themeLabel.textContent = isDark ? "Dark" : "Light";
      doc.documentElement.setAttribute("data-theme-pending", "true");
    });
  }

  const setHeaderState = () => {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 8);
  };

  setHeaderState();
  window.addEventListener("scroll", setHeaderState, { passive: true });

  if (navToggle && mainNav) {
    navToggle.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      body.classList.toggle("menu-open", isOpen);
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
        body.classList.remove("menu-open");
      });
    });
  }

  doc.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || href === "#") return;
      const target = doc.querySelector(href);
      if (!target) return;

      event.preventDefault();
      if (href === "#top") {
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
        return;
      }
      target.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  });

  if (revealItems.length) {
    if ("IntersectionObserver" in window && !reduceMotion) {
      const observer = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("in-view");
            obs.unobserve(entry.target);
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -5% 0px" }
      );
      revealItems.forEach((item) => observer.observe(item));
    } else {
      revealItems.forEach((item) => item.classList.add("in-view"));
    }
  }

  if (parallaxItems.length && !reduceMotion) {
    let rafId = null;
    let pointerX = 0;
    let pointerY = 0;

    const renderParallax = () => {
      parallaxItems.forEach((item) => {
        const speed = Number(item.getAttribute("data-speed")) || 0.03;
        const moveX = pointerX * speed;
        const moveY = pointerY * speed;
        item.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
      });
      rafId = null;
    };

    const onPointerMove = (event) => {
      pointerX = event.clientX - window.innerWidth / 2;
      pointerY = event.clientY - window.innerHeight / 2;
      if (!rafId) rafId = window.requestAnimationFrame(renderParallax);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
  }

  const canTilt = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (tiltItems.length && canTilt && !reduceMotion) {
    tiltItems.forEach((card) => {
      const tiltAmount = 8;

      const onMove = (event) => {
        const rect = card.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        const rotateY = (px - 0.5) * tiltAmount;
        const rotateX = (0.5 - py) * tiltAmount;
        card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      };

      const onLeave = () => {
        card.style.transform = "";
      };

      card.addEventListener("pointermove", onMove);
      card.addEventListener("pointerleave", onLeave);
    });
  }

  // Testimonial slider
  const sliderEl = doc.querySelector('.testimonial-slider');
  if (sliderEl) {
    const track = sliderEl.querySelector('.testimonial-track');
    const slides = Array.from(track.querySelectorAll('.quote'));
    const dots = Array.from(sliderEl.querySelectorAll('.dot'));
    const prevBtn = sliderEl.querySelector('.testimonial-prev');
    const nextBtn = sliderEl.querySelector('.testimonial-next');
    const total = slides.length;
    let current = 0;
    let autoPlayId = null;
    let touchStartX = 0;
    let touchDeltaX = 0;

    const goTo = (index) => {
      current = (index + total) % total;
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, i) => {
        const active = i === current;
        d.classList.toggle('active', active);
        d.setAttribute('aria-selected', String(active));
      });
    };

    const startAutoPlay = () => {
      if (reduceMotion) return;
      autoPlayId = window.setInterval(() => goTo(current + 1), 5000);
    };

    const stopAutoPlay = () => {
      window.clearInterval(autoPlayId);
    };

    prevBtn.addEventListener('click', () => { stopAutoPlay(); goTo(current - 1); startAutoPlay(); });
    nextBtn.addEventListener('click', () => { stopAutoPlay(); goTo(current + 1); startAutoPlay(); });
    dots.forEach((dot) => {
      dot.addEventListener('click', () => { stopAutoPlay(); goTo(Number(dot.dataset.index)); startAutoPlay(); });
    });

    // Touch / swipe support
    track.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchDeltaX = 0;
      stopAutoPlay();
    }, { passive: true });
    track.addEventListener('touchmove', (e) => {
      touchDeltaX = e.touches[0].clientX - touchStartX;
    }, { passive: true });
    track.addEventListener('touchend', () => {
      if (Math.abs(touchDeltaX) > 40) {
        goTo(touchDeltaX < 0 ? current + 1 : current - 1);
      }
      startAutoPlay();
    });

    // Keyboard navigation
    sliderEl.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { stopAutoPlay(); goTo(current - 1); startAutoPlay(); }
      if (e.key === 'ArrowRight') { stopAutoPlay(); goTo(current + 1); startAutoPlay(); }
    });

    // Pause on hover/focus
    sliderEl.addEventListener('mouseenter', stopAutoPlay);
    sliderEl.addEventListener('mouseleave', startAutoPlay);
    sliderEl.addEventListener('focusin', stopAutoPlay);
    sliderEl.addEventListener('focusout', startAutoPlay);

    goTo(0);
    startAutoPlay();
  }

  if (ctaForm) {
    ctaForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const button = ctaForm.querySelector("button");
      if (!button) return;
      const originalText = button.textContent;
      button.textContent = "You're on the list";
      button.setAttribute("disabled", "true");
      window.setTimeout(() => {
        button.textContent = originalText || "Start free trial";
        button.removeAttribute("disabled");
      }, 1600);
    });
  }
})();
