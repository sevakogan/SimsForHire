# SimsForHire — One-Pager Funnel Redesign

## Core Concept
Strip the site down to a single-purpose conversion funnel. 4 beats: Hero → Rigs → Events → Form. Dark, high-energy, street-culture meets race-culture. The video sells, the form converts.

## Structure
1. **Hero** — Full-screen video bg, giant "WE BRING THE RACE TO YOU", stats row at bottom, single "Book Now" CTA
2. **The Rigs** — Two photo cards side-by-side, GSAP slide-in from sides, minimal text overlay
3. **Event Strip** — Horizontal auto-scrolling photo gallery, event names overlaid, full-bleed
4. **Quote** — One testimonial, centered, brief
5. **Book Your Event** — Dark bg, centered form, contact details below
6. **Footer** — One line: copyright, legal links, social icons

## Deleted
- Marquee, Stats section (moved to hero), Services, About, Testimonials (one kept)

## Visual Language
- Black dominant (#0A0A0A), red accent (#E10600), white text
- Bebas Neue display + Inter body
- GSAP ScrollTrigger for reveals, horizontal scroll on event strip
- Noise grain overlay for film texture
- No nav links beyond "Book Now" — the page is the funnel

## Navbar
- Transparent → blurred black on scroll
- Logo left, "Book Now" right
- No hamburger, no nav links

## Tech
- Astro 5 + Tailwind CSS v4 + GSAP ScrollTrigger
- YouTube embed for hero video
- Contact form POSTs to /api/contact (existing)
- SMS consent checkbox (existing, A2P compliant)
