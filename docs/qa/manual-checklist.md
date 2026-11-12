# Manual QA checklist

Run against the production build (`npm run build && npm run preview`, http://localhost:4173) in a fresh browser profile. Tick each box when the expected result holds. Tickers below exist in the live API; any other instrument works the same.

## 1. Setup

- [ ] **Fresh candidate** — new profile (or DevTools → Application → clear `localStorage`), no `VITE_CANDIDATE_ID`. Portfolio shows ARS 1,000,000.00 cash and the empty state; Activity shows "No orders yet".
- [ ] **Existing candidate** — set `VITE_CANDIDATE_ID=<key with holdings>` in `.env`, rebuild, preview. Portfolio shows that candidate's positions.
- [ ] `localStorage["cp.candidateId"]` exists after the first request and stays the same after reload. The ID never appears on screen.
- [ ] DevTools → Network: every request has `X-Enable-Bugs: off` and a non-empty `X-Candidate-Id`.
- [ ] Console has no errors or unhandled rejections during the whole run.

## 2. Viewports

### Desktop (1280 px)

- [ ] Header nav visible; no bottom nav. Instruments and positions show as tables.
- [ ] Activity table fits or scrolls inside its own box; the page does not scroll sideways.

### Tablet (768 px)

- [ ] Tables (not cards) at exactly 768 px; layout has no clipped columns.
- [ ] Modal is centered and fully visible.

### Mobile (375 px)

- [ ] No horizontal page scroll on `/instruments`, `/portfolio`, not-found and the open modal.
- [ ] Lists are cards; long names wrap or truncate without breaking the card.
- [ ] Bottom nav never covers the last card or a button (scroll to the end of each page).
- [ ] Modal opens as a bottom sheet; with the on-screen keyboard open, the submit button can still be reached by scrolling.
- [ ] Buttons and nav items are at least 44 px tall.

## 3. Themes

Repeat for **light** and **dark**:

- [ ] Page, header, bottom nav, cards, table rows, inputs and modal use the theme colors.
- [ ] Text, muted text, positive/negative values and badges are readable.
- [ ] Focus rings are visible on every focusable element.
- [ ] Disabled and submitting buttons look different from enabled ones.
- [ ] Skeleton shimmer is visible but calm. With OS "reduce motion" on, it does not animate.
- [ ] Native controls (number inputs, radios, scrollbars) match the theme.
- [ ] Modal backdrop and close button are readable.

Theme detection:

- [ ] Fresh profile follows the OS theme. Changing the OS theme updates the app live.
- [ ] After clicking the toggle, the choice survives reload and OS changes are ignored.
- [ ] Hard reload shows no flash of the other theme.

## 4. Languages

Repeat for **ES** and **EN**:

- [ ] Every screen, the modal, empty and error states are fully in one language.
- [ ] Numbers: ES `$ 1.234,56`, `+12,34%`; EN `ARS 1,234.56`, `+12.34%`.
- [ ] Counts use singular/plural correctly ("1 instrument" / "2 instruments").
- [ ] Order status shows label and raw code (e.g. "Ejecutada FILLED").
- [ ] Language buttons read `ES` / `EN` in both languages.

Language detection:

- [ ] Fresh profile with an English browser starts in EN; any other non-Spanish browser language starts in ES.
- [ ] After switching, the choice survives reload. `<html lang>` matches the UI language.
- [ ] Switching shows no flash of the other language.

## 5. Keyboard only

- [ ] First Tab shows "Skip to content"; Enter moves focus to the main area.
- [ ] Tab reaches header links, theme toggle and language switch, then the page content.
- [ ] Active nav item is announced as current page.
- [ ] Trade / Sell opens the modal; focus is inside and Tab stays inside.
- [ ] Side, type and fields are reachable; arrow keys change radio options.
- [ ] Submit with an empty quantity → focus moves to Quantity and the error is read.
- [ ] Valid submit → result announced; Close (or ESC) closes the modal and focus returns to the button that opened it.

## 6. Order scenarios

Use a fresh candidate unless noted.

- [ ] **MARKET BUY with cash** — Trade on any instrument, quantity 1, Buy → `FILLED`, order id shown; portfolio cash drops and the position appears; Activity shows the order on top.
- [ ] **MARKET BUY over cash** — quantity that costs more than the cash → the form shows "exceeds your available cash" and nothing is sent.
- [ ] **MARKET SELL whole position** — on the portfolio, Sell on a position → quantity preset to the full holding; submit → `FILLED`; the position disappears.
- [ ] **MARKET SELL over holding** — in a SELL ticket, type more than the held shares → quantity is capped at the holding; nothing above it can be sent.
- [ ] **LIMIT BUY within cash** — LIMIT, price below last price, quantity 1 → `PENDING` with the pending message.
- [ ] **LIMIT BUY above cash** — LIMIT with a price × quantity over the cash → cash error at the limit price (even if the same quantity at last price would fit).
- [ ] **LIMIT SELL** — on a held instrument, LIMIT with a price above last → `PENDING`.
- [ ] **Fractional quantity** — type or paste `1.5` / `1,5` in Quantity → no fraction is accepted or sent.
- [ ] **Amount flooring** — type an amount that is not a multiple of the last price → quantity is the whole number of shares below it; the amount you typed stays.
- [ ] **Last price 0** — open the ticket for an instrument with last price 0 (if the API has one) → unavailable message, submit disabled.
- [ ] **Double submit** — double-click Buy → a single order in Activity.
- [ ] **Server rejection** — DevTools → Network → block `/orders` response or use a request override returning `400 {"error":"Insufficient cash"}` → localized rejection, no order id.

## 7. Navigation

- [ ] `/` redirects to `/instruments`.
- [ ] Reload on `/portfolio` and `/instruments?q=al` keeps the page and the search.
- [ ] Open Portfolio, then Instruments, and type a search → the URL gets `?q=` but typing adds no history entries, so Back returns to Portfolio. Forward comes back with the same box text and results.
- [ ] Unknown path (e.g. `/nope`) shows "Page not found"; its link goes to instruments.

## 8. Failure injection

- [ ] **Offline** — DevTools → Network → Offline, reload a page → localized error with Retry; back online + Retry loads the data.
- [ ] **Timeout** — throttle to a custom profile with > 15 s latency → localized timeout error after ~15 s, Retry works.
- [ ] **500** — request override returning `500` for `/instruments` → one automatic retry (two requests), then a localized error with Retry.
- [ ] **Portfolio fails while the ticket is open** — block `/portfolio`, open a ticket → modal shows a retry for the portfolio instead of a broken form.
