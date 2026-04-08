// ── Responsive layout ──
function layout() {
  const lg = window.innerWidth >= 1024;
  const md = window.innerWidth >= 768;

  document.getElementById('shape1').style.display = lg ? 'block' : 'none';
  document.getElementById('shape2').style.display = lg ? 'block' : 'none';
  document.getElementById('heroPhoto').style.display = md ? 'flex' : 'none';
  document.getElementById('heroGrid').style.gridTemplateColumns = md ? '1fr 1fr' : '1fr';
  document.getElementById('aboutGrid').style.gridTemplateColumns = lg ? '1fr 1fr' : '1fr';
  document.getElementById('eduExpGrid').style.gridTemplateColumns = lg ? '1fr 1fr' : '1fr';
  document.getElementById('skillsGrid').style.gridTemplateColumns = lg ? '2fr 1fr' : '1fr';
  document.getElementById('learnGoalsGrid').style.gridTemplateColumns = md ? '1fr 1fr' : '1fr';
  document.getElementById('blogGrid').style.gridTemplateColumns = lg ? '1fr 1fr 1fr' : (md ? '1fr 1fr' : '1fr');
  document.getElementById('projectsGrid').style.gridTemplateColumns = lg ? '1fr 1fr 1fr' : (md ? '1fr 1fr' : '1fr');
  document.getElementById('contactGrid').style.gridTemplateColumns = lg ? '1fr 1fr' : '1fr';
  document.getElementById('nameEmailRow').style.gridTemplateColumns = md ? '1fr 1fr' : '1fr';
}
layout();
window.addEventListener('resize', layout);

// ── Scroll progress bar ──
window.addEventListener('scroll', () => {
  const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
  document.getElementById('scroll-progress').style.width = pct + '%';
}, { passive: true });

// ── Typing effect ──
const roles = ['AI Enthusiast', 'Product Builder', 'CS Student', 'Coffee-Powered Coder', 'Hackathon Organizer'];
let rIdx = 0, cIdx = 0, del = false;
const typEl = document.getElementById('typing-text');
function type() {
  const cur = roles[rIdx];
  typEl.textContent = del ? cur.slice(0, cIdx - 1) : cur.slice(0, cIdx + 1);
  del ? cIdx-- : cIdx++;
  if (!del && cIdx === cur.length) setTimeout(() => del = true, 2000);
  else if (del && cIdx === 0) { del = false; rIdx = (rIdx + 1) % roles.length; }
  setTimeout(type, del ? 45 : 75);
}
type();

// ── Mobile menu ──
const menu = document.getElementById('mobileMenu');
document.getElementById('menuOpen').addEventListener('click', () => menu.classList.add('open'));
document.getElementById('menuClose').addEventListener('click', () => menu.classList.remove('open'));
function closeMobile() { menu.classList.remove('open'); }

// ── Accordion ──
function toggleAcc(hdr) {
  const card = hdr.closest('[data-acc]');
  const body = card.querySelector('.acc-body');
  const icon = card.querySelector('.acc-icon');
  const open = body.classList.contains('open');
  document.querySelectorAll('.acc-body').forEach(b => b.classList.remove('open'));
  document.querySelectorAll('.acc-icon').forEach(i => { i.classList.remove('fa-minus'); i.classList.add('fa-plus'); });
  if (!open) { body.classList.add('open'); icon.classList.remove('fa-plus'); icon.classList.add('fa-minus'); }
}

// ── Scroll reveal ──
const revObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revObs.unobserve(e.target); } });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => revObs.observe(el));

// ── Skill bars ──
let barsTriggered = false;
const barObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting && !barsTriggered) {
      barsTriggered = true;
      document.querySelectorAll('.skill-fill').forEach((b, i) => {
        setTimeout(() => { b.style.width = b.dataset.p + '%'; }, i * 80);
      });
      barObs.unobserve(e.target);
    }
  });
}, { threshold: 0.2 });
const skillEl = document.getElementById('skillsSection');
if (skillEl) barObs.observe(skillEl);

// ── Active nav highlight ──
const navObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
      const a = document.querySelector('.nav-link[href="#' + e.target.id + '"]');
      if (a) a.classList.add('active');
    }
  });
}, { threshold: 0.35 });
document.querySelectorAll('section[id]').forEach(s => navObs.observe(s));

// ── Contact form — Web3Forms ──
async function handleSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('submitBtn');
  const form = document.getElementById('contactForm');

  btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="font-size:11px;"></i> Sending...';
  btn.disabled = true;

  const data = new FormData(form);
  data.append('access_key', '83b2ca49-0912-4acc-a2ed-6833de4965c3');
  data.append('subject', 'New message from portfolio — ' + data.get('name'));
  data.append('from_name', 'Skylar Portfolio');

  try {
    const res = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: data });
    const json = await res.json();
    if (json.success) {
      btn.innerHTML = '<i class="fas fa-check" style="font-size:11px;"></i> Message Sent!';
      btn.style.background = '#00D9A3';
      form.reset();
      setTimeout(() => {
        btn.innerHTML = 'Send Message <i class="fas fa-arrow-right" style="font-size:11px;"></i>';
        btn.style.background = ''; btn.disabled = false;
      }, 4000);
    } else {
      throw new Error(json.message);
    }
  } catch (err) {
    btn.innerHTML = '<i class="fas fa-times" style="font-size:11px;"></i> Failed — try again';
    btn.style.background = '#ff4d4d';
    btn.disabled = false;
    setTimeout(() => {
      btn.innerHTML = 'Send Message <i class="fas fa-arrow-right" style="font-size:11px;"></i>';
      btn.style.background = '';
    }, 3500);
  }
}
