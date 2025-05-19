'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Sidebar() {
  const path = usePathname()

  const items = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/settings',  label: 'Settings'  },
  ]

  return (
    <nav className="w-48 h-screen bg-gray-50 border-r p-4">
      <ul className="space-y-2">
        {items.map(item => {
          const isActive = path === item.href
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block px-3 py-2 rounded ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
