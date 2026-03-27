# [1.6.0](https://github.com/MarcoVegaR/olpuv2/compare/v1.5.1...v1.6.0) (2026-03-27)

### Features

- implement scalable solicitante search with best practices ([8a1c170](https://github.com/MarcoVegaR/olpuv2/commit/8a1c1706aec964c333515c7375be1363b17eb9af))

## [1.5.1](https://github.com/MarcoVegaR/olpuv2/compare/v1.5.0...v1.5.1) (2026-03-27)

### Bug Fixes

- remove restrictive search condition that blocked all solicitante searches ([c601998](https://github.com/MarcoVegaR/olpuv2/commit/c6019987372f269d90d4cc26a5c926fe00012dac))

# [1.5.0](https://github.com/MarcoVegaR/olpuv2/compare/v1.4.1...v1.5.0) (2026-03-27)

### Features

- improve solicitante search with scalable remote typeahead ([81d272d](https://github.com/MarcoVegaR/olpuv2/commit/81d272dc8c5931aadf46082ae13faf6f15f16ab1))

## [1.4.1](https://github.com/MarcoVegaR/olpuv2/compare/v1.4.0...v1.4.1) (2026-03-06)

### Bug Fixes

- stabilize expediente workflow ui and decision flow ([f7789b3](https://github.com/MarcoVegaR/olpuv2/commit/f7789b3cbbb5e55410ff0e171beb3508abab237e))

# [1.4.0](https://github.com/MarcoVegaR/olpuv2/compare/v1.3.0...v1.4.0) (2026-03-05)

### Features

- mejoras en flujo de expedientes y validaciones ([ec91090](https://github.com/MarcoVegaR/olpuv2/commit/ec9109076917c356485ee088bceaab4d917e8664))

# [1.3.0](https://github.com/MarcoVegaR/olpuv2/compare/v1.2.4...v1.3.0) (2026-02-19)

### Features

- **expedientes:** improve reception and inspection upload UX ([27ea706](https://github.com/MarcoVegaR/olpuv2/commit/27ea70639f2b20373558406bdddc8f6a8f3b9ae2))

## [1.2.4](https://github.com/MarcoVegaR/olpuv2/compare/v1.2.3...v1.2.4) (2026-02-12)

### Bug Fixes

- prevent ValidationException from being caught as 500 in production ([39b011d](https://github.com/MarcoVegaR/olpuv2/commit/39b011da3b89969f828d6b1f6d6a53a62e6e9373))

## [1.2.3](https://github.com/MarcoVegaR/olpuv2/compare/v1.2.2...v1.2.3) (2026-02-12)

### Bug Fixes

- use correct page.props.ziggy path in SSR setup ([e15caca](https://github.com/MarcoVegaR/olpuv2/commit/e15caca23bce876e9cb8156a0e8ddbc80c8223fe))

## [1.2.2](https://github.com/MarcoVegaR/olpuv2/compare/v1.2.1...v1.2.2) (2026-02-12)

### Bug Fixes

- add Ziggy route() setup to SSR entry point ([8ba2c05](https://github.com/MarcoVegaR/olpuv2/commit/8ba2c0564f7ae8065916db826252dfdc1254935e))

## [1.2.1](https://github.com/MarcoVegaR/olpuv2/compare/v1.2.0...v1.2.1) (2026-02-12)

### Bug Fixes

- guard window.matchMedia for SSR compatibility in use-appearance hook ([41d609b](https://github.com/MarcoVegaR/olpuv2/commit/41d609b015c98278d544a66e4e31695953fea656))

# [1.2.0](https://github.com/MarcoVegaR/olpuv2/compare/v1.1.0...v1.2.0) (2026-02-12)

### Features

- expediente UI improvements - file previews, edit capability, index refinements ([e02fc36](https://github.com/MarcoVegaR/olpuv2/commit/e02fc36ab9bdd0f003506f700e46794a84e86ee5))

# [1.1.0](https://github.com/MarcoVegaR/olpuv2/compare/v1.0.0...v1.1.0) (2026-02-11)

### Features

- implement dashboard, expedientes, solicitantes and public modules ([7fcf7dc](https://github.com/MarcoVegaR/olpuv2/commit/7fcf7dce76f6bfadd71c68a327444edf1796f4d5))

# 1.0.0 (2026-02-02)

### Features

- **catalogs:** procedures catalog (types + requirements) ([a584f66](https://github.com/MarcoVegaR/olpuv2/commit/a584f664db5fba34b41de8540e81178826075461))

# [1.9.0](https://github.com/MarcoVegaR/boilerplate-laravel12/compare/v1.8.0...v1.9.0) (2025-09-13)

### Features

- **catalog:** dynamic FE from --fields; add labels; fix generator; update docs ([ec85a2d](https://github.com/MarcoVegaR/boilerplate-laravel12/commit/ec85a2d86e860d04cec804d85a20dcf7a8d0786d))

# [1.8.0](https://github.com/MarcoVegaR/boilerplate-laravel12/compare/v1.7.0...v1.8.0) (2025-09-11)

### Features

- **security:** 2FA UX and sessions device icons + GeoIP ([cc5e5d5](https://github.com/MarcoVegaR/boilerplate-laravel12/commit/cc5e5d5e72ab71d8eac6ba900a86e44a35373ed5))

# [1.7.0](https://github.com/MarcoVegaR/boilerplate-laravel12/compare/v1.6.1...v1.7.0) (2025-09-09)

### Features

- **artisan:** add make:catalog generator with bindings, policies, FE stubs ([f16158c](https://github.com/MarcoVegaR/boilerplate-laravel12/commit/f16158cd783300c1b170792022c28b05df61c2a7))

## [1.6.1](https://github.com/MarcoVegaR/boilerplate-laravel12/compare/v1.6.0...v1.6.1) (2025-09-08)

### Bug Fixes

- **auditoria:** prevent reload loop when filtering ([6d818c1](https://github.com/MarcoVegaR/boilerplate-laravel12/commit/6d818c1673ec24093230cdb38424844022a9b184))

# [1.6.0](https://github.com/MarcoVegaR/boilerplate-laravel12/compare/v1.5.0...v1.6.0) (2025-09-07)

### Features

- **footer:** add fixed AppFooter with sidebar-aware offset; docs legal links; tests + lint/format ([e9459f6](https://github.com/MarcoVegaR/boilerplate-laravel12/commit/e9459f625cc59cf72787195c2290cd3e9a5b8a76))

# [1.5.0](https://github.com/MarcoVegaR/boilerplate-laravel12/compare/v1.4.0...v1.5.0) (2025-09-07)

### Features

- **settings,playground:** modernize settings UI and enforce strong password policy ([5950700](https://github.com/MarcoVegaR/boilerplate-laravel12/commit/5950700bddbc1d495a7e6dcdf61195896f6f4922))

# [1.4.0](https://github.com/MarcoVegaR/boilerplate-laravel12/compare/v1.3.0...v1.4.0) (2025-09-07)

### Features

- **forms:** centralize form patterns and improve UX/a11y ([72b9ef8](https://github.com/MarcoVegaR/boilerplate-laravel12/commit/72b9ef8543f81f37193b0bb44a72e38bd8d353db))

# [1.3.0](https://github.com/MarcoVegaR/boilerplate-laravel12/compare/v1.2.2...v1.3.0) (2025-09-06)

### Features

- **docs:** add user manual and nav ([9fcbf11](https://github.com/MarcoVegaR/boilerplate-laravel12/commit/9fcbf11635b69ed02c94692d3167d7958d2452d8))

## [1.2.2](https://github.com/MarcoVegaR/boilerplate-laravel12/compare/v1.2.1...v1.2.2) (2025-09-05)

### Bug Fixes

- resolve PHPStan errors; normalize requests; apply Pint/Prettier; tests pass ([2fae293](https://github.com/MarcoVegaR/boilerplate-laravel12/commit/2fae29321a9ebda3e61fda6e74b3eb3f0b6644a2))

## [1.2.1](https://github.com/MarcoVegaR/boilerplate-laravel12/compare/v1.2.0...v1.2.1) (2025-09-03)

### Bug Fixes

- **roles:** always show Edit if user can update ([9ef2bba](https://github.com/MarcoVegaR/boilerplate-laravel12/commit/9ef2bba02d20718c2a769d0696e87d183a91a3e8))

# [1.2.0](https://github.com/MarcoVegaR/boilerplate-laravel12/compare/v1.1.0...v1.2.0) (2025-09-01)

### Features

- implement bulk role activation/deactivation with improved UI ([c112807](https://github.com/MarcoVegaR/boilerplate-laravel12/commit/c1128073a24563831791ecb5421a65b850b5de12))

# [1.1.0](https://github.com/MarcoVegaR/boilerplate-laravel12/compare/v1.0.2...v1.1.0) (2025-08-31)

### Features

- **roles:** usuarios popover y colores de iconos en export y filtros ([1ed569c](https://github.com/MarcoVegaR/boilerplate-laravel12/commit/1ed569c15165dc257436f807c484597a4338cf36))

## [1.0.2](https://github.com/MarcoVegaR/boilerplate-laravel12/compare/v1.0.1...v1.0.2) (2025-08-28)

### Bug Fixes

- **ci:** agregar archivos frontend faltantes para tests CI ([3cc2b17](https://github.com/MarcoVegaR/boilerplate-laravel12/commit/3cc2b17a9a84b261aebb9d67051cc717d84b5510))
- **ci:** corregir convención lowercase para páginas de error ([eaec9aa](https://github.com/MarcoVegaR/boilerplate-laravel12/commit/eaec9aa97d5f4a33a70226b5e9da4f01ce35a3b2))

## [1.0.1](https://github.com/MarcoVegaR/boilerplate-laravel12/compare/v1.0.0...v1.0.1) (2025-08-28)

### Bug Fixes

- **phpstan:** corregir errores de análisis estático y pruebas ([b1fd3b8](https://github.com/MarcoVegaR/boilerplate-laravel12/commit/b1fd3b8c584989df6b19c0d5238547f46226a566))

# 1.0.0 (2025-08-27)

### Bug Fixes

- **frontend:** resolve TS errors; update export/delete services and docs ([dd091fc](https://github.com/MarcoVegaR/boilerplate-laravel12/commit/dd091fcb0c5b0a69654a73ffca7437f4daa336d0))
- **release:** remove changelog notes from commit to comply with 100-char limit ([1d00cea](https://github.com/MarcoVegaR/boilerplate-laravel12/commit/1d00cea466b090649a50ee6f808c72f27c204776))
