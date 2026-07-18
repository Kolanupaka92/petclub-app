## [1.46.9](https://github.com/Kolanupaka92/petclub-app/compare/v1.46.8...v1.46.9) (2026-07-18)


### Bug Fixes

* **copy:** terminology and phrasing fixes on landing page ([fe94404](https://github.com/Kolanupaka92/petclub-app/commit/fe94404f1a61d0a70478d642ac926b08c5bdbf02))

## [1.46.8](https://github.com/Kolanupaka92/petclub-app/compare/v1.46.7...v1.46.8) (2026-07-18)


### Bug Fixes

* **landing:** make WhatsApp support hours region-aware ([c9a1b06](https://github.com/Kolanupaka92/petclub-app/commit/c9a1b0698092e315c76d5c1380c8ab454295c278))

## [1.46.7](https://github.com/Kolanupaka92/petclub-app/compare/v1.46.6...v1.46.7) (2026-07-02)


### Bug Fixes

* **bookings:** send addons:[] instead of null when no add-ons selected ([2976cfe](https://github.com/Kolanupaka92/petclub-app/commit/2976cfe53e23cb9ea94a0a030e51b3ce93b78129))

## [1.46.6](https://github.com/Kolanupaka92/petclub-app/compare/v1.46.5...v1.46.6) (2026-07-02)


### Bug Fixes

* **address:** geocode/reverse-geocode silently failed on expired session cookie ([93349c5](https://github.com/Kolanupaka92/petclub-app/commit/93349c503dbda36f919e4d94ca755cb171bb3abb))

## [1.46.5](https://github.com/Kolanupaka92/petclub-app/compare/v1.46.4...v1.46.5) (2026-07-02)


### Bug Fixes

* **booking:** city field placeholder hardcoded to Hyderabad for all customers ([3f2f6d6](https://github.com/Kolanupaka92/petclub-app/commit/3f2f6d65f07c2d00f4ca627b1108b79bc25cdc33))

## [1.46.4](https://github.com/Kolanupaka92/petclub-app/compare/v1.46.3...v1.46.4) (2026-07-02)


### Bug Fixes

* **admin:** show 'Pending Signup' instead of raw 'Pending_role' enum ([ef288f4](https://github.com/Kolanupaka92/petclub-app/commit/ef288f4f527a3fb1374a64b07a57047abc4fe76c))

## [1.46.3](https://github.com/Kolanupaka92/petclub-app/compare/v1.46.2...v1.46.3) (2026-07-02)


### Bug Fixes

* **admin:** revenue report showed ₹0 gross / 0 bookings ([fe240be](https://github.com/Kolanupaka92/petclub-app/commit/fe240be609ca2774c16daeec45c2b89d95f9d69c))

## [1.46.2](https://github.com/Kolanupaka92/petclub-app/compare/v1.46.1...v1.46.2) (2026-07-02)


### Bug Fixes

* **admin:** DB audit no longer shows zero-count 'incomplete signups' issue ([7c1a9bf](https://github.com/Kolanupaka92/petclub-app/commit/7c1a9bf9a51580ff6b09ad4be830cf9d8a2beb3b))

## [1.46.1](https://github.com/Kolanupaka92/petclub-app/compare/v1.46.0...v1.46.1) (2026-07-02)


### Bug Fixes

* **loyalty:** region-aware payment labels in rewards explainer and earn rules ([422b7a8](https://github.com/Kolanupaka92/petclub-app/commit/422b7a81cbd58a04ae0c16ab79e181fcb8ed0931))

# [1.46.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.45.8...v1.46.0) (2026-07-02)


### Features

* **analytics:** add Vercel Web Analytics (cookieless, prod-only) ([d9c6907](https://github.com/Kolanupaka92/petclub-app/commit/d9c690778d1870db8ad5e2674619e16767a1db49))

## [1.45.8](https://github.com/Kolanupaka92/petclub-app/compare/v1.45.7...v1.45.8) (2026-07-01)


### Bug Fixes

* app landing consistency + remove customer ID/KYC verification ([#3](https://github.com/Kolanupaka92/petclub-app/issues/3)) ([8b4be98](https://github.com/Kolanupaka92/petclub-app/commit/8b4be98d8cef50fc75cfcc8ee3bb4d6a24e7b5e2)), closes [#1](https://github.com/Kolanupaka92/petclub-app/issues/1)

## [1.45.7](https://github.com/Kolanupaka92/petclub-app/compare/v1.45.6...v1.45.7) (2026-07-01)


### Bug Fixes

* replace broken CDN flag images with self-hosted SVGs ([f7d9ded](https://github.com/Kolanupaka92/petclub-app/commit/f7d9dedeb6dc15365a74d4e93fabddd2a6579a0b))

## [1.45.6](https://github.com/Kolanupaka92/petclub-app/compare/v1.45.5...v1.45.6) (2026-07-01)


### Bug Fixes

* **admin:** exclude purge_suspended from bulk db-cleanup auto-clean ([7cf8117](https://github.com/Kolanupaka92/petclub-app/commit/7cf8117f40dbc58e76fe2beef127f4b2cde4b629))

## [1.45.5](https://github.com/Kolanupaka92/petclub-app/compare/v1.45.4...v1.45.5) (2026-07-01)


### Bug Fixes

* **admin:** stale upcoming bookings issue reused cancelled_bookings key ([745bc02](https://github.com/Kolanupaka92/petclub-app/commit/745bc020423725a63561941b1d68e6a920438054))

## [1.45.4](https://github.com/Kolanupaka92/petclub-app/compare/v1.45.3...v1.45.4) (2026-07-01)


### Bug Fixes

* repair mojibake corruption in AdminDashboard.jsx ([019ee66](https://github.com/Kolanupaka92/petclub-app/commit/019ee665dafcb30950cec475fff652d7aa8bc558))

## [1.45.3](https://github.com/Kolanupaka92/petclub-app/compare/v1.45.2...v1.45.3) (2026-07-01)


### Bug Fixes

* regenerate brochure/pricing PDFs with Richardson, TX 75082 address ([b8e8303](https://github.com/Kolanupaka92/petclub-app/commit/b8e830361dad156b070d983e2d291efafc0fcdcf))

## [1.45.2](https://github.com/Kolanupaka92/petclub-app/compare/v1.45.1...v1.45.2) (2026-07-01)

## [1.45.1](https://github.com/Kolanupaka92/petclub-app/compare/v1.45.0...v1.45.1) (2026-06-29)


### Bug Fixes

* **ci:** smoke test health check against actual response shape ([327564d](https://github.com/Kolanupaka92/petclub-app/commit/327564d439ba2540db7c905022fe146ddad8d519))

# [1.45.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.44.1...v1.45.0) (2026-06-29)


### Features

* **pricing:** sync USD prices and wire vet care pricing into booking UI ([efe1b56](https://github.com/Kolanupaka92/petclub-app/commit/efe1b568d75d5421f79213c5212b8fca5aa4e5ca))
* **pricing:** sync USD prices in frontend fallback to realistic US market rates ([5d08b74](https://github.com/Kolanupaka92/petclub-app/commit/5d08b7449d5c470939f5a77ccfb649cb0ca045f7))

## [1.44.1](https://github.com/Kolanupaka92/petclub-app/compare/v1.44.0...v1.44.1) (2026-06-29)


### Bug Fixes

* **mobile:** correct safe-area classes on Professional and Admin bottom navs ([34cf3d5](https://github.com/Kolanupaka92/petclub-app/commit/34cf3d556aaefd060179293b9a3e9e59fe3f72d7))

# [1.44.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.43.6...v1.44.0) (2026-06-29)


### Features

* **admin:** add manual refresh button to Platform Status widget ([31bd564](https://github.com/Kolanupaka92/petclub-app/commit/31bd56447ccc5c31a3599d54480ef5b842eb9198))

## [1.43.6](https://github.com/Kolanupaka92/petclub-app/compare/v1.43.5...v1.43.6) (2026-06-29)


### Bug Fixes

* **admin:** fix mobile bottom nav — 9 cramped tabs → 4 primary + More ([ab48c52](https://github.com/Kolanupaka92/petclub-app/commit/ab48c52f8580528e12430d043658e404fa9e6b9b))

## [1.43.5](https://github.com/Kolanupaka92/petclub-app/compare/v1.43.4...v1.43.5) (2026-06-29)


### Bug Fixes

* **admin:** correctly detect healthy services in platform status widget ([e8a58d5](https://github.com/Kolanupaka92/petclub-app/commit/e8a58d50d3a7478d9b002a7100eced975fb9acf5))

## [1.43.4](https://github.com/Kolanupaka92/petclub-app/compare/v1.43.3...v1.43.4) (2026-06-29)


### Bug Fixes

* **admin:** improve platform status health display and mobile layout ([4d6dc08](https://github.com/Kolanupaka92/petclub-app/commit/4d6dc08b772666cffba1ad435879320a9deddad1))

## [1.43.3](https://github.com/Kolanupaka92/petclub-app/compare/v1.43.2...v1.43.3) (2026-06-29)


### Bug Fixes

* guard Supabase createClient against missing env vars at module load ([47c1210](https://github.com/Kolanupaka92/petclub-app/commit/47c121035c5c9bc8e0ccaf17bb06934e913962e8))

## [1.43.2](https://github.com/Kolanupaka92/petclub-app/compare/v1.43.1...v1.43.2) (2026-06-29)


### Bug Fixes

* remaining medium and low mobile compatibility issues ([7674a51](https://github.com/Kolanupaka92/petclub-app/commit/7674a51eeeabe19e92b89c8d2b87db636f16a9a3))

## [1.43.1](https://github.com/Kolanupaka92/petclub-app/compare/v1.43.0...v1.43.1) (2026-06-29)


### Bug Fixes

* mobile compatibility for iOS and Android ([39fd92f](https://github.com/Kolanupaka92/petclub-app/commit/39fd92f5a9f09c721d83e88c94bbad0244cc3060))

# [1.43.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.42.1...v1.43.0) (2026-06-29)


### Features

* admin payouts tab, fix rebook stale state, customer ID review ([3d6e6a8](https://github.com/Kolanupaka92/petclub-app/commit/3d6e6a8108d180d09fbf5ebd396edb68242ce83a))

## [1.42.1](https://github.com/Kolanupaka92/petclub-app/compare/v1.42.0...v1.42.1) (2026-06-29)


### Bug Fixes

* all dashboard audit gaps — broken routing, UI bugs, mobile admin nav ([e6c38ba](https://github.com/Kolanupaka92/petclub-app/commit/e6c38bab0460fb519cd9b541dbf762dac933b8c7))

# [1.42.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.41.2...v1.42.0) (2026-06-29)


### Features

* payout modal, silent refresh, booking flow improvements ([10b9ce7](https://github.com/Kolanupaka92/petclub-app/commit/10b9ce771556ec470d11badd8c8d9d7aac754f6d))

## [1.41.2](https://github.com/Kolanupaka92/petclub-app/compare/v1.41.1...v1.41.2) (2026-06-29)


### Bug Fixes

* wire petclub:unauthorized event to global logout handler ([d878b1b](https://github.com/Kolanupaka92/petclub-app/commit/d878b1b5a41f896b8a762f2726698941c4817773))

## [1.41.1](https://github.com/Kolanupaka92/petclub-app/compare/v1.41.0...v1.41.1) (2026-06-28)


### Bug Fixes

* **admin:** use bookings.currency field for INR/USD revenue split ([609ced8](https://github.com/Kolanupaka92/petclub-app/commit/609ced80c543433f63f68f9a0051b82021a5650f))

# [1.41.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.40.8...v1.41.0) (2026-06-28)


### Features

* **admin:** split revenue card into separate INR and USD sections ([eb60ac7](https://github.com/Kolanupaka92/petclub-app/commit/eb60ac77b55fe1544c1b0f09b30c55ab32abaf7f))

## [1.40.8](https://github.com/Kolanupaka92/petclub-app/compare/v1.40.7...v1.40.8) (2026-06-28)


### Bug Fixes

* **i18n:** eliminate all hardcoded INR/en-IN from customer and provider views ([3c205a5](https://github.com/Kolanupaka92/petclub-app/commit/3c205a54139622d867f13121e5463bba8019fc77))

## [1.40.7](https://github.com/Kolanupaka92/petclub-app/compare/v1.40.6...v1.40.7) (2026-06-28)


### Bug Fixes

* **currency:** wire USD prices to all service package cards and add-ons ([4ab0363](https://github.com/Kolanupaka92/petclub-app/commit/4ab03633d10a4297058f5f5e615156eb507a9aa7))

## [1.40.6](https://github.com/Kolanupaka92/petclub-app/compare/v1.40.5...v1.40.6) (2026-06-28)


### Bug Fixes

* **currency:** replace all hardcoded INR symbols with dynamic currencySymbol ([923e9ce](https://github.com/Kolanupaka92/petclub-app/commit/923e9cef8b5d6e0e0f7ba4f4d62871c53742fc5c))

## [1.40.5](https://github.com/Kolanupaka92/petclub-app/compare/v1.40.4...v1.40.5) (2026-06-28)


### Bug Fixes

* **currency:** region-based currency symbol from phone prefix ([728fa93](https://github.com/Kolanupaka92/petclub-app/commit/728fa93def80ed0a643d226b14fcecac257e6685))

## [1.40.4](https://github.com/Kolanupaka92/petclub-app/compare/v1.40.3...v1.40.4) (2026-06-28)


### Bug Fixes

* **auth:** clear stale localStorage token + force SW reload on update ([13b648f](https://github.com/Kolanupaka92/petclub-app/commit/13b648f8ef3e5a4aca4f51393a3077817af920e3))

## [1.40.3](https://github.com/Kolanupaka92/petclub-app/compare/v1.40.2...v1.40.3) (2026-06-27)


### Bug Fixes

* **auth:** call api.logout() on sign-out to clear httpOnly cookie ([7050889](https://github.com/Kolanupaka92/petclub-app/commit/7050889f6a09689e6f4ed341a6456ff6151b154c))

## [1.40.2](https://github.com/Kolanupaka92/petclub-app/compare/v1.40.1...v1.40.2) (2026-06-27)


### Bug Fixes

* **loyalty:** fix broken stat card field names in admin loyalty panel ([c52a142](https://github.com/Kolanupaka92/petclub-app/commit/c52a14274baa3be506043adb498f68e684d191df))

## [1.40.1](https://github.com/Kolanupaka92/petclub-app/compare/v1.40.0...v1.40.1) (2026-06-27)


### Bug Fixes

* **contact:** update WhatsApp number to +16097215754 ([1cb3eb9](https://github.com/Kolanupaka92/petclub-app/commit/1cb3eb9e21a1529ae8880a7d228eccc2cddd04ba))

# [1.40.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.39.1...v1.40.0) (2026-06-01)


### Features

* **landing:** UX cleanup — remove duplicates, add testimonials, fix layout ([ad846ac](https://github.com/Kolanupaka92/petclub-app/commit/ad846ac8efc69a5941fecdc9c37d99782c02c574))

## [1.39.1](https://github.com/Kolanupaka92/petclub-app/compare/v1.39.0...v1.39.1) (2026-06-01)


### Bug Fixes

* **landing:** mobile-responsive Let's Connect section ([4f02ce2](https://github.com/Kolanupaka92/petclub-app/commit/4f02ce2c48f9e14333ff1266d9ccf36b8c0ef50a)), closes [#7c4a1e](https://github.com/Kolanupaka92/petclub-app/issues/7c4a1e)

# [1.39.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.38.6...v1.39.0) (2026-06-01)


### Features

* **infra:** Sentry error tracking + engineering guide PDF ([9182fd2](https://github.com/Kolanupaka92/petclub-app/commit/9182fd2eaa38be54833ce539b105c6819242dbdc))

## [1.38.6](https://github.com/Kolanupaka92/petclub-app/compare/v1.38.5...v1.38.6) (2026-05-31)


### Bug Fixes

* **auth:** surface backend error in phone OTP failure + pass-through message ([ba1418d](https://github.com/Kolanupaka92/petclub-app/commit/ba1418dfecf0ab932d0dbfbd39db3ca6281c6b68))

## [1.38.5](https://github.com/Kolanupaka92/petclub-app/compare/v1.38.4...v1.38.5) (2026-05-31)


### Bug Fixes

* **auth:** friendly OTP expired/invalid error messages with auto-reset ([9914d70](https://github.com/Kolanupaka92/petclub-app/commit/9914d70bd4d0e8d0c039c0f03f6f3b6919ffdb9b))

## [1.38.4](https://github.com/Kolanupaka92/petclub-app/compare/v1.38.3...v1.38.4) (2026-05-30)


### Bug Fixes

* **pro:** restore bio-based onboarding check, bypass for verified pros ([dc4dbd7](https://github.com/Kolanupaka92/petclub-app/commit/dc4dbd7faff2b69baa5eee1435d039a412739df1))

## [1.38.3](https://github.com/Kolanupaka92/petclub-app/compare/v1.38.2...v1.38.3) (2026-05-30)


### Bug Fixes

* **pro:** use name as onboarding completion signal to stop refresh loop ([de752b3](https://github.com/Kolanupaka92/petclub-app/commit/de752b3d2959b2c15ab6e40685f510938ae253cf))

## [1.38.2](https://github.com/Kolanupaka92/petclub-app/compare/v1.38.1...v1.38.2) (2026-05-30)


### Bug Fixes

* **login:** remove travel allowance, insurance, 5-star review from Partner Agreement ([736e153](https://github.com/Kolanupaka92/petclub-app/commit/736e153b3954c206e734808cb85b70f1be21c0d2))

## [1.38.1](https://github.com/Kolanupaka92/petclub-app/compare/v1.38.0...v1.38.1) (2026-05-30)


### Bug Fixes

* **e2e:** OTP rate-limit retry, correct timeouts, missed loyalty text ([9dc8d50](https://github.com/Kolanupaka92/petclub-app/commit/9dc8d5057b22b3cffca091c981552df89b1c1bb5))

# [1.38.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.37.2...v1.38.0) (2026-05-30)


### Features

* update grooming packages, sync loyalty model, clean groomer earnings ([80868c2](https://github.com/Kolanupaka92/petclub-app/commit/80868c2f86a7e444fc7393dd9d8260de6ef7f938))

## [1.37.2](https://github.com/Kolanupaka92/petclub-app/compare/v1.37.1...v1.37.2) (2026-05-30)


### Bug Fixes

* **e2e:** pro cancel removes booking from list immediately ([dc8ea5b](https://github.com/Kolanupaka92/petclub-app/commit/dc8ea5b177459298cf52dd053eb64bd614dc263d))

## [1.37.1](https://github.com/Kolanupaka92/petclub-app/compare/v1.37.0...v1.37.1) (2026-05-30)


### Bug Fixes

* **reports:** remove hardcoded 55%/45% labels from Revenue Report ([3d10045](https://github.com/Kolanupaka92/petclub-app/commit/3d1004527ae087ba0c48f863cdee336b3a09a5b2))

# [1.37.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.36.0...v1.37.0) (2026-05-29)


### Features

* cancel policy display, refund mgmt, pro cancel, loyalty reversal, chat masking ([40d9fa9](https://github.com/Kolanupaka92/petclub-app/commit/40d9fa9a3ec4b285f311d0d386540880a72bf79e))

# [1.36.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.35.0...v1.36.0) (2026-05-29)


### Features

* comprehensive workflow improvements across all three roles ([921f20e](https://github.com/Kolanupaka92/petclub-app/commit/921f20e4de97ad25c044cadf3d56fdf47b793aaa))

# [1.35.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.34.0...v1.35.0) (2026-05-29)


### Features

* **chat:** in-app messaging between customer and professional ([090c5cc](https://github.com/Kolanupaka92/petclub-app/commit/090c5cc050eaa60bc18139a2f337501841be9389))

# [1.34.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.33.2...v1.34.0) (2026-05-29)


### Features

* **pets:** auto-show completed bookings in pet service history ([3dc5f3c](https://github.com/Kolanupaka92/petclub-app/commit/3dc5f3c8f2d701161073b8febcaccb4d1a5c7e4f))

## [1.33.2](https://github.com/Kolanupaka92/petclub-app/compare/v1.33.1...v1.33.2) (2026-05-29)


### Bug Fixes

* **auth:** stop forcing profile form on re-login for existing users ([ac7a77d](https://github.com/Kolanupaka92/petclub-app/commit/ac7a77d28a57fa1e8aa34feae03b51c58412f288))

## [1.33.1](https://github.com/Kolanupaka92/petclub-app/compare/v1.33.0...v1.33.1) (2026-05-29)


### Bug Fixes

* **admin:** remove hardcoded 55%/45% from revenue summary bars ([d98f918](https://github.com/Kolanupaka92/petclub-app/commit/d98f9180c3a34cefe981db1f4f049789846b9d22))

# [1.33.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.32.0...v1.33.0) (2026-05-29)


### Features

* **admin:** show groomer 70/30 split with PETclub offer deduction ([2b2a396](https://github.com/Kolanupaka92/petclub-app/commit/2b2a39690ae459a76e952068b1977d1a09c44c9c))

# [1.32.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.31.3...v1.32.0) (2026-05-29)


### Features

* **admin:** manual provider assignment with push notification ([8de7712](https://github.com/Kolanupaka92/petclub-app/commit/8de77127ad4c361f000fa4c2b5d30327359d3394))

## [1.31.3](https://github.com/Kolanupaka92/petclub-app/compare/v1.31.2...v1.31.3) (2026-05-29)


### Bug Fixes

* **admin:** resolve Rules of Hooks violation on Bookings tab ([5c50a7a](https://github.com/Kolanupaka92/petclub-app/commit/5c50a7a1eb6a07d5957f4456d069768d559f257f))


### Reverts

* remove brochure UI from customer app and landing page ([2e8c1b6](https://github.com/Kolanupaka92/petclub-app/commit/2e8c1b694de06b8935039681412e01c3cdc1a9f6))

## [1.31.2](https://github.com/Kolanupaka92/petclub-app/compare/v1.31.1...v1.31.2) (2026-05-29)


### Bug Fixes

* **pricing:** remove Wahl brand name and shampoo per-wash pricing ([dc8d571](https://github.com/Kolanupaka92/petclub-app/commit/dc8d571b5117f24d1042c16754bc92f32356f579))

## [1.31.1](https://github.com/Kolanupaka92/petclub-app/compare/v1.31.0...v1.31.1) (2026-05-29)


### Bug Fixes

* **cards:** update titles + premium design improvements ([262d8f6](https://github.com/Kolanupaka92/petclub-app/commit/262d8f6c9c62587046e3674486069c6d7ea3993e))

# [1.31.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.30.1...v1.31.0) (2026-05-29)


### Features

* add business cards PDF with WhatsApp numbers ([6b6ffe4](https://github.com/Kolanupaka92/petclub-app/commit/6b6ffe41cb284ef6b6b2dc6dfc28dd3ed1093d3e))

## [1.30.1](https://github.com/Kolanupaka92/petclub-app/compare/v1.30.0...v1.30.1) (2026-05-29)


### Bug Fixes

* **pricing:** keep cover photos only · remove from other panels · fix Bath+ header ([cd94373](https://github.com/Kolanupaka92/petclub-app/commit/cd94373bebb70d5b36ae67645e3c7c9db3617c96))

# [1.30.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.29.1...v1.30.0) (2026-05-29)


### Features

* **brochures:** use REAL pet photos + emphasize cat services ([6ff1691](https://github.com/Kolanupaka92/petclub-app/commit/6ff1691f23df460d1c690f51331589ead4a6c30d)), closes [hi#quality](https://github.com/hi/issues/quality)

## [1.29.1](https://github.com/Kolanupaka92/petclub-app/compare/v1.29.0...v1.29.1) (2026-05-29)


### Bug Fixes

* **brochures:** clean header design + add original pet illustrations ([13015cd](https://github.com/Kolanupaka92/petclub-app/commit/13015cd58607b915e07a73f05bb3bafc9d49daa8))

# [1.29.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.28.0...v1.29.0) (2026-05-29)


### Features

* **brochures:** add pricing brochure + use official PETclub logo ([83d72a0](https://github.com/Kolanupaka92/petclub-app/commit/83d72a0ab5cc285e013ca1baba3747a1f2414850))

# [1.28.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.27.0...v1.28.0) (2026-05-29)


### Features

* add PETclub marketing brochure + integrate share/download in app ([a77bbb5](https://github.com/Kolanupaka92/petclub-app/commit/a77bbb5eac29c7eb6662777af309d54b5da6d606))

# [1.27.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.26.3...v1.27.0) (2026-05-29)


### Features

* **e2e:** add email OTP login via Mailinator to bypass Firebase SMS limits ([5140c14](https://github.com/Kolanupaka92/petclub-app/commit/5140c14163e35de954bc62bfb83efd554fc136f7))

## [1.26.3](https://github.com/Kolanupaka92/petclub-app/compare/v1.26.2...v1.26.3) (2026-05-29)


### Bug Fixes

* **e2e:** consolidate security tests to respect Firebase OTP rate limits ([ffe1288](https://github.com/Kolanupaka92/petclub-app/commit/ffe1288311a00b8c22103365fd337127dc0b769c)), closes [#1](https://github.com/Kolanupaka92/petclub-app/issues/1) [#2](https://github.com/Kolanupaka92/petclub-app/issues/2)

## [1.26.2](https://github.com/Kolanupaka92/petclub-app/compare/v1.26.1...v1.26.2) (2026-05-28)


### Bug Fixes

* **e2e:** replace clipboard paste with per-digit fill() for OTP entry ([208abcd](https://github.com/Kolanupaka92/petclub-app/commit/208abcdf22438f16796a72a3a1f716bb85fb3643))

## [1.26.1](https://github.com/Kolanupaka92/petclub-app/compare/v1.26.0...v1.26.1) (2026-05-28)


### Bug Fixes

* **e2e:** adapt tests for 10-slot Firebase limit — only 2 numbers needed ([719c2bd](https://github.com/Kolanupaka92/petclub-app/commit/719c2bdb9f445ccdb304f8f36988d360ccc986b9))

# [1.26.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.25.0...v1.26.0) (2026-05-28)


### Features

* **e2e:** add full Playwright test suite with graceful Firebase skip ([78c5e09](https://github.com/Kolanupaka92/petclub-app/commit/78c5e09a2707821635d901b6f12774a17ce89309))

# [1.25.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.24.0...v1.25.0) (2026-05-28)


### Features

* **admin:** complete dashboard overhaul — user mix, reports tab, bookings UX ([bf5761c](https://github.com/Kolanupaka92/petclub-app/commit/bf5761c3b4cf260189064139c51d36dbf1a3976c))

# [1.24.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.23.0...v1.24.0) (2026-05-28)


### Features

* sync UI/UX across all 4 surfaces — LandingPage + Login aligned with www ([3c1be67](https://github.com/Kolanupaka92/petclub-app/commit/3c1be675cf8ac3b235893527a719056550325d88)), closes [#3d1f00](https://github.com/Kolanupaka92/petclub-app/issues/3d1f00) [#f97316](https://github.com/Kolanupaka92/petclub-app/issues/f97316) [#f97316](https://github.com/Kolanupaka92/petclub-app/issues/f97316)

# [1.23.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.22.0...v1.23.0) (2026-05-28)


### Features

* warm golden-hour gradient redesign for landing page ([d4ec0e8](https://github.com/Kolanupaka92/petclub-app/commit/d4ec0e80bb445fe90c55ce47406534a138eaf00e)), closes [#0c0500](https://github.com/Kolanupaka92/petclub-app/issues/0c0500) [#120700](https://github.com/Kolanupaka92/petclub-app/issues/120700) [#1c0e00](https://github.com/Kolanupaka92/petclub-app/issues/1c0e00) [#fff8f0](https://github.com/Kolanupaka92/petclub-app/issues/fff8f0) [#fff1e0](https://github.com/Kolanupaka92/petclub-app/issues/fff1e0) [#f97316](https://github.com/Kolanupaka92/petclub-app/issues/f97316) [#ea580c](https://github.com/Kolanupaka92/petclub-app/issues/ea580c) [#f59e0b](https://github.com/Kolanupaka92/petclub-app/issues/f59e0b) [#0c0500](https://github.com/Kolanupaka92/petclub-app/issues/0c0500) [#3b0d00](https://github.com/Kolanupaka92/petclub-app/issues/3b0d00) [#7c2d12](https://github.com/Kolanupaka92/petclub-app/issues/7c2d12) [#c2410c](https://github.com/Kolanupaka92/petclub-app/issues/c2410c) [#f97316](https://github.com/Kolanupaka92/petclub-app/issues/f97316)

# [1.22.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.21.3...v1.22.0) (2026-05-28)


### Features

* landing page — mobile nav, FAQ section, bug fixes ([bdfe46a](https://github.com/Kolanupaka92/petclub-app/commit/bdfe46aad2dab633b21d4b83bfdc9661d5bb66ce))

## [1.21.3](https://github.com/Kolanupaka92/petclub-app/compare/v1.21.2...v1.21.3) (2026-05-28)


### Bug Fixes

* JOIN AS A PRO card opens professional sign-up instead of mailto ([7f28fab](https://github.com/Kolanupaka92/petclub-app/commit/7f28fabfc468bbcfda581c07d1f07883d105d56b))

## [1.21.2](https://github.com/Kolanupaka92/petclub-app/compare/v1.21.1...v1.21.2) (2026-05-28)


### Bug Fixes

* consistent icon.svg logo across all 4 missing screens ([9ddc654](https://github.com/Kolanupaka92/petclub-app/commit/9ddc65416845d7c3e15076b6de9b9b90d8499c72))

## [1.21.1](https://github.com/Kolanupaka92/petclub-app/compare/v1.21.0...v1.21.1) (2026-05-28)


### Bug Fixes

* replace external hero image with CSS gradient + SVG paw art ([3a5f2dc](https://github.com/Kolanupaka92/petclub-app/commit/3a5f2dc8907e1dbface1bd6f75eaa09b310e578d))

# [1.21.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.20.4...v1.21.0) (2026-05-28)


### Features

* 70/30 commission, weekly earnings dashboard + security fixes ([5882438](https://github.com/Kolanupaka92/petclub-app/commit/5882438c58d537049930be241dab523fabf596ba))

## [1.20.4](https://github.com/Kolanupaka92/petclub-app/compare/v1.20.3...v1.20.4) (2026-05-28)


### Bug Fixes

* apiMode bug + login hero service pills (audit fixes) ([ab62d8a](https://github.com/Kolanupaka92/petclub-app/commit/ab62d8a1e83330314e9d6a27d4ccf8974d7086de))

## [1.20.3](https://github.com/Kolanupaka92/petclub-app/compare/v1.20.2...v1.20.3) (2026-05-28)


### Bug Fixes

* replace login hero with confirmed-loading Pexels image ([f8fb3c9](https://github.com/Kolanupaka92/petclub-app/commit/f8fb3c914a5c676023c8cae884716a1a07629ee6))

## [1.20.2](https://github.com/Kolanupaka92/petclub-app/compare/v1.20.1...v1.20.2) (2026-05-28)


### Bug Fixes

* escape apostrophe in WhatsAppFAB professional message string ([55433bd](https://github.com/Kolanupaka92/petclub-app/commit/55433bdbf007e6b4eb166524a980f9d8b9424082))

## [1.20.1](https://github.com/Kolanupaka92/petclub-app/compare/v1.20.0...v1.20.1) (2026-05-28)


### Bug Fixes

* replace deleted Unsplash hero photo on login page ([a1d52e0](https://github.com/Kolanupaka92/petclub-app/commit/a1d52e07940f0de3889ad7e85b8731d49cbdf709))

# [1.20.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.19.1...v1.20.0) (2026-05-28)


### Features

* add floating WhatsApp support button to customer and pro apps ([23c4f9f](https://github.com/Kolanupaka92/petclub-app/commit/23c4f9f574c69d0e86c3a6decc387c43626dab82))

## [1.19.1](https://github.com/Kolanupaka92/petclub-app/compare/v1.19.0...v1.19.1) (2026-05-27)


### Bug Fixes

* full E2E audit — Walker/Boarding wired across all views, nothing hardcoded ([8025ed9](https://github.com/Kolanupaka92/petclub-app/commit/8025ed92740c5f60848af1faf0839efa10fc294f))

# [1.19.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.18.0...v1.19.0) (2026-05-27)


### Features

* smart vaccine picker + health passport on pet profile ([8368954](https://github.com/Kolanupaka92/petclub-app/commit/8368954c0871560d16ebe83ce82f6e04736eaeb8))

# [1.18.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.17.0...v1.18.0) (2026-05-27)


### Features

* add Walker and Boarding professional roles to Login onboarding ([cdc70a8](https://github.com/Kolanupaka92/petclub-app/commit/cdc70a8d72787f2d7c42172e3de498c5207b466c))

# [1.17.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.16.0...v1.17.0) (2026-05-27)


### Features

* **app:** v2.0 E2E functionality upgrade — 6 services, booking flows, filters ([4386fed](https://github.com/Kolanupaka92/petclub-app/commit/4386fedea46b47cdb4fad761f3d58d186f667ab9))

# [1.16.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.15.0...v1.16.0) (2026-05-27)


### Features

* v2.0 landing page — competitor research upgrade (27 May 2026) ([ac5fc8f](https://github.com/Kolanupaka92/petclub-app/commit/ac5fc8fee4fd5df16b56ea55d7aa41d175bddc7e))

# [1.15.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.14.0...v1.15.0) (2026-05-27)


### Features

* **landing:** add Let's Connect section with India WhatsApp + rewrite ToS ([d5245f8](https://github.com/Kolanupaka92/petclub-app/commit/d5245f83c1c1e315d30b7fba8fb7c2ed4d9ad66c))

# [1.14.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.13.2...v1.14.0) (2026-05-26)


### Features

* **legal:** add Terms of Service link to landing page footer and profile tab ([67bdbd6](https://github.com/Kolanupaka92/petclub-app/commit/67bdbd66d7c733fcb83e11a7adeb74a212810ce9))

## [1.13.2](https://github.com/Kolanupaka92/petclub-app/compare/v1.13.1...v1.13.2) (2026-05-25)


### Bug Fixes

* **auth:** silently fall back to Twilio when Firebase Phone Auth fails ([56bc138](https://github.com/Kolanupaka92/petclub-app/commit/56bc138e05076f283cda86f9abca9d0be099afa5))

## [1.13.1](https://github.com/Kolanupaka92/petclub-app/compare/v1.13.0...v1.13.1) (2026-05-25)


### Bug Fixes

* **auth:** fix Firebase reCAPTCHA CSP block and remove confusing fallback banner ([25ca3fa](https://github.com/Kolanupaka92/petclub-app/commit/25ca3fadf1ef32c3fcbb14d60cd45ea5847cb218))

# [1.13.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.12.0...v1.13.0) (2026-05-25)


### Bug Fixes

* **admin:** always show ₹ in admin dashboard — PETclub operates in INR only ([074413f](https://github.com/Kolanupaka92/petclub-app/commit/074413ff07e525e6061e1e8ecaf46958c732361d))
* **security:** add comprehensive CSP + security headers to Vercel deployment ([ec8e849](https://github.com/Kolanupaka92/petclub-app/commit/ec8e849e9b51d01d2d632939245e17019f0351a9))
* **security:** handle JWT expiry — auto-logout on 401 + 7-day session awareness ([44db9b3](https://github.com/Kolanupaka92/petclub-app/commit/44db9b356b3ad753dcebdcb69dd4144ae5163ba0))


### Features

* **admin:** add Loyalty Points management tab to admin dashboard ([efe90bd](https://github.com/Kolanupaka92/petclub-app/commit/efe90bdc83b2954c1dea729f0e8389e0b76d7ee4))
* **billing:** update all UI labels from 70/30 to 45/55 split ([6ee373e](https://github.com/Kolanupaka92/petclub-app/commit/6ee373e4901928991365ce89771e159cd0568b13))
* **partner:** add Partner Network Agreement clickwrap in signup + compensation card in earnings screen ([9511c06](https://github.com/Kolanupaka92/petclub-app/commit/9511c069319b8ad310f51d02d3225525ef14eb15))

# [1.12.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.11.0...v1.12.0) (2026-05-24)


### Features

* referral/partner field at sign-up and api helpers ([4a8cf76](https://github.com/Kolanupaka92/petclub-app/commit/4a8cf7632b70b64d85d222876c5179f1dfe4930a))

# [1.11.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.10.0...v1.11.0) (2026-05-23)


### Features

* **booking:** clickwrap T&C checkbox in booking confirm step ([c2c75b5](https://github.com/Kolanupaka92/petclub-app/commit/c2c75b530a2dfa58545d7e1a020553d2a44b694d))

# [1.10.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.9.1...v1.10.0) (2026-05-23)


### Features

* **loyalty:** welcome modal and How it Works explainer ([55e9388](https://github.com/Kolanupaka92/petclub-app/commit/55e938882ed97b48511c70163b3b1fe496cde986))

## [1.9.1](https://github.com/Kolanupaka92/petclub-app/compare/v1.9.0...v1.9.1) (2026-05-23)


### Bug Fixes

* **loyalty:** pending credits UI, coupon apply at checkout, hardening fixes ([4c8cd23](https://github.com/Kolanupaka92/petclub-app/commit/4c8cd239e588f693f3444686ab325b276823b78c))

# [1.9.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.8.0...v1.9.0) (2026-05-23)


### Features

* **loyalty:** add loyalty credits dashboard to customer profile tab ([c35e31a](https://github.com/Kolanupaka92/petclub-app/commit/c35e31a6c9b5d1043e2d6109e3f48ffbf2f26776))

# [1.8.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.7.2...v1.8.0) (2026-05-23)


### Features

* **booking:** add structured service catalog with tiered pricing and add-ons ([de86fee](https://github.com/Kolanupaka92/petclub-app/commit/de86feef1f72df391e29924bc44ba4bda3f9e5f1))

## [1.7.2](https://github.com/Kolanupaka92/petclub-app/compare/v1.7.1...v1.7.2) (2026-05-23)


### Bug Fixes

* **bookings:** add missing statusMap entries for completed/cancelled/pending ([50c8827](https://github.com/Kolanupaka92/petclub-app/commit/50c8827a8aebedd9baa16fb7cb60591e0a69345f))

## [1.7.1](https://github.com/Kolanupaka92/petclub-app/compare/v1.7.0...v1.7.1) (2026-05-23)


### Bug Fixes

* **provider-flow:** 3 onboarding bugs ([3152286](https://github.com/Kolanupaka92/petclub-app/commit/3152286246a69d98d583e4d7bbe0a931996b4e3a))

# [1.7.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.6.1...v1.7.0) (2026-05-23)


### Features

* **admin:** auto-refresh Platform Status widget every 60 s ([df385f5](https://github.com/Kolanupaka92/petclub-app/commit/df385f5a54040e1725e802f0cdeb57319d23a79e))

## [1.6.1](https://github.com/Kolanupaka92/petclub-app/compare/v1.6.0...v1.6.1) (2026-05-23)


### Bug Fixes

* **admin:** platform status widget shows real service states via /admin/health ([0103da5](https://github.com/Kolanupaka92/petclub-app/commit/0103da5454d8ec7922033c865c0a372a3d38f0a9))

# [1.6.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.5.4...v1.6.0) (2026-05-23)


### Features

* **auth:** route all phone OTP through Firebase (India + USA) ([9f00f25](https://github.com/Kolanupaka92/petclub-app/commit/9f00f2588b3ff0e3e9ca4f6b64190c870901ec8d))

## [1.5.4](https://github.com/Kolanupaka92/petclub-app/compare/v1.5.3...v1.5.4) (2026-05-23)


### Bug Fixes

* **auth:** handle email fallback OTP response from backend ([535b5a5](https://github.com/Kolanupaka92/petclub-app/commit/535b5a5bcd2335243e3d8e956533a74ab6e6d553))

## [1.5.3](https://github.com/Kolanupaka92/petclub-app/compare/v1.5.2...v1.5.3) (2026-05-23)


### Bug Fixes

* **auth:** fall back to Twilio OTP when Firebase phone auth is unavailable ([1b7026d](https://github.com/Kolanupaka92/petclub-app/commit/1b7026d5ce98e4ef644fa100dc5645e8a909dfb3))

## [1.5.2](https://github.com/Kolanupaka92/petclub-app/compare/v1.5.1...v1.5.2) (2026-05-23)


### Bug Fixes

* **auth:** show customer profile form when Sign In lands on pending_role user ([b7c3f2f](https://github.com/Kolanupaka92/petclub-app/commit/b7c3f2f6494cdb2f29067075417c3b37aec73479))

## [1.5.1](https://github.com/Kolanupaka92/petclub-app/compare/v1.5.0...v1.5.1) (2026-05-23)


### Bug Fixes

* strip UTF-8 BOM from VITE_API_URL in AddressPicker and TrackingMap components ([6602362](https://github.com/Kolanupaka92/petclub-app/commit/660236238768bb376c1739420f915dd4138ca38b))

# [1.5.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.4.0...v1.5.0) (2026-05-23)


### Features

* **tracking:** dual-map regional split — Mappls (India) + Mapbox (USA) ([3a25a38](https://github.com/Kolanupaka92/petclub-app/commit/3a25a385b90b8e0a56866d78240153f47e9c052e))

# [1.4.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.3.3...v1.4.0) (2026-05-23)


### Features

* **assets:** add email-logo.png for transactional email header ([ae0e886](https://github.com/Kolanupaka92/petclub-app/commit/ae0e886698e0fbdc31be50149ed5221c4c9c0b28))

## [1.3.3](https://github.com/Kolanupaka92/petclub-app/compare/v1.3.2...v1.3.3) (2026-05-23)


### Bug Fixes

* **ci:** remove auth route probe from frontend smoke test ([c883c09](https://github.com/Kolanupaka92/petclub-app/commit/c883c09c815318fbfcb70d7c53b556d9da00db02))

## [1.3.2](https://github.com/Kolanupaka92/petclub-app/compare/v1.3.1...v1.3.2) (2026-05-23)


### Bug Fixes

* **ci:** correct smoke-test health check and auth route probe ([1441bf7](https://github.com/Kolanupaka92/petclub-app/commit/1441bf7fbbf5ea1ec7c82aa91e321872c05635ce))

## [1.3.1](https://github.com/Kolanupaka92/petclub-app/compare/v1.3.0...v1.3.1) (2026-05-22)


### Bug Fixes

* **auth:** strip accidental country-code prefix from pasted phone numbers ([ef18abd](https://github.com/Kolanupaka92/petclub-app/commit/ef18abd39dd71141a7bc9d8c062476a4263f13e4))

# [1.3.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.2.0...v1.3.0) (2026-05-22)


### Features

* **auth:** dual-route SMS — India via Firebase, US via Twilio ([c20d455](https://github.com/Kolanupaka92/petclub-app/commit/c20d4552a0255e0c7b382b749879b62ea64a96ce))

# [1.2.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.1.1...v1.2.0) (2026-05-22)


### Features

* switch phone auth from Firebase reCAPTCHA to backend Twilio SMS OTP ([7de8377](https://github.com/Kolanupaka92/petclub-app/commit/7de8377b4cf1804fc0f40cd98e436b0270df482f))

## [1.1.1](https://github.com/Kolanupaka92/petclub-app/compare/v1.1.0...v1.1.1) (2026-05-22)


### Bug Fixes

* **auth:** graceful phone OTP fallback when Firebase domain not authorized ([5bd3f0c](https://github.com/Kolanupaka92/petclub-app/commit/5bd3f0c0d50d2be7f5630544b48f3e1fb1ce20b7))

# [1.1.0](https://github.com/Kolanupaka92/petclub-app/compare/v1.0.1...v1.1.0) (2026-05-22)


### Features

* pro booking flow — Start Service, Mark Complete, accurate status badges ([060761a](https://github.com/Kolanupaka92/petclub-app/commit/060761a220145ff4dfb284a33b0cfb7345d1a667))

## [1.0.1](https://github.com/Kolanupaka92/petclub-app/compare/v1.0.0...v1.0.1) (2026-05-22)


### Bug Fixes

* **admin:** correct plural typo on Clean Up button — 'categoryy' → 'category' ([50d7bd3](https://github.com/Kolanupaka92/petclub-app/commit/50d7bd3304c4c249d3049e1672baec80e4c183eb))

# 1.0.0 (2026-05-22)


### Bug Fixes

* AddressPicker fixed-position dropdown, GPS raw-coord rejection, email typo catch-all, profile save unblocked ([9c82445](https://github.com/Kolanupaka92/petclub-app/commit/9c8244538c4bae9addccb081080a3ce34de7a444))
* AddressPicker uses React Portal - dropdown works in any modal ([8957c69](https://github.com/Kolanupaka92/petclub-app/commit/8957c69996a43015ee12f4c4df6ee7fdca63d0cb))
* **api:** strip UTF-8 BOM from VITE_API_URL env var ([25cab2b](https://github.com/Kolanupaka92/petclub-app/commit/25cab2bc58437d1815f1d7d4f9c13fac9d7f2b56))
* architecture fixes — subRole in session, suspended user block, status refresh, booking ownership ([cf13e03](https://github.com/Kolanupaka92/petclub-app/commit/cf13e0319b1888f09885fbdc26866c690dfce148))
* **audit:** env-var Terms/Privacy URLs, IDB token cleanup on logout, .env.example updates ([dd57c70](https://github.com/Kolanupaka92/petclub-app/commit/dd57c70a71ffd62ba885445299428c5ba4b12a89))
* **auth:** don't clear _confirmationResult when advancing to OTP step ([f02d694](https://github.com/Kolanupaka92/petclub-app/commit/f02d6944944ba07fce049155d95192f5613a5a41))
* **auth:** remove reCAPTCHA render timeout + add phone retry button ([26aa5b1](https://github.com/Kolanupaka92/petclub-app/commit/26aa5b1860a4d079b7e6e291b3ac0a2c60833bc7))
* **auth:** replace reCAPTCHA container entirely to clear Google's internal registry ([fbf79c5](https://github.com/Kolanupaka92/petclub-app/commit/fbf79c57625c118cae6720c06091e0634491751d)), closes [#recaptcha-container](https://github.com/Kolanupaka92/petclub-app/issues/recaptcha-container)
* **auth:** show real Firebase error instead of stripped 'Error.' ([152b24a](https://github.com/Kolanupaka92/petclub-app/commit/152b24a01a3a790c677e98a117db07798827901f))
* **auth:** strip BOM from Firebase env vars + add missing-key diagnostics ([dcea99f](https://github.com/Kolanupaka92/petclub-app/commit/dcea99f665259d2e695936a96463528f5787f416))
* **auth:** wipe reCAPTCHA DOM on clear/reinit — fixes 'already rendered' crash ([2203018](https://github.com/Kolanupaka92/petclub-app/commit/2203018089fb787d8cceb485e3c471bdb3abef05)), closes [#recaptcha-container](https://github.com/Kolanupaka92/petclub-app/issues/recaptcha-container)
* block Firebase SDK fetch interception + auto-recover from stale SW 405 ([4670626](https://github.com/Kolanupaka92/petclub-app/commit/4670626e8165ea8c36c10a4e0e973cb3a3f3964f))
* **cache:** set correct Cache-Control headers — no-cache for index.html, immutable for hashed assets ([acc6532](https://github.com/Kolanupaka92/petclub-app/commit/acc6532139597fc55a556017296d80f74ea70bf6))
* country picker dropdown visibility + India email-only OTP ([39633a1](https://github.com/Kolanupaka92/petclub-app/commit/39633a1ca0249b2bc99027b464824d018490724a))
* **deps:** regenerate package-lock.json to include semantic-release packages ([2fc9f91](https://github.com/Kolanupaka92/petclub-app/commit/2fc9f91d3a7f9c5ff837d2b705785ce2fd537af2))
* email regex falsely flagging .com — revert to exact lookup only; portal uses position:fixed ([6675b6c](https://github.com/Kolanupaka92/petclub-app/commit/6675b6ce0eddcc4975e00e9163319000772fdb26))
* email validation + AddressPicker enforcement in Edit Profile modal ([ac326e8](https://github.com/Kolanupaka92/petclub-app/commit/ac326e8dadd592130c5d4ac825c6226cfca3b764))
* force SW self-update (skipWaiting + claim) + api error includes URL ([3d38dd5](https://github.com/Kolanupaka92/petclub-app/commit/3d38dd580c1ad93b04a55e3291dfaa2f02b2306b))
* make Sign Up path obvious on login screen ([3638ddb](https://github.com/Kolanupaka92/petclub-app/commit/3638ddb76d043dc3a77d64801df952f942f37596))
* phone auth QA overhaul + 8 app bug fixes + sign-in deep link ([05d78a2](https://github.com/Kolanupaka92/petclub-app/commit/05d78a2732fe5f97d6faa274c64c682e76dee9d0))
* point API fallback URL to Cloud Run backend ([4695662](https://github.com/Kolanupaka92/petclub-app/commit/4695662824ad7fc3d7e09e4e0bc8b398eb1dd156))
* remove overflow-hidden so country dropdown isn't clipped ([f2dfb5e](https://github.com/Kolanupaka92/petclub-app/commit/f2dfb5ea2654e9c313f87ee6ca1ed896069037e3))
* resolve QA-identified bugs across all three user flows ([7ea79de](https://github.com/Kolanupaka92/petclub-app/commit/7ea79deacbc0c9745fceff4bd3f0d95683a7641c))
* restore api.mypetclub.app — SSL cert now live ([3b8f6ec](https://github.com/Kolanupaka92/petclub-app/commit/3b8f6ec5f341e8cc24062b6c539037eea545c634))
* restore api.mypetclub.app as backend URL ([f328a08](https://github.com/Kolanupaka92/petclub-app/commit/f328a08b9af9e42bf574d79922dc1fefe9d1c1f4))
* **security:** audit fixes — AddressPicker token key, API URL dev guard, Razorpay logo URL ([d6473c1](https://github.com/Kolanupaka92/petclub-app/commit/d6473c13202fb2b890d4f86593e2754cc884f6d7))
* unregister all stale service workers on unauthenticated app load ([e493b7e](https://github.com/Kolanupaka92/petclub-app/commit/e493b7eeec7d9cd9fc8478cb48537b25fba35080))
* use direct Cloud Run URL while api.mypetclub.app SSL provisions ([668a170](https://github.com/Kolanupaka92/petclub-app/commit/668a170db96aa47d6d490c6fa0fd6bba99824d68))
* use POST /admin/users/:id/edit instead of PATCH (proxy-safe) ([f5d4ee8](https://github.com/Kolanupaka92/petclub-app/commit/f5d4ee8c27db0ad5c06b677e8a2e0ff780f88aed))


### Features

* add customer sign-up flow, full API integration, portal picker ([73908c5](https://github.com/Kolanupaka92/petclub-app/commit/73908c5b7a8ef7f68128f6c6557635ed7909ad6d))
* AddressPicker routes geocoding through backend gateway ([bfcdd00](https://github.com/Kolanupaka92/petclub-app/commit/bfcdd00cf64f9f381c8841a04bccd0c7bc65d00b))
* admin live tracking panel with GPS coordinates and route links ([d74c1cb](https://github.com/Kolanupaka92/petclub-app/commit/d74c1cb0b78c65512580c111c3a9471cd04168c9))
* **admin:** add DB Health tab with audit + one-click cleanup ([bb34792](https://github.com/Kolanupaka92/petclub-app/commit/bb347925210343c6a6e6ac71c2cea295ec2c1092))
* **admin:** add Purge All Suspended button to users panel ([1beb0f5](https://github.com/Kolanupaka92/petclub-app/commit/1beb0f5588cbe882a78b27f6889e58754694a863))
* **admin:** confirmation modals, batch actions, pagination, real-time timers, role popover ([3efd2d1](https://github.com/Kolanupaka92/petclub-app/commit/3efd2d17f16d81a4cc9de6bb08de518b3b4df26c)), closes [#root](https://github.com/Kolanupaka92/petclub-app/issues/root)
* capture and save GPS coordinates from address picker ([174e6c5](https://github.com/Kolanupaka92/petclub-app/commit/174e6c5a3734a08932162d19d3bf209ee6b13ddf))
* differentiated signup flows + email OTP fallback + ID upload ([de1918d](https://github.com/Kolanupaka92/petclub-app/commit/de1918d6f7e967a62c2618ae763b66ebfdce2127))
* dual-market landing page, global SEO metadata, trust banner, pro onboarding copy ([d3c13b9](https://github.com/Kolanupaka92/petclub-app/commit/d3c13b97287cc028b16567be6f62fc661fabec19))
* dynamic currency symbol based on user's phone country code ([7f81d42](https://github.com/Kolanupaka92/petclub-app/commit/7f81d42f4ba6277b8ebeedcc87ab4e6c7bd46106))
* enhanced customer profiles + full pet management ([c3339fa](https://github.com/Kolanupaka92/petclub-app/commit/c3339fa343dfab53aebeb30f40efeca641c73236))
* full address support in customer profile ([0d48ab4](https://github.com/Kolanupaka92/petclub-app/commit/0d48ab4853d69e548bf9d0fd8f9675a0f1460f2b))
* GitHub Actions CI, watchPosition GPS, address validation enforcement, AddressPicker hard-block ([507cfef](https://github.com/Kolanupaka92/petclub-app/commit/507cfef89bc1e03a2402f774d8291869c99c1673))
* GPS inline errors, address geocoding enforcement, On My Way tracking, admin user edit ([fe4f742](https://github.com/Kolanupaka92/petclub-app/commit/fe4f74275b6a5cea241ea18f293683a7d059c983))
* Mapbox address autocomplete, live GPS tracking, full UI overhaul ([439358d](https://github.com/Kolanupaka92/petclub-app/commit/439358d46d111157481a0c474648f5154eb2e214))
* pet health notes, ID upload admin alert, 70km GPS radius dispatch ([88c57f2](https://github.com/Kolanupaka92/petclub-app/commit/88c57f2e932e6c123afa1fe7ac5055de297c2718))
* **phase1:** availability toggle, ratings, SMS, smart polling, skeletons ([d640ac4](https://github.com/Kolanupaka92/petclub-app/commit/d640ac4db77214035a834c9d1846313de7eac681))
* premium UI redesign — Pro/Admin dashboards, customer app, login ([813bdbe](https://github.com/Kolanupaka92/petclub-app/commit/813bdbec9b03302be386a04dbcf79796db156b89))
* professional specialization tags (pet types), services shown in pending panel ([c81f86e](https://github.com/Kolanupaka92/petclub-app/commit/c81f86e823d2681106b362f8525b230a4379120e))
* PWA manifest hardening + Screen Wake Lock + Background Sync GPS buffering ([19485d1](https://github.com/Kolanupaka92/petclub-app/commit/19485d1a76b97b7943c2c6d24233d08e7bc04347))
* redesign login with country picker dropdown & email OTP fallback ([6f806eb](https://github.com/Kolanupaka92/petclub-app/commit/6f806ebacc7e269db6db873176bb7c35378b5a47))
* redesign login with Sign In / Create Account split flow ([f45e964](https://github.com/Kolanupaka92/petclub-app/commit/f45e964b9973d6ce152be351735944e4e150d966))
* **release:** add semantic-release CI/CD with version display ([d42df4f](https://github.com/Kolanupaka92/petclub-app/commit/d42df4fdeff28880e91b6dabaf08d812ea2a0914))
* revenue split UI — pro earnings tab, admin breakdown, customer receipt ([2faa794](https://github.com/Kolanupaka92/petclub-app/commit/2faa794cf201203a6a14f63b13afaaff51e0b5d8))
* role-specific professional profiles + 4-step onboarding + country-aware govt ID ([0b42e95](https://github.com/Kolanupaka92/petclub-app/commit/0b42e95825e5083378c80053daa1c372c1f49534))
* Uber-style booking dispatch — round-robin, Accept/Reject, payments ([89eca95](https://github.com/Kolanupaka92/petclub-app/commit/89eca95d8b71dd60c1d7627732e28fd8957a494c))
