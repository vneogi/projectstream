type IconProps = {
  name: IconName;
  className?: string;
};

export type IconName =
  | "arrow-right"
  | "atom"
  | "beaker"
  | "book"
  | "check"
  | "code"
  | "cog"
  | "compass"
  | "inbox"
  | "leaf"
  | "menu"
  | "close"
  | "search"
  | "send"
  | "sigma"
  | "sparkles"
  | "tag"
  | "users";

const paths: Record<IconName, React.ReactNode> = {
  "arrow-right": <path d="M5 12h14m0 0-6-6m6 6-6 6" />,
  atom: (
    <>
      <circle cx="12" cy="12" r="2" />
      <path d="M20.2 20.2c1.6-1.6-.6-6.3-4.9-10.6C11 5.3 6.3 3.1 4.7 4.7c-1.6 1.6.6 6.3 4.9 10.6 4.3 4.3 9 6.5 10.6 4.9Z" />
      <path d="M4.7 20.2c-1.6-1.6.6-6.3 4.9-10.6C14 5.3 18.7 3.1 20.3 4.7c1.6 1.6-.6 6.3-4.9 10.6-4.3 4.3-9 6.5-10.7 4.9Z" />
    </>
  ),
  beaker: (
    <>
      <path d="M6 3h12M8 3v6.5L4.5 17A3 3 0 0 0 7.2 21h9.6a3 3 0 0 0 2.7-4L16 9.5V3" />
      <path d="M6.5 14h11" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Z" />
      <path d="M20 18v3H6.5A2.5 2.5 0 0 1 4 18.5" />
    </>
  ),
  check: <path d="m4.5 12.5 5 5 10-11" />,
  code: <path d="m8 6-6 6 6 6m8-12 6 6-6 6" />,
  cog: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3m0 14v3M4.9 4.9l2.1 2.1m10 10 2.1 2.1M2 12h3m14 0h3M4.9 19.1 7 17m10-10 2.1-2.1" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5.5-5.5 2 2-5.5 5.5-2Z" />
    </>
  ),
  inbox: (
    <>
      <path d="M3 12h5l2 3h4l2-3h5" />
      <path d="M5.5 5h13l2.5 7v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5l2.5-7Z" />
    </>
  ),
  leaf: (
    <>
      <path d="M4 20c0-8 5-14 16-15 1 11-5 16-13 16H4Z" />
      <path d="M4 20c3-6 7-9 12-10" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4.2-4.2" />
    </>
  ),
  send: <path d="M4 12 20 4l-3.5 16-4.5-6-8-2Z" />,
  sigma: <path d="M18 4H6l7 8-7 8h12" />,
  sparkles: (
    <>
      <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3Z" />
      <path d="M18.5 15.5l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9.9-2.3Z" />
    </>
  ),
  tag: (
    <>
      <path d="M3 11.5V4a1 1 0 0 1 1-1h7.5L21 12.5 12.5 21 3 11.5Z" />
      <circle cx="7.5" cy="7.5" r="1.3" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M17.5 20a6.4 6.4 0 0 0-2-4.6" />
    </>
  ),
};

export function Icon({ name, className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
