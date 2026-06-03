export const getHostname = (href?: string) => {
  if (!href) {
    return '';
  }

  try {
    return new URL(href).hostname;
  } catch {
    return href;
  }
};

