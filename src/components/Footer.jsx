import { Link } from 'react-router-dom'
import { Instagram, Facebook, Mail } from 'lucide-react'
import { usePublicSettings } from '../hooks/useProducts'

export default function Footer() {
  const { data: settings } = usePublicSettings()
  const year = new Date().getFullYear()

  const emailCs = settings?.email_cs
  const instagram = settings?.social_instagram
  const facebook = settings?.social_facebook

  return (
    <footer className="bg-ink text-white mt-24">
      <div className="container-page py-16">
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-4">
            <span className="text-2xl font-bold tracking-[0.2em]">
              {settings?.site_name || 'SDP'}
            </span>
            <p className="mt-4 text-sm text-white/60 max-w-xs leading-relaxed">
              {settings?.site_tagline || 'Brands you trust. All in one place.'}
            </p>
            <div className="mt-6 flex items-center gap-3">
              {instagram && (
                <SocialLink href={instagram} label="Instagram">
                  <Instagram size={16} />
                </SocialLink>
              )}
              {facebook && (
                <SocialLink href={facebook} label="Facebook">
                  <Facebook size={16} />
                </SocialLink>
              )}
              {emailCs && (
                <SocialLink href={`mailto:${emailCs}`} label="Email">
                  <Mail size={16} />
                </SocialLink>
              )}
            </div>
          </div>

          <FooterCol title="Shop">
            <FooterLink to="/products">All Products</FooterLink>
            <FooterLink to="/products?sort=newest">New In</FooterLink>
            <FooterLink to="/products?sort=price_asc">Lowest Price</FooterLink>
            <FooterLink to="/vendors">All Brands</FooterLink>
          </FooterCol>

          <FooterCol title="Account">
            <FooterLink to="/login">Sign in</FooterLink>
            <FooterLink to="/register">Sign up</FooterLink>
            <FooterLink to="/akun/pesanan">My Orders</FooterLink>
            <FooterLink to="/akun/wishlist">Wishlist</FooterLink>
          </FooterCol>

          <FooterCol title="Help">
            <FooterLink to="/bantuan">Help Center</FooterLink>
            <FooterLink to="/kebijakan">Privacy Policy</FooterLink>
            <FooterLink to="/syarat">Terms of Service</FooterLink>
            <FooterLink to="/kontak">Talk to Us</FooterLink>
          </FooterCol>
        </div>

        <div className="mt-14 pt-6 border-t border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between text-2xs uppercase tracking-widest text-white/40">
          <p>© {year} {settings?.site_name || 'SDP Marketplace'}. All rights reserved.</p>
          <p>Built with care, in Indonesia.</p>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, children }) {
  return (
    <div className="md:col-span-2">
      <h4 className="text-2xs font-bold uppercase tracking-widest text-white/40 mb-4">{title}</h4>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  )
}

function FooterLink({ to, children }) {
  return (
    <li>
      <Link to={to} className="text-sm text-white/80 hover:text-white transition">
        {children}
      </Link>
    </li>
  )
}

function SocialLink({ href, label, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="h-9 w-9 inline-flex items-center justify-center border border-white/20 rounded hover:bg-white hover:text-ink transition"
    >
      {children}
    </a>
  )
}
