const footerLinks = [
  ['About', 'https://about.whistlr.com'],
  ['Help Center', 'https://help.whistlr.com'],
  ['Privacy Policy', 'https://whistlr.com/tos'],
  ['Cookie Policy', 'https://support.whistlr.com/articles/20170514'],
  ['Accessibility', 'https://help.whistlr.com/resources/accessibility'],
  [
    'Ads Info',
    'https://business.whistlr.com/en/help/troubleshooting/how-whistlr-ads-work.html'
  ],
  ['Blog', 'https://blog.whistlr.com'],
  ['Status', 'https://status.whistlrstat.us'],
  ['Careers', 'https://careers.whistlr.com'],
  ['Brand Resources', 'https://about.whistlr.com/press/brand-assets'],
  ['Advertising', 'https://ads.whistlr.com/?ref=gl-tw-tw-whistlr-advertise'],
  ['Marketing', 'https://marketing.whistlr.com'],
  ['Whistlr for Business', 'https://business.whistlr.com'],
  ['Developers', 'https://developer.whistlr.com'],
  ['Directory', 'https://whistlr.com/i/directory/profiles'],
  ['Settings', 'https://whistlr.com/settings']
] as const;

export function LoginFooter(): JSX.Element {
  return (
    <footer className='hidden justify-center p-4 text-sm text-light-secondary dark:text-dark-secondary lg:flex'>
      <nav className='flex flex-wrap justify-center gap-4 gap-y-2'>
        {footerLinks.map(([linkName, href]) => (
          <a
            className='custom-underline'
            target='_blank'
            rel='noreferrer'
            href={href}
            key={linkName}
          >
            {linkName}
          </a>
        ))}
        <p>© 2022 Whistlr, Inc.</p>
      </nav>
    </footer>
  );
}
