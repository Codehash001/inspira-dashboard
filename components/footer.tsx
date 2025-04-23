"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { FaTelegram, FaTwitter, FaGlobe, FaYoutube, FaInstagram, FaTiktok } from 'react-icons/fa';
import { RiTwitterXLine } from "react-icons/ri";
import { FaMedium } from "react-icons/fa6";

const footerLinks = {
  product: [
    { name: "Features", href: "https://inspirahub.net/#features" },
    { name: "Pricing", href: "https://inspirahub.net/#pricing" },
    { name: "How it Works", href: "https://inspirahub.net/#how-it-works" },
    { name: "FAQ", href: "https://inspirahub.net/#faq" },
  ],
  company: [
    { name: "About Us", href: "https://docs.inspirahub.net/documentation/what-is-inspira" },
    { name: "Whitepaper", href: "https://docs.inspirahub.net" },
    { name: "Contact $INSPI", href: "https://docs.inspirahub.net/documentation/contact-inspira" },
  ],
  legal: [
    { name: "Privacy Policy", href: "https://docs.inspirahub.net/documentation/privacy-policy/" },
    { name: "Terms of Service", href: "https://docs.inspirahub.net/documentation/terms-conditions/" },
    { name: "Cookie Policy", href: "https://docs.inspirahub.net/documentation/cookie-policy/" },
  ],
  social: [
    { name: 'Telegram', href: 'https://t.me/InspiraPortal', icon: <FaTelegram className="w-5 h-5" /> },
    { name: 'X/Twitter', href: 'https://x.com/InspiraHubs', icon: <RiTwitterXLine className="w-5 h-5" /> },
    { name: 'Website', href: 'https://inspirahub.net', icon: <FaGlobe className="w-5 h-5" /> },
    { name: 'YouTube', href: 'https://www.youtube.com/@InspiraHubs', icon: <FaYoutube className="w-5 h-5" /> },
    { name: 'Medium', href: 'https://medium.com/@inspiratoken', icon: <FaMedium className="w-5 h-5" /> },
    { name: 'Instagram', href: 'https://www.instagram.com/inspira.hubs', icon: <FaInstagram className="w-5 h-5" /> },
    { name: 'TikTok', href: 'https://www.tiktok.com/@inspira.hubs', icon: <FaTiktok className="w-5 h-5" /> }
  ]
}

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 text-left">
          {/* Brand Section */}
          <div className="md:col-span-4 lg:col-span-3 space-y-6">
            <div className="flex justify-start items-center gap-3">
              <Image 
                src="/logo.png" 
                alt="Inspira Logo" 
                width={48} 
                height={48}
                className="rounded-lg"
              />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">INSPIRA</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Inspira is pioneering EduFi, integrating AI & blockchain to transform education. Our platform empowers learners with AI-driven tools, crypto rewards, making knowledge more accessible, interactive, and rewarding.
            </p>
          </div>

          {/* Links Sections */}
          <div className="md:col-span-8 lg:col-span-9 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white uppercase tracking-wider border-b pb-2">Product</h3>
              <ul className="space-y-2">
                {footerLinks.product.map((item) => (
                  <li key={item.name}>
                    <Link 
                      href={item.href}
                      className="text-sm text-gray-600 dark:text-gray-300 hover:text-[#00FFD1] transition-colors duration-200"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white uppercase tracking-wider border-b pb-2">About $INSPI</h3>
              <ul className="space-y-2">
                {footerLinks.company.map((item) => (
                  <li key={item.name}>
                    <Link 
                      href={item.href}
                      className="text-sm text-gray-600 dark:text-gray-300 hover:text-[#00FFD1] transition-colors duration-200"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white uppercase tracking-wider border-b pb-2">Important Links</h3>
              <ul className="space-y-2">
                {footerLinks.legal.map((item) => (
                  <li key={item.name}>
                    <Link 
                      href={item.href}
                      className="text-sm text-gray-600 dark:text-gray-300 hover:text-[#00FFD1] transition-colors duration-200"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-300 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {new Date().getFullYear()} INSPIRA. All rights reserved.
            </p>

            {/* Social Links */}
            <div className="flex gap-6">
              {footerLinks.social.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-500 dark:text-gray-400 hover:text-[#00FFD1] transition-colors duration-200"
                  aria-label={item.name}
                >
                  {item.icon}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
