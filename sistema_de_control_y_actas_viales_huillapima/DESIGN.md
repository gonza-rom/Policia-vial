---
name: Sistema de Control y Actas Viales Huillapima
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#44474e'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#75777e'
  outline-variant: '#c4c6ce'
  surface-tint: '#4c5f80'
  primary: '#000b21'
  on-primary: '#ffffff'
  primary-container: '#0d2240'
  on-primary-container: '#778aad'
  inverse-primary: '#b4c7ed'
  secondary: '#006398'
  on-secondary: '#ffffff'
  secondary-container: '#5bb8fe'
  on-secondary-container: '#00476e'
  tertiary: '#220001'
  on-tertiary: '#ffffff'
  tertiary-container: '#4d0003'
  on-tertiary-container: '#fe403a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#b4c7ed'
  on-primary-fixed: '#051b39'
  on-primary-fixed-variant: '#344767'
  secondary-fixed: '#cce5ff'
  secondary-fixed-dim: '#93ccff'
  on-secondary-fixed: '#001d31'
  on-secondary-fixed-variant: '#004b73'
  tertiary-fixed: '#ffdad6'
  tertiary-fixed-dim: '#ffb4ab'
  on-tertiary-fixed: '#410002'
  on-tertiary-fixed-variant: '#93000b'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  display-lg:
    fontFamily: Public Sans
    fontSize: 30px
    fontWeight: '800'
    lineHeight: 38px
  headline-lg:
    fontFamily: Public Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Public Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  headline-sm:
    fontFamily: Public Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Public Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Public Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 18px
    letterSpacing: 0.05em
  label-md:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.06em
  code-num:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 22px
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  touch-min: 48px
  pad-xs: 4px
  pad-sm: 8px
  pad-md: 12px
  pad-lg: 16px
  pad-xl: 24px
  pad-2xl: 32px
  gutter-mobile: 16px
  gutter-tablet: 24px
---

## Brand & Style

This design system establishes an authoritative, reliable, and ergonomically rugged municipal identity for road safety agents, transit officers, and checkpoint inspectors (Puesto Caminero) of the Municipalidad de Huillapima (Capayán, Catamarca, Argentina). Field operations occur along open highways under high-glare sunlight, dust, and variable weather, demanding immediate clarity, zero visual ambiguity, and high cognitive ergonomics.

The visual style blends **Corporate / Modern Governmental** formality with **High-Contrast Utilitarian Ergonomics**. The identity communicates institutional legitimacy, legal certainty, and operational speed. It modernizes the traditional carbon-copy *Acta de Comprobación* into rapid tap-friendly digital workflows: digitizing driver details, vehicle registration, and infraction checkboxes into streamlined forms that can be operated comfortably with one hand or with gloved field gear.

## Colors

The palette is engineered for high daylight legibility, rapid status differentiation, and strict governmental authority:

- **Primary (`#0D2240` - Deep Navy Blue):** Represents municipal sovereignty, law enforcement, and administrative solidity. Used for top app bars, primary identity headers, active navigation states, and primary call-to-action buttons.
- **Secondary (`#0284C7` - Institutional Cyan/Teal Blue):** Provides a crisp, modern operational accent. Used for interactive focus rings, active step indicators, filter pills, and informational callouts.
- **Tertiary (`#DC2626` - Infraction Alert Red / Warning Amber `#D97706`):** Reserved strictly for critical statutory infractions, severe legal violations (e.g., Alcoholemia positiva, Darse a la fuga), validation errors, and vehicle retention alerts.
- **Neutral (`#1E293B` - Deep Slate):** Delivers superior contrast against crisp white and pale slate-tinted canvas backgrounds (`#F8FAFC`). Prevents eye strain during prolonged screen exposure under daylight glare.
- **Surface Foundations:** Background layers utilize clean, high-contrast off-whites (`#F1F5F9`, `#FFFFFF`) with crisp boundary lines (`#CBD5E1`) ensuring each table, field, or verification block mirrors the legal precision of official records.

## Typography

The typography pairs **Public Sans**—an institutional, robust, and highly legible grotesque typeface designed for public administration—with **Space Grotesk** for structured data, badge codes, ticket IDs, and vehicle license plates (`Dominio`).

- **Official Document Hierarchy:** Section heads and legal declarations use uppercase or semi-bold weights of Public Sans, evoking the structured authority of physical citation pads (*Actas de Comprobación*).
- **Legibility in the Field:** Space Grotesk provides fixed visual clarity for license plates, DNI numbers, and official ordinance citations (e.g., `CD N° 385/2012`), eliminating ambiguity between `O` and `0`, or `I` and `1`.
- **Text Sizing:** Text never drops below 11px. Minimum body text for field inputs is fixed at 14px to prevent inadvertent zooming on mobile touchscreens and ensure swift data entry during active traffic stops.

## Layout & Spacing

Field operations require an ergonomic layout tailored for rapid hand-held entry:

- **Touch Targets:** Every interactive chip, checkbox, and primary action adheres to a strict minimum hit area of 48×48px.
- **Single-Column Form Flow:** Mobile layouts enforce a strictly vertical, distraction-free single-column sequence for capturing driver and vehicle credentials (DNI, Licencia, Dominio, Titular). Multi-column splits are reserved exclusively for compact two-column key-value summary receipts and tablet dashboards.
- **Sticky Field Controls:** Critical workflow progression (e.g., *Emitir Acta*, *Firmar*, *Generar Comprobante*) remains anchored to the screen footer via a safe-area-padded sticky dock.
- **Rhythm & Padding:** Baseline grid relies on an 8px unit (with 4px sub-steps for dense metadata rows). Form groupings use 16px internal padding and 24px section margins to cleanly isolate legal clauses and operational fields.

## Elevation & Depth

This design system avoids heavy blurred shadows and decorative glassmorphism, which degrade severely under intense sunlight and increase battery drain on rugged handheld devices.

- **Crisp Structural Borders:** Visual layering relies primarily on high-contrast 1px and 1.5px architectural borders (`#CBD5E1` and `#0D2240`) that segment information into discrete, ledger-like panels.
- **Tonal Stepping:** Surfaces elevate through stepped neutral containers: Base Canvas (`#F8FAFC`), Surface Level 1 (`#FFFFFF`), and Surface Interactive (`#EDF2F7`).
- **Functional Elevation:** Subtle ambient elevation (`0 1px 3px rgba(13, 34, 64, 0.08)`) is applied exclusively to floating action bars and modal confirmation sheets to indicate priority over static legal forms.

## Shapes

The design system employs a **Soft (`1`)** roundedness profile:
- Elements default to `4px` (`rounded-sm` / `rounded-md` up to `6px`) corner radius.
- Cards, form fieldsets, and infraction group containers utilize crisp 6px radii to maintain an institutional, ledger-like precision without appearing aggressively sharp or playful.
- Chips and badges retain neat, functional 4px rounded rectangles rather than full pills, preserving high horizontal space efficiency for long Spanish infraction descriptions.

## Components

### 1. Header & Acta Number Banner
- **Municipal Header:** Displays the crest/coat-of-arms anchor, "MUNICIPALIDAD DE HUILLAPIMA - DIRECCIÓN DE TRÁNSITO", accompanied by a high-contrast Space Grotesk badge displaying the pre-printed or digital serial number: `ACTA N° 00029620`.
- Background in solid `#0D2240` with white text for immediate authority.

### 2. Form Inputs & Inspection Fields
- **Data Boxes:** Styled after governmental ledger fields. Inset top labels in 11px uppercase bold (`APELLIDO Y NOMBRE`, `D.N.I. N°`, `DOMINIO`, `EXPEDIDO POR`).
- Crisp 1.5px borders in slate (`#94A3B8`), focusing to high-contrast cyan (`#0284C7`) with a 2px outer outline.
- Integrated camera/scan shortcut button inside the license plate field to parse physical documentation instantly.

### 3. Infraction Selection Chips (Checklist Matrix)
- Translates the physical paper grid ("Conducir Sin Licencia", "Cédula Verde", "Seguro", "Casco", "Luces Reglam.", "Alcoholemia", "Contramano", "Cruzar Semáforo Rojo") into touchable multi-select tiles.
- **Default State:** White surface, 1px border `#CBD5E1`, neutral text.
- **Selected State:** Pale warning or danger tint (`#FEF2F2` or `#FEF3C7`), 2px border `#DC2626` or `#D97706`, high-contrast check icon and bold status text.

### 4. Checkpoint Metric & Summary Cards
- Metric cards for checkpoint statistics (e.g., *Vehículos Controlados*, *Actas Labradas*, *Retenciones Preventivas*).
- Clean white card, left-edge 4px colored indicator strip (primary blue, alert red, warning amber), displaying bold numerical values in Space Grotesk.

### 5. Signature & Notification Block
- Dual digital capture pad for "Firma del Infractor" and "Firma del Actuante" with clear clear/reset actions.
- Legal disclaimer box (detailing the 3-day window to appear before the Dpto. de Rentas and the 40% early-settlement discount under Ord. N° 385/12) rendered inside a pale blue-gray container with crisp institutional typography.

### 6. Primary Action Buttons
- **Primary CTA:** Deep Navy background (`#0D2240`), white bold text, min-height 52px, spans full container width on mobile for straightforward thumb triggering.
- **Destructive/Retention Action:** High-contrast Red (`#DC2626`) for vehicle impoundment or license retention confirmations.