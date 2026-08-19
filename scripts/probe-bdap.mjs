const BASE = "https://bdap-opendata.rgs.mef.gov.it";
const API = `${BASE}/SpodCkanApi/api/3/action`;

const products = [
  "PBS_SPE_M06_MISS_001",
  "PBS_SPE_M06_MISAM_001",
  "PBS_SPE_M06_AMCE2_001",
];

const headers = {
  Accept: "application/json",
  "User-Agent": "TrasparenzaItalia-BDAP-Probe/0.1 (+https://github.com/metaforismo/trasparenzaitalia)",
};

async function json(url) {
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(15000),
  });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text.slice(0, 600);
  }
  return { status: response.status, body };
}

function summarizePackage(pkg) {
  return {
    id: pkg?.id,
    name: pkg?.name,
    title: pkg?.title,
    notes: pkg?.notes,
    metadata_modified: pkg?.metadata_modified,
    resources: Array.isArray(pkg?.resources)
      ? pkg.resources.map((resource) => ({
          id: resource?.id,
          name: resource?.name,
          format: resource?.format,
          url: resource?.url,
          datastore_active: resource?.datastore_active,
        }))
      : [],
  };
}

async function csvHeader(uuid) {
  const dumpUrl = `${BASE}/SpodCkanApi/api/3/datastore/dump/${uuid}.csv`;
  const response = await fetch(dumpUrl, {
    headers: {
      ...headers,
      Accept: "text/csv",
      Range: "bytes=0-4095",
    },
    signal: AbortSignal.timeout(12000),
  });

  if (!response.body) {
    return { status: response.status, sample: "no body" };
  }

  const reader = response.body.getReader();
  const first = await reader.read();
  await reader.cancel();
  const sample = first.value ? new TextDecoder("latin1").decode(first.value).slice(0, 1500) : "";

  return {
    status: response.status,
    contentType: response.headers.get("content-type"),
    contentRange: response.headers.get("content-range"),
    sample: sample.replaceAll("\n", "\\n"),
  };
}

for (const product of products) {
  console.log(`\n=== ${product} ===`);
  const searchUrl = `${API}/package_search?${new URLSearchParams({ q: product }).toString()}`;
  const search = await json(searchUrl);
  console.log("package_search status", search.status);

  const packages = search.body?.result?.results ?? search.body?.result ?? [];
  const list = Array.isArray(packages) ? packages : [];
  console.log("result count", search.body?.result?.count, "packages", list.length);

  for (const pkg of list.slice(0, 3)) {
    console.log(JSON.stringify(summarizePackage(pkg), null, 2));

    const candidates = [
      ...(Array.isArray(pkg?.resources) ? pkg.resources.map((resource) => resource?.id) : []),
      pkg?.id,
    ].filter((value) => typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value));

    for (const uuid of [...new Set(candidates)].slice(0, 3)) {
      try {
        const dump = await csvHeader(uuid);
        console.log("dump", uuid, JSON.stringify(dump));
      } catch (error) {
        console.log("dump", uuid, "ERROR", error instanceof Error ? error.message : String(error));
      }

      try {
        const odataUrl = `${BASE}/ODataProxy/MdData('${uuid}@rgs')/DataRows?$top=1`;
        const odata = await json(odataUrl);
        console.log("odata", uuid, odata.status, JSON.stringify(odata.body).slice(0, 1800));
      } catch (error) {
        console.log("odata", uuid, "ERROR", error instanceof Error ? error.message : String(error));
      }
    }
  }
}
