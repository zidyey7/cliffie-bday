CLIFFORD BIRTHDAY WEBSITE — v3 (all-new artwork)

FILES
- index.html  : 5 pages (landing/countdown, gift picker, Messages, Flowers, Cake)
- style.css   : layout, fonts, polaroids, animations (mobile + desktop)
- script.js   : Manila-time countdown, lock popup, typing letter, candles, falling petals
- assets/fonts: Allura (script titles), La Belle Aurore (handwriting), Cormorant Garamond (serif), Montserrat (small caps labels) — bundled, no internet needed
- assets/img  : ALL artwork is self-generated (no cropped mockup): per-page backgrounds (desktop + mobile versions),
                rose-vine posts, envelope, bouquet (red roses only), cake, pen, letter paper, note paper,
                6 polaroid photos, gift-card thumbnails

RUN
Extract the ZIP, keep the folder together, open index.html in a browser.

LOCK / ENCRYPTION
Ang letter, mga larawan at notes ng gift pages ay naka-encrypt sa content.enc.js. Ang susi ay wala sa site;
lalabas lang ito kapag in-upload ang unlock-key.js (o sa Cloudflare Worker). Tingnan ang BASAHIN_MUNA.txt sa secret folder.
Ang mga photo sa first page ay naka-encrypt din (landing.enc.js); lalabas lang ito kung ang link ay may ?p=<landing key>.
Ang lock ay hindi na nakabase sa orasan ng device, kaya hindi ito mabubuksan kahit baguhin ang date.

CHANGE THE POLAROID CAPTIONS
Edit the <figcaption> text in index.html. To use your own real photos, replace assets/img/photo1.webp ... photo6.webp
(PAALALA: naka-encrypt na ang mga original photo; kung papalitan, ipa-rebuild muna ang encryption).

MUSIC
Ilagay ang song file sa assets/audio/ at pangalanan ng eksaktong  bestfriend.mp3
Tumutugtog sa buong website, naka-loop, at may music button sa kanang-ibaba (pause/play).
Sa browsers, magsisimula lang ang tugtog pagkatapos ng unang tap/click ng bisita.
