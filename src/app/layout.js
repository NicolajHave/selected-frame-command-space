import { Analytics } from '@vercel/analytics/next'
import './globals.css'
export const metadata = { title: 'Selected Frame · Command Space', description: 'Brand Spaces Central Hub' }
export default function RootLayout({ children }) {
  return (<html lang="en"><body>{children}<Analytics /></body></html>)
}
