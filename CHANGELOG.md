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
