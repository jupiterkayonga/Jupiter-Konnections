# Jupiter Konnections

An Astro **7.3.8** static revamp, prepared for **Cloudflare Pages** in this folder. No Cloudflare adapter, server runtime, checkout, or remote image dependency is required.

## Run locally

Use Node **22.12+** (the project pins Node 24.11.0).

```sh
npm ci
npm run dev
```

Open the Local URL printed by Astro, normally `http://localhost:4321`.

```sh
npm run check
npm run build
npm run verify
npm run preview
```

If your environment blocks Astro's preference-directory writes, prefix Astro commands with `ASTRO_TELEMETRY_DISABLED=1`.

## Cloudflare Pages

Connect this folder's Git repository to a Pages project and use:

| Setting | Value |
| --- | --- |
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | Repository root |
| Environment variable | `NODE_VERSION=24.11.0` |

The existing `public/_headers`, `public/_redirects`, and generated `404.html` are copied into `dist`. A top-level 404 prevents Pages from treating this as a single-page application. Attach `jupiterkonnections.com` as a custom domain when ready. For a preview on another domain, canonical links intentionally continue to point to the production domain.

For direct upload, build locally and upload **the contents of `dist`** to Pages. This project has not been deployed and does not configure DNS or a Cloudflare account.

Official references: [Astro 7](https://astro.build/blog/astro-7/) · [Cloudflare Pages Astro guide](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/).

## Structure and editing

- `src/pages/index.astro`: editorial homepage.
- `src/pages/[...path].astro`: content and supporting-page layouts; preserves retained legacy URLs and automatically generates new content URLs.
- `src/content/entries/*.md`: journal, guides, and photography projects. Real Astro content collections validate frontmatter at build time.
- `src/data/catalog.ts`: destinations, navigation, and contact email.
- `src/data/about.html`: restored About text.
- `src/styles/global.css`: responsive design, warm neutrals, restrained rust accents, and system fonts. No external font requests.
- `public/`: favicon and Pages files.
- `docs/migration.md`: retained/excluded routes and recovery status.
- `docs/content-plan.md`: India journey timeline and future content TODOs.

Add a story by creating a Markdown file under `src/content/entries`:

```yaml
---
title: "A new journey"
slug: "a-new-journey"
description: "A short introduction."
destination: "india"
kind: "story"
status: "published"
date: "2026-10-11"
featured: false
---
```

Write the article below the frontmatter. `kind` is `story`, `guide`, or `project`. `status` is `published` for new finished work, `recovered` for restored archive text, or `pending` when the text is missing. Pending entries get a restoration notice, `noindex`, and are excluded from the XML sitemap and RSS. New entry URLs are generated from `slug`; destination collections use the `destination` field.

The homepage's featured selection is set explicitly in `index.astro`. Journal search and destination filters work locally in the browser without a service; all entries remain available when JavaScript is disabled.

## Photographs

The Iceland road-trip cover is connected to its article and cards. Its original upload is preserved at `src/assets/images/iceland-roadtrip.jpg` (moved from `public/images` so Astro can optimize it).

For future photographs, put original uploads in `image-library/originals/`. Selected working images are imported into `src/assets/images/`; add these fields to the article:

```yaml
image: "/src/assets/images/my-photograph.jpg"
imageAlt: "Describe the actual subject and setting."
```

Astro generates responsive WebP versions at build time. Article covers use widths of 480, 768, 1200, 1600, and 2000 pixels and preserve the full composition; cards use smaller variants and their existing editorial crop. The main article image loads eagerly with high priority; cards load lazily. The original file is retained without modification. Other photograph slots remain placeholders.

## Content and integrations

All eighteen journal/project texts and the About text were recovered from Wayback, using the supplied 2026 snapshot and older 2020 captures where necessary. The original policies were also recovered, but contain obsolete shop and tracking provisions; their public routes show review notices until replacement text is provided. Recovery status and source URLs are documented in `docs/migration.md`. The Iceland, Antarctica, and Wonders of the World stories were restored from the exact snapshots subsequently supplied. The Indian festivals article linked from the homepage still awaits recovery.

The shop, print products, product categories/tags, and return/refund policy are excluded. Removed shop URLs receive the normal 404; there are no redirects to unrelated pages.

Contact links open `hello@jupiterkonnections.com` in the visitor's email application, using the address found in the archive. There is no submission form, subscription service, analytics, or payment integration. Confirm the mailbox is active before launch. Policy text and the restored biographical/travel details should be reviewed before public launch.

`docs/original-sitemap.txt` preserves the original flattened migration input. It was moved out of the project root to prevent it from shadowing the generated sitemap during development. The real XML sitemap is generated by `src/pages/sitemap.xml.ts`.

## Brand and social links

`src/components/Logo.astro` contains the vector compass/JK monogram and wordmark; `public/favicon.svg` matches it. `src/components/SocialLinks.astro` provides accessible outlined buttons. Social accounts are configured in `src/data/catalog.ts`, in this order: YouTube, Instagram, Facebook, TikTok, Pinterest, X. YouTube and TikTok use profile URLs supplied by Jupiter. All six buttons are active. Instagram, Facebook, and Pinterest use links from the archived homepage. No social embeds, tracking scripts, or extra dependencies are loaded.

The two Fagradalsfjall photographs appear immediately before the Iceland article’s Day 1 heading. Adjacent Markdown images form a pair using `scripts/markdown-photo-pairs.mjs`: two columns above 760px, one column on smaller screens, with uncropped proportions and lazy-loaded WebP variants at 480/768/1200/1600px. Originals are preserved in `src/assets/images/`.

Groups of three or more adjacent Markdown images become a masonry gallery through the same processor. The six volcano-hiking photographs appear immediately before “After visiting the volcano…” in the Iceland article. The balanced gallery groups three portraits above three landscapes in three columns on larger screens, and stacks them on phones; original proportions, lazy loading, and 480/768/1200/1600px WebP variants are preserved.

The six Seljalandsfoss-area photographs follow the Seljalandsfoss description, using the same balanced gallery and responsive optimization as the volcano photographs. Original uploads are preserved as `src/assets/images/iceland-seljalandsfoss-1.jpg` through `-6.jpg`.

Three Krónan supermarket photographs appear immediately before “Our 6-day Iceland road trip began…”, with the same three-column desktop / single-column mobile layout, responsive WebP variants, and lazy loading. Originals are kept at `src/assets/images/iceland-kronan-1.jpg` through `-3.jpg`.

Seven unique Hamragarðar Camping photographs follow the “End of Day 1” heading. The gallery uses two rows of three aligned portrait-format thumbnails and a full-width sunset landscape on desktop; thumbnails crop to fit their frames, while mobile displays the complete photographs. Source files are preserved as `src/assets/images/iceland-hamragardar-camping-1.jpg` through `-7.jpg`; WebP variants and slot-specific responsive sizes are generated at build time.

Six `day2tripping` photographs appear immediately below the Iceland article’s Day 2 heading, with the same optimized gallery treatment. The five superseded `IcelandroadtripDay2.jupiterkonnections*.jpg` uploads were removed at Jupiter’s request; the selected originals are preserved as `src/assets/images/iceland-day2tripping-1.jpg` through `-6.jpg`.

## Article photo viewer

Article cover and body photographs are progressively enhanced with an accessible enlarge button and a small hover/focus icon. Click or tap to open a native dialog with the complete, uncropped image, caption, counter, previous/next controls, arrow keys, Escape, and touch swipes. Closing returns keyboard focus to the original photograph. The page behind the dialog is inert while it is open; background scrolling is locked.

The viewer requests the largest existing optimized variant only on opening/navigation, uses no gallery dependency, and never downloads the original camera JPEG. Homepage and journal story-card links keep opening articles. With JavaScript unavailable, photographs retain their original layouts. No images are requested by the hidden dialog.

Run `npm run verify:viewer` after building to exercise the shipped script against the article's actual photo inventory using a DOM test harness (not a visual browser test). Browser visual QA was unavailable in this session. The implementation is in `src/components/PhotoViewer.astro` and `src/scripts/photo-viewer.ts`.

Six Skógafoss/Kvernufoss photographs appear just above the Kvernufoss Waterfall paragraph, arranged as three landscapes followed by three portraits with aligned row edges. The original files are preserved as `src/assets/images/iceland-skogafoss-kvernufoss-1.jpg` through `-6.jpg`; they use the existing optimized WebP, lazy-loading, mobile stacking, and photo viewer.

Nine south-coast photographs appear immediately before Day 3. The desktop gallery is an interlocking three-column mosaic with portrait tiles spanning two shared rows, equal gutters, and a level outer frame; mobile and the photo viewer display full compositions. Originals are preserved at `src/assets/images/iceland-south-coast-1.jpg` through `-9.jpg`, with responsive WebP variants and lazy loading.

The “Driving to Skaftafell National Park” feature uses the selected road-to-glacier photograph (`src/assets/images/iceland-skaftafell-drive.jpg`), spanning the full article/sidebar area on desktop with its composition preserved. Responsive WebP variants extend to 2000px. The three unselected source photographs remain in `src/assets/reference/` for later use and are not copied into the public build.

Six Skaftafell glacier-hike photographs sit immediately above Jökulsárlón – Glacier Lagoon in an interlocking three-column mosaic matching the preceding gallery. Two portraits span double-height slots alongside landscape tiles, including one wider panoramic tile, with even gutters and a level outer frame. Mobile and the viewer show complete photographs; responsive WebP variants, lazy loading, and the original source files are preserved.

Five lagoon and Diamond Beach photographs appear immediately before Hoffell Hot Tubs in an aligned three-column mosaic: tall portraits frame two stacked lagoon photographs, and a full-width beach image closes the gallery with level edges and even spacing. The large TIFF original is preserved at `src/assets/reference/diamond-beach-original.tiff`; a 2000px PNG derivative supplies the WebP build pipeline, so the TIFF is never published. All five images support responsive sizes, lazy loading, mobile stacking, and the photo viewer.

The Vestrahorn at Sunrise photograph uses the same uncropped, wide feature layout and centered caption as the drive to Skaftafell, with responsive WebP images, lazy loading, and click-to-enlarge. Its original source is preserved in `src/assets/images/iceland-vestrahorn-sunrise.jpg`.

Recovered Iceland photo folders: 41 photographs now illustrate the remaining East Fjords and North Iceland stops, matched by location rather than folder day number. Recovered galleries use aligned rows with balanced final rows; single photographs use the wide feature layout. All use responsive WebP variants, lazy loading and the existing viewer. The supplied folder archive (including duplicate earlier-day material) is preserved outside the public build at `src/assets/reference/recovered-iceland/`.

The Wonders of the World article now uses 22 supplied photographs, including a collage cover and landmark-specific images. Golden Gate Bridge is retained with all supplied originals in `src/assets/reference/wonders-originals/` but excluded from this nine-landmark article. Responsive WebP variants and the shared photo viewer are used throughout.

Climbing Mount Kilimanjaro now includes 25 supplied images: a mountain cover, route map, trek and camp galleries, preparation and equipment images, and summit/certificate photographs. Four-photo groups use two columns and two rows. Unrelated portraits and a near-duplicate camp scene are preserved with all uploads in `src/assets/reference/kilimanjaro-originals/`. Original text remains historical; photographs do not constitute a current review of travel requirements.

The ultimate Zanzibar travel guide now includes 22 supplied images covering Stone Town, beaches, dhow sailing, Mnemba diving, kite surfing, Jozani, the Rock Restaurant and seaweed farming. Four-photo galleries use explicit 2 × 2 layouts. All originals are preserved in `src/assets/reference/zanzibar-originals/`.

Antarctica article: 63 supplied photographs illustrate Ushuaia, the crossing, icebergs, wildlife, shore excursions and activities. Selected groups use aligned grids and feature photographs; all 74 supplied originals are preserved in `src/assets/reference/antarctica-originals/`.

From Rwanda to Antarctica is restored at `/from-rwanda-to-antarctica/` from the supplied Quark Expeditions snapshot, with its 2 September 2021 publication date and original guest-author credit. The author's article wording is preserved; Quark's closing sales block is excluded. Eleven supplied images include a new iceberg cover. Where the original circle celebration, Zodiac-return and whale frames were absent, related supplied expedition photographs replace them, with accurate descriptions and an updated shore-landing caption. All uploads and the retrieved source HTML are preserved in `src/assets/reference/quark-rwanda-originals/`. The original and the separate Travel to Antarctica account link to each other and retain separate canonical URLs.

Homepage and journal refresh: six illustrated articles are marked `ready` for discovery without changing their historical dates or recovered status. The Zanzibar homepage feature uses its real cover; four finished stories form a 2 × 2 homepage grid, alongside two illustrated guides. Listings prioritize completed pieces, and every article links to three completed stories, preferring its own destination.

Kumbh Mela 2019: refined the portfolio introduction using the supplied India travel timeline, added five clearly labelled Kumbh Mela photographs (one cover and a 2 × 2 gallery), preserved the original route, and marked the project ready for discovery. Other India and festival uploads remain available for their respective articles. Original-resolution Kumbh files are preserved in `src/assets/images/kumbh-mela-*.jpg`.

Correct Kumbh Mela story restored at `/kumbh-mela/` from the supplied 17 October 2025 snapshot. All 13 original narrative paragraphs are preserved, with the 25 March 2020 publication date. Five supplied Kumbh photographs illustrate the story; it and the separate portfolio essay link to each other. Source HTML is saved in `src/assets/reference/kumbh-mela/`.

Kumbh Mela is now one combined journal/photo essay at `/kumbh-mela/`, discoverable in both Journal and Photography. The retired portfolio entry is removed from the content collection and sitemap; its old URL has a Cloudflare 301 plus a static redirect fallback pointing to the combined canonical article.

India destination is curated to four articles: Festivals from India, Kumbh Mela, Rajasthan Travel, and 10 Things to Do in Jaipur. The missing festivals story was restored from its supplied snapshot with 21 matching images. Rajasthan and Jaipur retain their recovered text and now have representative covers and links between the India articles. Standalone photography projects remain in Photography; they do not duplicate entries in the India article hub.

India linking cleanup: the four main articles now share destination breadcrumbs, contextual cross-links and a consistent three-card India related section. The India hub introduces and links directly to all four stories. Breadcrumb JSON-LD describes the hub/article hierarchy; each article keeps its own canonical. Old WordPress footer fragments were removed from the Rajasthan and Jaipur guides. Retired Kumbh aliases continue to 301 to `/kumbh-mela/` and remain excluded from the sitemap.

Almendrones photo essay now uses four supplied classic-car photographs: a yellow convertible cover and a three-photo aligned gallery. Source originals are preserved in `src/assets/images/almendrones-*.jpg`; unrelated Havana street and baseball uploads remain for other Cuba stories. The essay is ready for discovery and links to the Cuba destination and related writing.

Collection cleanup: short `project` photo essays live in Photography with a wider gallery-first layout and related photography. Journal and its featured archive exclude standalone projects. Destination pages show distinct Stories & Guides and Photo Essays sections. Kumbh remains one hybrid article: its journal entry also appears in Photography, while destination pages list it once under Stories & Guides. Existing public routes and self-canonical URLs remain unchanged.

Faces of India now includes 18 supplied photographs, with portrait-oriented grids, a red-turban cover and landscape groups. Experiencing Holi includes 11 supplied photographs, with a smiling-woman cover, evening feature and colour galleries. Both use the Photography layout, link to each other and the India hub, and retain original upload files.

Kilimanjaro photo refresh: eight existing images replaced with newly supplied versions; added a Shira tent, three night-camp scenes from Karanga/Barafu and a summit portrait. The Shira group is now 2 × 2. The supplied near-duplicate camp group is archived without repeating it. Uploads and previous image versions are preserved in `src/assets/reference/kilimanjaro-new-uploads/`; generated web images use the shared responsive pipeline.

Correction: the 31 October Kilimanjaro uploads belong to Kilimanjaro under a Full Moon. Its 13 supplied images now illustrate the day-by-day story with a Barafu night-camp cover. The practical Climbing Mount Kilimanjaro guide has been restored to its previous photo selection and image versions. Each article links to the other.

Full-moon climb additions: four Lava Tower/descent photographs, the extra Machame Gate scene, a daytime camp image (retaining its supplied Karanga label), and an additional summit photograph. The story now closes with the supplied Zanzibar palm-beach image. The practical climbing guide is unchanged.

All-article cleanup (31 October 2026): removed four recovered WordPress footer blocks, 56 dead media-only links and seven empty figures, with pre-cleanup source backups preserved in `src/assets/reference/article-cleanup-20261031/`. Intentional reading paths are defined in `src/data/article-connections.ts`; related cards stay format-aware while labelled companion links connect writing and photography. Destination breadcrumbs and matching BreadcrumbList structured data now cover every article and destination. Existing canonical routes and duplicate redirects remain intact.

Argentina and Chile destination hubs now complement Antarctica. The shared route follows the user-provided order: Iguazú → Buenos Aires → Ushuaia → Antarctica → Buenos Aires → Santiago → Valparaíso → Atacama. Country hubs describe only confirmed stops and link to the existing Antarctic accounts; no detailed city articles or dates are invented. Both Antarctica articles link back to these destinations.

South America expanded with Peru, Brazil and Colombia destination hubs, using only the supplied travel routes. Peru is identified as the first South American trip. Peru and Colombia are approximately ten days each; the approximately twelve-day duration applies to Recife, not the whole Brazil trip. Argentina/Antarctica/Chile is recorded as 22+ days overall. Further details are tracked in `docs/south-america-content-plan.md`.

World journey inventory expanded with Cambodia, Jordan, Egypt, China/Hong Kong, Italy, Mexico, Nepal, Sri Lanka and Vietnam. The reusable route data is now `src/data/destination-journeys.ts`. Repeat visits are distinguished from single journeys; Mexico’s second visit has no invented duration. The Wonders article links to the matching hubs, and India records the actual six-day first road trip and subsequent journeys. Details and unresolved dates/durations are recorded in `docs/world-journeys-content-plan.md`.

Travel inventory now also includes Turkey/Cappadocia, Lebanon, Ghana, Rwanda, Senegal and separate US journeys. The reusable destination component supports multiple distinct visits without combining them into one itinerary. Cappadocia’s “5 trip” duration remains unconfirmed. Details are recorded in `docs/world-journeys-content-plan.md`.

Europe and Asia-Pacific travel summaries added: Spain, France, Monaco, Germany, United Arab Emirates, Malaysia, Singapore, Australia and New Zealand. Paris is marked as home; the Bordeaux/Dordogne/Corrèze/Périgord journey is explicitly planned. Germany and France share the supplied road-trip route. The directory is grouped by region, with six featured destinations on the homepage. The author confirmed the road-trip stop as Oberwesel.

African travel inventory expanded with South Africa/Cape Town, Zimbabwe, Zambia and Kenya. Nairobi is separate from the earlier Diani/Mombasa visit. The six-day southern African adventure duration is held for clarification. The destination directory now labels journey overviews separately from destinations with full stories and photography.


### Cuba collection and original image storage — November 2026

The Cuba destination hub and all four Cuba pieces share collection navigation. Journal stories and photo essays remain separate formats. Cuban Passion lives at `/portfolio/cuban-sports/`; `/cuban-passion/` redirects there. The 2015 journey remains a labelled draft, excluded from sitemap and RSS.

Original uploads now live in `image-library/originals/`, outside the public build. All 640 files were moved without deleting or recompressing originals; the migration manifest records the paths. Put new trip uploads there. Article-ready assets remain in `src/assets/images/` and Astro optimizes those for delivery. `public/images/` is retained as an empty former inbox.
