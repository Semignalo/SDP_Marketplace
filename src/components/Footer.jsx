import { Link } from 'react-router-dom'
import { Instagram, Facebook, Mail } from 'lucide-react'
import { usePublicSettings } from '../hooks/useProducts'

export default function Footer() {
  const { data: settings } = usePublicSettings()
  const year = new Date().getFullYear()

  return (
    <footer className="bg-ink text-white mt-24">
      <div className="container-page py-16">
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-4">
            <span className="text-2xl font-bold tracking-[0.2em]">SDP</span>
            <p className="mt-4 text-sm text-white/60 max-w-xs leading-relaxed">
              {settings?.site_tagline || 'Marketplace multi-brand pilihan kamu.'}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <SocialLink href="#" label="Instagram"><Instagram size={16} /></SocialLink>
              <SocialLink href="#" label="Facebook"><Facebook size={16} /></SocialLink>
              <SocialLink href="#" label="Email"><Mail size={16} /></SocialLink>
            </div>
          </div>

          <FooterCol title="Belanja">
            <FooterLink to="/products">Semua Produk</FooterLink>
            <FooterLink to="/products?sort=newest">Baru Datang</FooterLink>
            <FooterLink to="/products?sort=price_asc">Harga Terendah</FooterLink>
            <FooterLink to="/vendors">Semua Brand</FooterLink>
          </FooterCol>

          <FooterCol title="Akun">
            <FooterLink to="/login">Masuk</FooterLink>
            <FooterLink to="/register">Daftar</FooterLink>
            <FooterLink to="/akun/pesanan">Pesanan Saya</FooterLink>
            <FooterLink to="/wishlist">Wishlist</FooterLink>
          </FooterCol>

          <FooterCol title="Bantuan">
            <FooterLink to="/bantuan">Pusat Bantuan</FooterLink>
            <FooterLink to="/kebijakan">Kebijakan Privasi</FooterLink>
            <FooterLink to="/syarat">Syarat & Ketentuan</FooterLink>
            <FooterLink to="/kontak">Kontak Kami</FooterLink>
          </FooterCol>
        </div>

        <div className="mt-14 pt-6 border-t border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between text-2xs uppercase tracking-widest text-white/40">
          <p>© {year} SDP Marketplace. All rights reserved.</p>
          <p>Made with care in Indonesia</p>
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
      aria-label={label}
      className="h-9 w-9 inline-flex items-center justify-center border border-white/20 rounded hover:bg-white hover:text-ink transition"
    >
      {children}
    </a>
  )
}
