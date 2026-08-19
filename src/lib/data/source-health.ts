import { fetchOfficialSource } from "@/lib/data/source-fetch";
import {
  SOURCE_IDS,
  SOURCE_POLICIES,
  type SourceId,
  type SourcePolicy,
} from "@/lib/data/source-policy";
import { IPA_ENTI_RESOURCE_ID } from "@/lib/ipa";

export type SourceIntegrationState = "active" | "mapped";
export type SourceReachability = "up" | "down" | "not-probed";

export type SourceHealth = {
  sourceId: SourceId;
  label: string;
  owner: string;
  integration: SourceIntegrationState;
  reachability: SourceReachability;
  checkedAt: string;
  latencyMs: number | null;
  detail: string | null;
  recordCount: number | null;
  policy: Pick<
    SourcePolicy,
    | "cadence"
    | "cadenceNote"
    | "discoveryRevalidateSeconds"
    | "dataRevalidateSeconds"
    | "staleAfterSeconds"
    | "sourceUrl"
  >;
};

type CkanDatastoreHealthResponse = {
  success?: boolean;
  result?: {
    total?: number;
  };
};

type CkanPackageListResponse = {
  success?: boolean;
  result?: unknown[];
};

const ACTIVE_SOURCES = new Set<SourceId>(["ipa", "openbdap"]);

function baseHealth(sourceId: SourceId): Omit<SourceHealth, "reachability" | "latencyMs" | "detail" | "recordCount"> {
  const policy = SOURCE_POLICIES[sourceId];
  return {
    sourceId,
    label: policy.label,
    owner: policy.owner,
    integration: ACTIVE_SOURCES.has(sourceId) ? "active" : "mapped",
    checkedAt: new Date().toISOString(),
    policy: {
      cadence: policy.cadence,
      cadenceNote: policy.cadenceNote,
      discoveryRevalidateSeconds: policy.discoveryRevalidateSeconds,
      dataRevalidateSeconds: policy.dataRevalidateSeconds,
      staleAfterSeconds: policy.staleAfterSeconds,
      sourceUrl: policy.sourceUrl,
    },
  };
}

async function probeIpa(): Promise<SourceHealth> {
  const base = baseHealth("ipa");
  const startedAt = performance.now();
  const url = `https://indicepa.gov.it/ipa-dati/api/3/action/datastore_search?${new URLSearchParams({
    resource_id: IPA_ENTI_RESOURCE_ID,
    limit: "0",
  }).toString()}`;

  try {
    const response = await fetchOfficialSource("ipa", url, {
      kind: "discovery",
      headers: { Accept: "application/json" },
      tags: ["health:ipa", "dataset:ipa-enti"],
    });
    const latencyMs = Math.round(performance.now() - startedAt);

    if (!response.ok) {
      return {
        ...base,
        reachability: "down",
        latencyMs,
        detail: `HTTP ${response.status}`,
        recordCount: null,
      };
    }

    const payload = (await response.json()) as CkanDatastoreHealthResponse;
    if (!payload.success) {
      return {
        ...base,
        reachability: "down",
        latencyMs,
        detail: "Risposta CKAN non valida",
        recordCount: null,
      };
    }

    return {
      ...base,
      reachability: "up",
      latencyMs,
      detail: "Data API Enti raggiungibile",
      recordCount: typeof payload.result?.total === "number" ? payload.result.total : null,
    };
  } catch (error) {
    return {
      ...base,
      reachability: "down",
      latencyMs: Math.round(performance.now() - startedAt),
      detail: error instanceof Error ? error.message : "Errore sconosciuto",
      recordCount: null,
    };
  }
}

async function probeOpenBdap(): Promise<SourceHealth> {
  const base = baseHealth("openbdap");
  const startedAt = performance.now();
  const url = "https://bdap-opendata.rgs.mef.gov.it/SpodCkanApi/api/3/action/package_list";

  try {
    const response = await fetchOfficialSource("openbdap", url, {
      kind: "discovery",
      headers: { Accept: "application/json" },
      tags: ["health:openbdap", "catalog:openbdap"],
    });
    const latencyMs = Math.round(performance.now() - startedAt);

    if (!response.ok) {
      return {
        ...base,
        reachability: "down",
        latencyMs,
        detail: `HTTP ${response.status}`,
        recordCount: null,
      };
    }

    const payload = (await response.json()) as CkanPackageListResponse;
    if (!payload.success || !Array.isArray(payload.result)) {
      return {
        ...base,
        reachability: "down",
        latencyMs,
        detail: "Catalogo CKAN non valido",
        recordCount: null,
      };
    }

    return {
      ...base,
      reachability: "up",
      latencyMs,
      detail: "Catalogo OpenBDAP raggiungibile",
      recordCount: payload.result.length,
    };
  } catch (error) {
    return {
      ...base,
      reachability: "down",
      latencyMs: Math.round(performance.now() - startedAt),
      detail: error instanceof Error ? error.message : "Errore sconosciuto",
      recordCount: null,
    };
  }
}

function mappedSource(sourceId: SourceId): SourceHealth {
  return {
    ...baseHealth(sourceId),
    reachability: "not-probed",
    latencyMs: null,
    detail: "Adapter dati non ancora attivo: non attribuiamo uno stato di rete artificiale.",
    recordCount: null,
  };
}

export async function getSourceHealthOverview(): Promise<SourceHealth[]> {
  const [ipa, openbdap] = await Promise.all([probeIpa(), probeOpenBdap()]);
  const live = new Map<SourceId, SourceHealth>([
    ["ipa", ipa],
    ["openbdap", openbdap],
  ]);

  return SOURCE_IDS.map((sourceId) => live.get(sourceId) ?? mappedSource(sourceId));
}
