import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import './index.css'
import App from './App'

/**
 * `reducedMotion="user"` is what actually honours the operating system's
 * reduced-motion setting.
 *
 * index.css already zeroes out CSS animations and transitions under that media
 * query, and that looked like the job was done — but Framer Motion animates by
 * writing inline styles frame by frame, which no CSS rule can reach. With the
 * preference switched on, cards were measured still fading and scaling from 0.9
 * across four frames. Since fourteen components animate through Framer, the
 * setting was close to decorative until this wrapper.
 *
 * "user" rather than "always": it follows the preference instead of overriding
 * it, and leaves opacity transitions alone so things still appear rather than
 * snapping in with no indication anything changed.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </StrictMode>,
)
