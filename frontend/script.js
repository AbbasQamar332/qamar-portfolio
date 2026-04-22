// Mobile Navbar Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
}));

// Navbar background on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(10, 10, 10, 0.98)';
    } else {
        navbar.style.background = 'rgba(10, 10, 10, 0.95)';
    }
});

// Typing Effect
const typingText = document.querySelector('.typing-text');
const titles = [
    'Digital Marketing',
    'Generative AI', 
    'eCommerce Specialist'
];

let titleIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeWriter() {
    const currentTitle = titles[titleIndex];
    
    if (isDeleting) {
        typingText.textContent = currentTitle.substring(0, charIndex - 1);
        charIndex--;
    } else {
        typingText.textContent = currentTitle.substring(0, charIndex + 1);
        charIndex++;
    }
    
    let typeSpeed = isDeleting ? 50 : 100;
    
    if (!isDeleting && charIndex === currentTitle.length) {
        typeSpeed = 2000;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        titleIndex = (titleIndex + 1) % titles.length;
        typeSpeed = 500;
    }
    
    setTimeout(typeWriter, typeSpeed);
}

if (typingText) {
    typeWriter();
}

// Smooth Scroll for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Scroll Animations with Intersection Observer
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe all fade-in elements
document.querySelectorAll('.skill-card, .timeline-item, .project-card, .education-card, .about-content').forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
});

// Contact Form
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn = contactForm.querySelector('button');
        const originalText = btn.textContent;
        btn.textContent = 'Sending...';
        btn.disabled = true;

        const formData = {
            name: contactForm.querySelector('input[type="text"]').value,
            email: contactForm.querySelector('input[type="email"]').value,
            message: contactForm.querySelector('textarea').value
        };

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                alert('Thank you for your message! I\'ll get back to you soon.');
                this.reset();
            } else {
                alert('Failed to send message. Please try again.');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('An error occurred. Please try again.');
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
}

// Navbar shrink on scroll for mobile
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.innerWidth <= 768 && window.scrollY > 100) {
        navbar.style.padding = '0.5rem 0';
    } else {
        navbar.style.padding = '1rem 0';
    }
});

// Parallax effect for hero (subtle)
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// --- Dynamic Content Fetching ---
document.addEventListener('DOMContentLoaded', () => {
    fetchAbout();
    fetchSkills();
    fetchProjects();
});

async function fetchAbout() {
    try {
        const res = await fetch('/api/about');
        const data = await res.json();
        const container = document.getElementById('dynamic-about');
        if (container && data && data.content) {
            container.innerHTML = `<p>${data.content}</p>`;
        }
    } catch (err) {
        console.error('Error fetching about section:', err);
    }
}

async function fetchSkills() {
    try {
        const res = await fetch('/api/skills');
        const skills = await res.json();
        const container = document.getElementById('dynamic-skills');
        if (container) {
            if (skills.length > 0) {
                container.innerHTML = skills.map(skill => `
                    <div class="skill-card fade-in visible">
                        <i class="${skill.icon || 'fas fa-star'}"></i>
                        <h3>${skill.title}</h3>
                        <p>${skill.description}</p>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p>No skills added yet.</p>';
            }
        }
    } catch (err) {
        console.error('Error fetching skills:', err);
    }
}

async function fetchProjects() {
    try {
        const res = await fetch('/api/projects');
        const projects = await res.json();
        const container = document.getElementById('dynamic-portfolio');
        if (container) {
            if (projects.length > 0) {
                container.innerHTML = projects.map(proj => `
                    <div class="project-card fade-in visible">
                        <div class="project-image" style="background-image: url('${proj.image_url || ''}'); background-size: cover; background-position: center;"></div>
                        <div class="project-content">
                            <h3>${proj.title}</h3>
                            <p>${proj.description}</p>
                            ${proj.link ? `<a href="${proj.link}" target="_blank" class="btn btn-secondary" style="margin-top: 10px; display: inline-block; padding: 5px 10px; font-size: 0.9rem;">View Project</a>` : ''}
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p>No projects added yet.</p>';
            }
        }
    } catch (err) {
        console.error('Error fetching projects:', err);
    }
}