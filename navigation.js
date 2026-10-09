/* ===========================================================
   KLU FRESH — CUSTOMER NAVIGATION & SMOOTH SCROLLING
   -----------------------------------------------------------
   Handles customer homepage navbar links, smooth section
   scrolling, active section highlighting, and top anchor routing.
=========================================================== */

function initNavigation() {
  // Smooth scroll handler for all internal anchor links
  const navLinks = document.querySelectorAll('a[href^="#"], .nav-link, .nav-scroll-btn');

  navLinks.forEach(link => {
    link.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (!href || href === "#") return;

      if (href.startsWith("#")) {
        const targetId = href.substring(1);
        const targetEl = document.getElementById(targetId);

        if (targetEl) {
          e.preventDefault();

          // Highlight active link
          document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
          if (this.classList.contains("nav-link")) {
            this.classList.add("active");
          }

          // Smooth scroll to target section with header offset
          const headerHeight = document.querySelector(".site-header")?.offsetHeight || 80;
          const targetPos = targetEl.getBoundingClientRect().top + window.pageYOffset - headerHeight + 10;

          window.scrollTo({
            top: Math.max(0, targetPos),
            behavior: "smooth"
          });
        }
      }
    });
  });

  // Logo click -> scroll to top
  const logo = document.getElementById("logoHome");
  if (logo) {
    logo.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // ScrollSpy to update active nav link as user scrolls
  window.addEventListener("scroll", () => {
    const sections = ["home", "categories", "products", "about", "contact"];
    const scrollPos = window.scrollY + 140;

    for (const id of sections) {
      const el = document.getElementById(id);
      if (el) {
        const top = el.offsetTop;
        const height = el.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          document.querySelectorAll(".nav-link").forEach(link => {
            link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
          });
          break;
        }
      }
    }
  }, { passive: true });
}

document.addEventListener("DOMContentLoaded", initNavigation);
