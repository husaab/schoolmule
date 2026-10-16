// src/lib/openSignedUrl.ts
// Opens a file behind a short-lived signed link in a new tab. The tab is
// opened inside the click, before the link is asked for, so popup blockers
// allow it; it is pointed at the file once the link arrives.

export async function openSignedUrl(getUrl: () => Promise<string>): Promise<void> {
  const tab = window.open('about:blank', '_blank')
  if (tab) tab.opener = null
  try {
    const url = await getUrl()
    if (tab) tab.location.href = url
    else window.location.assign(url)
  } catch (err) {
    tab?.close()
    throw err
  }
}
