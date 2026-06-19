# Asset Manifest — Gym Quest

## Images
| File | Source comp | Purpose |
|---|---|---|
| `verdent-design/images/avatar-warrior.png` | `verdent-design/stage1/comp-2-pixel-quest.png` | Pixel art warrior character (generated, used as reference; SVG version used in app) |

## Icons (hand-authored SVG components)
| File | Source | Purpose |
|---|---|---|
| `src/icons/index.tsx` | hand-authored from comp-2 | All UI icons: Home, Scroll, Bag, Helmet, Trophy, Sword, Shield, Heart, Star, Book, Plus, ChevronRight, Menu, Note, Fire, Castle |

## Logo / Wordmark
| File | Background | Purpose |
|---|---|---|
| `public/favicon.svg` | #F5E6C8 parchment | Browser favicon — sword icon |
| Wordmark in TopBar | inline CSS/text | "GYM QUEST" pixel font header |

## Character Art
| File | Source | Purpose |
|---|---|---|
| `src/sections/AvatarSection.tsx` (PixelWarrior component) | hand-authored SVG pixel art | Inline pixel warrior character, no external image dependency |

## Intentionally Skipped
- Logo raster variants (wordmark is text-based, no raster needed)
- OG share image (not requested)
- Below-fold card thumbnails (no card grid in current scope)
