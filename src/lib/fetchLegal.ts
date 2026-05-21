export interface LegalPages {
  programId: string;
  impressumText?: string;
  privacyPolicyText?: string;
  agbText?: string;
  cookiePolicyText?: string;
  lastUpdatedAt?: string;
}

export async function fetchLegalPages(): Promise<LegalPages | null> {
  const base = import.meta.env.CP_API_BASE_URL;
  const programId = import.meta.env.LUNAFAMILY_PROGRAM_ID;

  if (!base || !programId) {
    console.warn('[legal] CP_API_BASE_URL oder LUNAFAMILY_PROGRAM_ID fehlt');
    return null;
  }

  try {
    const res = await fetch(`${base}/programs/homepage/${programId}/legal-pages`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as LegalPages;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`[legal] API nicht erreichbar (${msg}), Fallback-Platzhalter wird angezeigt`);
    return null;
  }
}
