
import React from 'react';

export const EnterprisePage = () => (
  <div className="max-w-4xl mx-auto py-20 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div className="text-center mb-16">
      <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-6 inline-block">Enterprise Solutions</span>
      <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-6">Compliance at Scale</h1>
      <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">Stop manual auditing. Connect Consent Cop to your CI/CD pipeline and catch privacy regressions before they hit production.</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
        </div>
        <h3 className="text-xl font-bold mb-3 text-slate-900">Agency White-Label</h3>
        <p className="text-slate-500 text-sm leading-relaxed">Generate PDF reports with your own logo for clients. Full API access to integrate with your existing consulting workflow.</p>
      </div>
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
        </div>
        <h3 className="text-xl font-bold mb-3 text-slate-900">Unlimited Scanning</h3>
        <p className="text-slate-500 text-sm leading-relaxed">No daily limits. Scan thousands of pages across entire domains automatically every week. Instant Slack/Email alerts.</p>
      </div>
    </div>

    <div className="bg-slate-900 rounded-[3rem] p-12 text-center text-white overflow-hidden relative shadow-2xl">
      <div className="relative z-10">
        <h2 className="text-3xl font-black mb-6">Ready to secure your stack?</h2>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-black px-12 py-4 rounded-2xl text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-900/40">
          Book Enterprise Demo
        </button>
      </div>
    </div>
  </div>
);

export const DocsPage = () => (
  <div className="max-w-4xl mx-auto py-20 px-4">
    <h1 className="text-4xl font-black text-slate-900 mb-8 tracking-tighter">Documentation</h1>
    <div className="space-y-12">
      <section>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">How it works</h2>
        <p className="text-slate-600 leading-relaxed mb-4">Consent Cop utilizes a swarm of headless browser drones (Chromium-based) to simulate a first-time user visit from various EU regions. Our kernel-level interception catches network requests *before* the browser even processes the first script of a page.</p>
        <div className="bg-slate-900 p-6 rounded-2xl font-mono text-xs text-blue-300 shadow-inner">
           # Drone Initialization Sequence<br/>
           {/* Fix: Wrapped lines with curly braces in strings to prevent JSX from interpreting them as variables/objects */}
           {"await drone.emulate({ region: 'DE-BER', bandwidth: '4G' });"}<br/>
           {"await drone.intercept('network', (req) => analyze(req));"}
        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">The Compliance Score</h2>
        <p className="text-slate-600 leading-relaxed">Scores are calculated using a weighted average of three factors:</p>
        <ul className="mt-4 space-y-3 list-disc list-inside text-slate-500 text-sm font-medium">
          <li><span className="font-bold text-slate-900">Fatal Violations (60%):</span> Pixels fired before consent.</li>
          <li><span className="font-bold text-slate-900">Transparency (30%):</span> CMP clarity and TMS configuration.</li>
          <li><span className="font-bold text-slate-900">Data Minimization (10%):</span> Unnecessary PII leakage in query parameters.</li>
        </ul>
      </section>
    </div>
  </div>
);

export const ImpressumPage = () => (
  <div className="max-w-3xl mx-auto py-20 px-4 text-slate-600 prose prose-slate">
    <h1 className="text-3xl font-black text-slate-900 mb-10 tracking-tight">Impressum</h1>
    <p className="font-bold text-slate-900 mb-2">Angaben gemäß § 5 TMG</p>
    <p className="mb-8">Consent Cop Berlin GmbH<br/>Kurfürstendamm 213<br/>10719 Berlin</p>
    
    <p className="font-bold text-slate-900 mb-2">Vertreten durch:</p>
    <p className="mb-8">Max Mustermann, Geschäftsführender Gesellschafter</p>
    
    <p className="font-bold text-slate-900 mb-2">Kontakt:</p>
    <p className="mb-8">Telefon: +49 (0) 30 12345678<br/>E-Mail: hello@consent-cop.berlin</p>
    
    <p className="font-bold text-slate-900 mb-2">Umsatzsteuer-ID:</p>
    <p className="mb-8">Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br/>DE123456789</p>
    
    <p className="font-bold text-slate-900 mb-2">Streitschlichtung:</p>
    <p className="text-sm">Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: https://ec.europa.eu/consumers/odr. Unsere E-Mail-Adresse finden Sie oben im Impressum.</p>
  </div>
);

export const PrivacyPage = () => (
  <div className="max-w-3xl mx-auto py-20 px-4 text-slate-600 prose prose-slate">
    <h1 className="text-3xl font-black text-slate-900 mb-10 tracking-tight">Datenschutzerklärung</h1>
    
    <section className="mb-8">
      <h2 className="text-xl font-bold text-slate-900 mb-4">1. Datenerhebung und -speicherung</h2>
      <p className="mb-4">
        Consent Cop erhebt und speichert personenbezogene Daten nur im erforderlichen Umfang für die Bereitstellung des Dienstes. 
        Bei der Registrierung über Google OAuth werden folgende Daten erfasst:
      </p>
      <ul className="list-disc list-inside space-y-2 mb-4">
        <li>E-Mail-Adresse</li>
        <li>Name (sofern von Google bereitgestellt)</li>
        <li>Profilbild (optional)</li>
        <li>Browser-Informationen</li>
        <li>Zeitzone (als Standorthinweis)</li>
      </ul>
    </section>

    <section className="mb-8">
      <h2 className="text-xl font-bold text-slate-900 mb-4">2. Verwendung der Daten</h2>
      <p className="mb-4">
        Die erhobenen Daten werden ausschließlich für folgende Zwecke verwendet:
      </p>
      <ul className="list-disc list-inside space-y-2 mb-4">
        <li>Bereitstellung und Verbesserung des Consent Cop Dienstes</li>
        <li>Verwaltung von Benutzerkonten und Scan-Limits</li>
        <li>Kommunikation bezüglich des Dienstes</li>
        <li>Analyse der Nutzung zur Verbesserung der Funktionalität</li>
      </ul>
    </section>

    <section className="mb-8">
      <h2 className="text-xl font-bold text-slate-900 mb-4">3. Datenweitergabe</h2>
      <p className="mb-4">
        Wir geben Ihre personenbezogenen Daten nicht an Dritte weiter, außer:
      </p>
      <ul className="list-disc list-inside space-y-2 mb-4">
        <li>Google (für OAuth-Authentifizierung) - gemäß Google's Datenschutzrichtlinie</li>
        <li>Google Sheets (für Benutzerregistrierung) - nur wenn Sie sich registrieren</li>
        <li>Bei gesetzlicher Verpflichtung oder gerichtlicher Anordnung</li>
      </ul>
    </section>

    <section className="mb-8">
      <h2 className="text-xl font-bold text-slate-900 mb-4">4. Ihre Rechte</h2>
      <p className="mb-4">
        Sie haben das Recht:
      </p>
      <ul className="list-disc list-inside space-y-2 mb-4">
        <li>Auskunft über Ihre gespeicherten Daten zu erhalten</li>
        <li>Berichtigung unrichtiger Daten zu verlangen</li>
        <li>Löschung Ihrer Daten zu verlangen</li>
        <li>Widerspruch gegen die Verarbeitung Ihrer Daten einzulegen</li>
        <li>Datenübertragbarkeit zu verlangen</li>
      </ul>
      <p className="mb-4">
        Kontaktieren Sie uns hierfür unter: <a href="mailto:privacy@consent-cop.berlin" className="text-blue-600 hover:underline">privacy@consent-cop.berlin</a>
      </p>
    </section>

    <section className="mb-8">
      <h2 className="text-xl font-bold text-slate-900 mb-4">5. Datensicherheit</h2>
      <p className="mb-4">
        Wir setzen technische und organisatorische Maßnahmen ein, um Ihre Daten vor unbefugtem Zugriff, Verlust oder Zerstörung zu schützen. 
        Alle Datenübertragungen erfolgen verschlüsselt (TLS 1.3).
      </p>
    </section>

    <section className="mb-8">
      <h2 className="text-xl font-bold text-slate-900 mb-4">6. Cookies und Tracking</h2>
      <p className="mb-4">
        Consent Cop verwendet keine Cookies für Tracking-Zwecke. Wir verwenden nur technisch notwendige Cookies für die 
        Funktionalität der Anwendung (z.B. Session-Management).
      </p>
    </section>

    <section className="mb-8">
      <h2 className="text-xl font-bold text-slate-900 mb-4">7. Änderungen dieser Datenschutzerklärung</h2>
      <p className="mb-4">
        Wir behalten uns vor, diese Datenschutzerklärung anzupassen. Aktuelle Version: Januar 2025.
      </p>
    </section>

    <div className="mt-12 p-6 bg-slate-50 rounded-xl border border-slate-200">
      <p className="text-sm text-slate-600">
        <strong>Kontakt für Datenschutzanfragen:</strong><br/>
        Consent Cop Berlin GmbH<br/>
        Kurfürstendamm 213<br/>
        10719 Berlin<br/>
        E-Mail: <a href="mailto:privacy@consent-cop.berlin" className="text-blue-600 hover:underline">privacy@consent-cop.berlin</a>
      </p>
    </div>
  </div>
);

export const SecurityPage = () => (
  <div className="max-w-4xl mx-auto py-20 px-4 text-center">
    <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto mb-10 flex items-center justify-center text-white shadow-xl shadow-blue-200">
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
    </div>
    <h1 className="text-4xl font-black text-slate-900 mb-6 tracking-tighter">Enterprise Grade Security</h1>
    <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed mb-12">All analysis happens in ephemeral sandboxed environments. We never store raw data captures from your site—only the compliance metadata required for the report.</p>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="p-6 bg-white border border-slate-100 rounded-2xl">
        <h4 className="font-bold text-slate-900 mb-2">TLS 1.3 Encryption</h4>
        <p className="text-xs text-slate-400">All data in transit is protected by industrial-strength encryption.</p>
      </div>
      <div className="p-6 bg-white border border-slate-100 rounded-2xl">
        <h4 className="font-bold text-slate-900 mb-2">No Persisted PII</h4>
        <p className="text-xs text-slate-400">Captured beacons are anonymized before being processed by AI.</p>
      </div>
      <div className="p-6 bg-white border border-slate-100 rounded-2xl">
        <h4 className="font-bold text-slate-900 mb-2">Frankfurt Hosting</h4>
        <p className="text-xs text-slate-400">Sovereign infrastructure hosted exclusively in the European Union.</p>
      </div>
    </div>
  </div>
);
