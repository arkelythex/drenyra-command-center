"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Palette, Type, Camera, Sparkles, Download, Mail, Phone, FileText } from "lucide-react";

import {
  DocSection,
  DocCard,
  DocGrid,
  PageHeader,
  SectionTitle,
  IconBox,
  Badge,
  GradientText,
} from "@/components/docs/ui";

import {
  visualsHeader,
  colorTokens,
  typographyStyles,
  logoVariants,
  brandVoice,
  contactInfo,
} from "@/lib/data/docs/visuals";

import type { ColorToken, TypographyStyle, LogoVariant } from "@/lib/types/docs";

// ============================================================================
// COMPONENTES
// ============================================================================

function ColorTokenCard({ token }: { token: ColorToken }) {
  return (
    <DocCard variant="gradient" className="group">
      <div
        className="mb-4 h-16 w-full rounded-xl border border-border transition-transform motion-safe:group-hover:scale-[1.02]"
        style={{ backgroundColor: token.hex }}
      />
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-bold text-foreground">{token.name}</h3>
        <code className="rounded bg-card/60 px-2 py-1 font-mono text-xs text-accent">
          {token.hex}
        </code>
      </div>
      <p className="text-sm text-muted-foreground mb-2">{token.usage}</p>
      {token.cssVar && (
        <code className="font-mono text-2xs text-muted-foreground">{token.cssVar}</code>
      )}
    </DocCard>
  );
}

function TypographyCard({ style }: { style: TypographyStyle }) {
  return (
    <DocCard variant="outline" className="flex items-center justify-between">
      <div className="flex-1">
        <h3 className="mb-1 text-lg font-bold text-foreground">{style.name}</h3>
        <p className="text-xs text-muted-foreground">{style.usage}</p>
      </div>
      <div className="space-y-1 text-right font-mono text-xs text-muted-foreground">
        <div>{style.size}</div>
        <div>{style.weight}</div>
        <div>LH: {style.lineHeight}</div>
        {style.letterSpacing && <div>LS: {style.letterSpacing}</div>}
      </div>
    </DocCard>
  );
}

function LogoVariantCard({ variant }: { variant: LogoVariant }) {
  const bgColors: Record<string, string> = {
    dark: "border-border/40 bg-black",
    light: "bg-white",
    glass: "border-border bg-foreground/5 backdrop-blur",
  };

  return (
    <DocCard variant="gradient" className="text-center">
      <div className={`h-24 rounded-xl mb-4 flex items-center justify-center border ${bgColors[variant.background]}`}>
        <span className={`text-2xl font-black ${variant.background === "light" ? "text-black" : "text-white"}`}>
          Arkelythex
        </span>
      </div>
      <h3 className="mb-1 text-lg font-bold text-foreground">{variant.name}</h3>
      <p className="text-xs text-muted-foreground mb-3">{variant.usage}</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {variant.formats.map((format) => (
          <Badge key={format} variant="accent">{format}</Badge>
        ))}
      </div>
    </DocCard>
  );
}

function BrandVoiceSection() {
  return (
    <DocGrid cols={2}>
      <DocCard variant="gradient">
        <div className="flex items-center gap-3 mb-4">
          <IconBox icon={Sparkles} variant="success" />
          <h3 className="text-lg font-bold text-foreground">Haz</h3>
        </div>
        <ul className="space-y-2">
          {brandVoice.do.map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-primary">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </DocCard>
      
      <DocCard variant="gradient">
        <div className="flex items-center gap-3 mb-4">
          <IconBox icon={FileText} variant="default" />
          <h3 className="text-lg font-bold text-foreground">No Hagas</h3>
        </div>
        <ul className="space-y-2">
          {brandVoice.dont.map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-red-400">✕</span>
              {item}
            </li>
          ))}
        </ul>
      </DocCard>
    </DocGrid>
  );
}

function ContactSection() {
  return (
    <DocCard variant="outline" className="border-accent/25">
      <DocGrid cols={3}>
        <div className="text-center space-y-3">
          <IconBox icon={Mail} variant="accent" className="mx-auto" />
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Prensa</div>
            <a href={`mailto:${contactInfo.press}`} className="text-sm text-accent hover:text-accent/90 transition-colors">
              {contactInfo.press}
            </a>
          </div>
        </div>
        <div className="text-center space-y-3">
          <IconBox icon={Phone} variant="accent" className="mx-auto" />
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Teléfono</div>
            <a href={`tel:${contactInfo.phone}`} className="text-sm text-accent hover:text-accent/90 transition-colors">
              {contactInfo.phone}
            </a>
          </div>
        </div>
        <div className="text-center space-y-3">
          <IconBox icon={FileText} variant="accent" className="mx-auto" />
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Legal</div>
            <a href={`mailto:${contactInfo.legal}`} className="text-sm text-accent hover:text-accent/90 transition-colors">
              {contactInfo.legal}
            </a>
          </div>
        </div>
      </DocGrid>
    </DocCard>
  );
}

// ============================================================================
// PÁGINA PRINCIPAL
// ============================================================================

export default function VisualsPage() {
  return (
    <div className="space-y-16">
      {/* Header */}
      <PageHeader {...visualsHeader} />

      {/* Paleta de Colores */}
      <DocSection id="colores">
        <SectionTitle icon={Palette} title="Paleta de Colores" variant="accent" />
        <DocGrid cols={3}>
          {colorTokens.map((token) => (
            <ColorTokenCard key={token.name} token={token} />
          ))}
        </DocGrid>
      </DocSection>

      {/* Tipografía */}
      <DocSection id="tipografia">
        <SectionTitle icon={Type} title="Sistema de Tipografía" variant="accent" />
        <div className="space-y-3">
          {typographyStyles.map((style) => (
            <TypographyCard key={style.name} style={style} />
          ))}
        </div>
      </DocSection>

      {/* Logos */}
      <DocSection id="logos">
        <SectionTitle icon={Camera} title="Variantes de Logo" variant="accent" />
        <DocGrid cols={3}>
          {logoVariants.map((variant) => (
            <LogoVariantCard key={variant.name} variant={variant} />
          ))}
        </DocGrid>
      </DocSection>

      <DocSection id="ilustraciones">
        <SectionTitle icon={Sparkles} title="Ilustración" variant="accent" />
        <DocCard variant="outline" className="border-foreground/10">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Estilo sobrio, pocas capas y lectura rápida en UI densa. Evitar mascotas o metáforas que distraigan de datos
            fiscales. Coordinar encargos con prensa vía{" "}
            <a href={`mailto:${contactInfo.press}`} className="font-medium text-accent hover:underline">
              {contactInfo.press}
            </a>
            .
          </p>
        </DocCard>
      </DocSection>

      <DocSection id="fotografia">
        <SectionTitle icon={Camera} title="Fotografía" variant="accent" />
        <DocCard variant="outline" className="border-foreground/10">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Preferir luz neutra, fondos oscuros o grises fríos alineados a la paleta. Retratos y oficina: naturalidad sin
            saturación excesiva; coherencia con el look &quot;glass &amp; steel&quot; del producto.
          </p>
        </DocCard>
      </DocSection>

      <DocSection id="accesibilidad">
        <SectionTitle icon={Type} title="Accesibilidad" variant="accent" />
        <DocCard variant="outline" className="border-foreground/10">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Contraste AA como mínimo en texto UI, foco visible en controles, textos alternativos en gráficos de marca y
            respeto a <code className="font-mono text-xs">prefers-reduced-motion</code>. Los tokens del design system
            documentan colores base; validar combinaciones en cada pantalla nueva.
          </p>
        </DocCard>
      </DocSection>

      {/* Voz de Marca */}
      <DocSection id="voz-marca">
        <SectionTitle icon={Sparkles} title="Guía de Voz de Marca" variant="accent" />
        <BrandVoiceSection />
      </DocSection>

      {/* Contacto */}
      <DocSection id="contacto">
        <SectionTitle icon={Mail} title="Contacto de Marca" variant="accent" />
        <ContactSection />
      </DocSection>

      {/* CTA — Media kit / recursos descargables */}
      <DocCard id="descarga" variant="outline" className="space-y-6 border-accent/25 text-center">
        <Badge variant="accent">
          <Download className="w-3 h-3" />
          Media Kit Completo
        </Badge>
        <h2 className="text-3xl font-bold text-foreground">
          Descarga todos los <GradientText>recursos</GradientText>
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Obtén acceso completo a logos en alta resolución, guías de marca y más.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <button
            type="button"
            className="group flex items-center gap-2 rounded-full bg-primary px-8 py-4 font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Download className="h-4 w-4" />
            Descargar Media Kit
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
          <Link
            href={`mailto:${contactInfo.press}`}
            className="flex items-center gap-2 rounded-full border border-border px-8 py-4 font-semibold text-foreground transition-colors hover:border-accent/40 hover:bg-card/50"
          >
            <Mail className="w-4 h-4" />
            Contactar Prensa
          </Link>
        </div>
      </DocCard>
    </div>
  );
}
