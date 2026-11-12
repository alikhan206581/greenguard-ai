"""Optional, idempotent display/sample compatibility patch. Creates backups.
Usage: python patch_frontend.py ../frontend
Never changes credentials, API rewrites, or backend URLs.
"""
import re,sys
from pathlib import Path
root=Path(sys.argv[1] if len(sys.argv)>1 else '../frontend').resolve()
if not (root/'src/lib/types.ts').exists(): raise SystemExit('Expected frontend/src/lib/types.ts. Pass the correct frontend folder.')

def update(relative, transform):
    p=root/relative
    if not p.exists(): print('Not found:',relative);return
    old=p.read_text(encoding='utf-8');new=transform(old)
    if new==old:print('Already patched or pattern not matched:',relative);return
    backup=p.with_suffix(p.suffix+'.backend-backup')
    if not backup.exists():backup.write_text(old,encoding='utf-8')
    p.write_text(new,encoding='utf-8');print('Updated:',relative)

update('src/lib/utils.ts', lambda s:s.replace('return "0 kWh"','return "—"').replace('return "0.0%"','return "—"').replace('return "0.0"','return "—"'))
update('src/components/Header.tsx',lambda s:s.replace('Deterministic RAG</option>','Deterministic extraction</option>'))

def fair(s):
    marker='<div className="space-y-8 animate-fadeIn">'
    warning='<p role="note" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">SYNTHETIC BENCHMARK ONLY: these repeated demonstration cases do not establish real-world fairness, regulatory compliance or general attack resistance.</p>'
    return s if warning in s else s.replace(marker,marker+'\n      '+warning,1)
update('src/components/FairnessAuditTab.tsx',fair)

def solar(s):
    for a,b in [('scikit-learn Weather-Adjusted Target','User-supplied consumption target'),('NASA POWER Irradiance &amp; Temperature Check','Historical weather reference check'),('NASA Sunlight Expected Output','Weather-reference expected output'),('12-Month metered solar PV generation','Supplied-period metered solar PV generation'),('12-Month NASA Expected','Weather-reference expected'),('Root-Cause Breakdown (Why Total Consumption Changed)','Consumption differences — causes require review'),('Possible Technical Faults (Not Fraud)','Possible faults — inspection required')]:s=s.replace(a,b)
    return s
update('src/components/SolarVerificationWorkspace.tsx',solar)

def review(s):
    s=re.sub(r'metric\s*:\s*number\s*;', 'metric: number | null;', s)
    s=s.replace("typeof r.metric!=='number'", "(r.metric!==null && typeof r.metric!=='number')")
    s=s.replace('typeof review.metric !== "number"', '(review.metric !== null && typeof review.metric !== "number")')
    s=s.replace("first.period!=='Period not supplied';", "first.period!=='Period not supplied'&&first.metric!==null&&second.metric!==null;")
    s=s.replace('first.period !== "Period not supplied";', 'first.period !== "Period not supplied" && first.metric !== null && second.metric !== null;')
    s=re.sub(r'second\.metric\s*-\s*first\.metric', '(second.metric ?? 0) - (first.metric ?? 0)', s)
    return s
update('src/components/LocalAuditReview.tsx',review)

def samples(s):
    if 'Backend sample download' in s:return s
    match=re.search(r'  function (sample|downloadSample)\(\) \{',s)
    if not match:return s
    end=s.find('  const Icon =',match.start())
    if end<0:return s
    name=match[1]
    body='''  async function NAME() {
    // Backend sample download: schema is authoritative for this backend.
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "";
      const filename = evidence === "solar" ? "solar.csv" : "case_1_supported.csv";
      const response = await fetch(`${base}/api/v1/samples/${filename}`);
      if (!response.ok) throw new Error("Start the backend to download an accepted sample.");
      downloadText(filename, await response.text());
      setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Sample download failed.");
    }
  }
'''.replace('NAME',name)
    return s[:match.start()]+body+s[end:]
update('src/components/FileDropzone.tsx',samples)
print('Complete. Review backups and run npm run build in frontend. Restart Next.js if needed.')
