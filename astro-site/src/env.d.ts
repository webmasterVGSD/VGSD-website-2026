/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Base URL of the WordPress REST API, e.g. https://api.vgsd.nl/wp-json. Leave unset to use mock data. */
  readonly WORDPRESS_API_URL?: string;
  /** URL of the members-only login page on the WordPress subdomain, e.g. https://leden.vgsd.nl/wp-login.php */
  readonly WORDPRESS_MEMBERS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
