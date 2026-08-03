const PORTFOLIO_BASE_DOMAIN = "bowizzy.com";

// Extracts the portfolio subdomain from the current hostname, e.g.
// "jane.bowizzy.com" -> "jane". Returns null for the apex/www app domain,
// localhost, Vercel preview domains, or any host that isn't a direct
// subdomain of PORTFOLIO_BASE_DOMAIN.
export function getPortfolioSubdomain(): string | null {
  const host = window.location.hostname;

  if (host === PORTFOLIO_BASE_DOMAIN || host === `www.${PORTFOLIO_BASE_DOMAIN}`) {
    return null;
  }
  if (!host.endsWith(`.${PORTFOLIO_BASE_DOMAIN}`)) {
    return null;
  }

  const sub = host.slice(0, -(PORTFOLIO_BASE_DOMAIN.length + 1));
  if (!sub || sub.includes(".")) {
    return null;
  }

  return sub;
}
